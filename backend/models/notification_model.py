from bson import ObjectId
from datetime import datetime
from models.db import db

notifications_collection = db["notifications"]
user_notifications_collection = db["user_notifications"]
users_collection = db["users"]

class NotificationModel:

    @staticmethod
    def create_notification(data):
        notification = {
            "title": data.get("title", "").strip(),
            "message": data.get("message", "").strip(),
            "created_by": ObjectId(data["created_by"]),
            "created_at": datetime.utcnow()
        }
        result = notifications_collection.insert_one(notification)

        users = list(users_collection.find({"role": "user", "is_active": True}))
        bulk_docs = []
        for user in users:
            bulk_docs.append({
                "notification_id": result.inserted_id,
                "user_id": user["_id"],
                "is_deleted": False,
                "assigned_at": datetime.utcnow()
            })

        if bulk_docs:
            user_notifications_collection.insert_many(bulk_docs)

        return result

    @staticmethod
    def get_user_notifications(user_id):
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
            {"$sort": {"notification.created_at": -1}}
        ]
        return list(user_notifications_collection.aggregate(pipeline))

    @staticmethod
    def delete_user_notification(user_id, user_notification_id):
        return user_notifications_collection.update_one(
            {
                "_id": ObjectId(user_notification_id),
                "user_id": ObjectId(user_id)
            },
            {"$set": {"is_deleted": True}}
        )