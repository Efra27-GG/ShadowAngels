from bson import ObjectId
from datetime import datetime
from models.db import db

notifications_collection = db["notifications"]
user_notifications_collection = db["user_notifications"]
users_collection = db["users"]


class NotificationModel:

    @staticmethod
    def create_notification(data):
        status = data.get("status", "draft")
        scheduled_for = data.get("scheduled_for")

        notification = {
            "title": data.get("title", "").strip(),
            "summary": data.get("summary", "").strip(),
            "content": data.get("content", "").strip(),
            "image": data.get("image", "").strip(),
            "status": status,
            "created_by": ObjectId(data["created_by"]),
            "created_at": datetime.utcnow(),
            "scheduled_for": scheduled_for,
            "published_at": datetime.utcnow() if status == "published" else None
        }
        result = notifications_collection.insert_one(notification)
        notification = notifications_collection.find_one({"_id": result.inserted_id})

        if status == "published":
            NotificationModel.assign_to_users(notification)

        return notification

    @staticmethod
    def get_all():
        NotificationModel.publish_due_notifications()
        return list(notifications_collection.find({}).sort("created_at", -1))

    @staticmethod
    def get_by_id(notification_id):
        try:
            return notifications_collection.find_one({"_id": ObjectId(notification_id)})
        except:
            return None

    @staticmethod
    def update_notification(notification_id, data):
        current = NotificationModel.get_by_id(notification_id)
        if not current:
            return None

        next_status = data.get("status", current.get("status", "draft"))
        update_fields = {
            "title": data.get("title", current.get("title", "")).strip(),
            "summary": data.get("summary", current.get("summary", "")).strip(),
            "content": data.get("content", current.get("content", "")).strip(),
            "image": data.get("image", current.get("image", "")).strip(),
            "status": next_status,
            "scheduled_for": data.get("scheduled_for", current.get("scheduled_for")),
        }

        if next_status == "published" and not current.get("published_at"):
            update_fields["published_at"] = datetime.utcnow()

        notifications_collection.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": update_fields}
        )

        updated = NotificationModel.get_by_id(notification_id)

        if next_status == "published" and current.get("status") != "published":
            NotificationModel.assign_to_users(updated)

        return updated

    @staticmethod
    def delete_notification(notification_id):
        user_notifications_collection.delete_many({"notification_id": ObjectId(notification_id)})
        return notifications_collection.delete_one({"_id": ObjectId(notification_id)})

    @staticmethod
    def publish_due_notifications():
        now = datetime.utcnow().isoformat()
        due_notifications = list(notifications_collection.find({
            "status": "scheduled",
            "scheduled_for": {"$lte": now}
        }))

        for notification in due_notifications:
            notifications_collection.update_one(
                {"_id": notification["_id"]},
                {"$set": {"status": "published", "published_at": datetime.utcnow()}}
            )
            published = NotificationModel.get_by_id(str(notification["_id"]))
            NotificationModel.assign_to_users(published)

    @staticmethod
    def assign_to_users(notification):
        if not notification:
            return

        users = list(users_collection.find({"role": "user", "is_active": True}))
        bulk_docs = []

        for user in users:
            exists = user_notifications_collection.find_one({
                "notification_id": notification["_id"],
                "user_id": user["_id"]
            })
            if exists:
                continue

            bulk_docs.append({
                "notification_id": notification["_id"],
                "user_id": user["_id"],
                "is_deleted": False,
                "is_read": False,
                "assigned_at": datetime.utcnow()
            })

        if bulk_docs:
            user_notifications_collection.insert_many(bulk_docs)

    @staticmethod
    def get_user_notifications(user_id):
        NotificationModel.publish_due_notifications()
        pipeline = [
            {
                "$match": {
                    "user_id": ObjectId(user_id),
                    "is_deleted": False
                }
            },
            {
                "$lookup": {
                    "from": "notifications",
                    "localField": "notification_id",
                    "foreignField": "_id",
                    "as": "notification"
                }
            },
            {"$unwind": "$notification"},
            {"$sort": {"notification.published_at": -1, "notification.created_at": -1}}
        ]
        return list(user_notifications_collection.aggregate(pipeline))

    @staticmethod
    def mark_as_read(user_id, user_notification_id):
        return user_notifications_collection.update_one(
            {
                "_id": ObjectId(user_notification_id),
                "user_id": ObjectId(user_id)
            },
            {"$set": {"is_read": True}}
        )

    @staticmethod
    def delete_user_notification(user_id, user_notification_id):
        return user_notifications_collection.update_one(
            {
                "_id": ObjectId(user_notification_id),
                "user_id": ObjectId(user_id)
            },
            {"$set": {"is_deleted": True}}
        )
