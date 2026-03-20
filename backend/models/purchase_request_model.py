from bson import ObjectId
from datetime import datetime
from models.db import db

purchase_requests_collection = db["purchase_requests"]


class PurchaseRequestModel:

    @staticmethod
    def create_or_get_pending(data):
        query = {"status": "pending"}
        if data.get("user_id"):
            query["user_id"] = ObjectId(data["user_id"])
            query["product_id"] = ObjectId(data["product_id"])
            query["selected_size"] = data["selected_size"]
        else:
            query["guest_contact"] = data["guest_contact"].strip()
            query["product_id"] = ObjectId(data["product_id"])
            query["selected_size"] = data["selected_size"]

        existing = purchase_requests_collection.find_one({
            **query
        })

        if existing:
            return existing, False

        purchase_request = {
            "user_id": ObjectId(data["user_id"]) if data.get("user_id") else None,
            "user_name": data["user_name"],
            "user_email": data.get("user_email", ""),
            "is_guest": not bool(data.get("user_id")),
            "guest_contact": data.get("guest_contact", "").strip(),
            "request_type": "single",
            "product_id": ObjectId(data["product_id"]),
            "product_name": data["product_name"],
            "selected_size": data["selected_size"],
            "channel": data["channel"],
            "status": "pending",
            "admin_note": "",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "confirmed_at": None,
            "confirmed_by": None
        }

        result = purchase_requests_collection.insert_one(purchase_request)
        created = purchase_requests_collection.find_one({"_id": result.inserted_id})
        return created, True

    @staticmethod
    def create_from_cart(data):
        purchase_request = {
            "user_id": ObjectId(data["user_id"]),
            "user_name": data["user_name"],
            "user_email": data["user_email"],
            "request_type": "cart",
            "cart_id": ObjectId(data["cart_id"]),
            "items": [
                {
                    "product_id": ObjectId(item["product_id"]),
                    "product_name": item["product_name"],
                    "selected_size": item["selected_size"],
                    "product_image": item.get("product_image", ""),
                    "price": float(item.get("price", 0)),
                    "final_price": float(item.get("final_price", 0)),
                    "quantity": int(item.get("quantity", 1))
                }
                for item in data["items"]
            ],
            "channel": data["channel"],
            "status": "pending",
            "admin_note": "",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "confirmed_at": None,
            "confirmed_by": None
        }

        result = purchase_requests_collection.insert_one(purchase_request)
        return purchase_requests_collection.find_one({"_id": result.inserted_id})

    @staticmethod
    def get_by_cart_id(cart_id):
        try:
            return purchase_requests_collection.find_one(
                {"cart_id": ObjectId(cart_id)},
                sort=[("created_at", -1)]
            )
        except:
            return None

    @staticmethod
    def get_all():
        return list(purchase_requests_collection.find({}).sort("created_at", -1))

    @staticmethod
    def get_user_history(user_id):
        return list(purchase_requests_collection.find({
            "user_id": ObjectId(user_id),
            "status": {"$in": ["pending", "confirmed"]}
        }).sort("created_at", -1))

    @staticmethod
    def get_by_id(request_id):
        try:
            return purchase_requests_collection.find_one({"_id": ObjectId(request_id)})
        except:
            return None

    @staticmethod
    def delete(request_id):
        try:
            return purchase_requests_collection.delete_one({"_id": ObjectId(request_id)})
        except:
            return None

    @staticmethod
    def update_status(request_id, status, admin_id, admin_note=""):
        update_fields = {
            "status": status,
            "admin_note": admin_note,
            "updated_at": datetime.utcnow(),
            "confirmed_by": ObjectId(admin_id)
        }

        if status == "confirmed":
            update_fields["confirmed_at"] = datetime.utcnow()
        else:
            update_fields["confirmed_at"] = None

        return purchase_requests_collection.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": update_fields}
        )

    @staticmethod
    def get_user_product_status(user_id, product_id):
        try:
            confirmed = purchase_requests_collection.find_one(
                {
                    "user_id": ObjectId(user_id),
                    "status": "confirmed",
                    "$or": [
                        {"product_id": ObjectId(product_id)},
                        {"items.product_id": ObjectId(product_id)}
                    ]
                },
                sort=[("confirmed_at", -1), ("created_at", -1)]
            )

            pending = purchase_requests_collection.find_one(
                {
                    "user_id": ObjectId(user_id),
                    "status": "pending",
                    "$or": [
                        {"product_id": ObjectId(product_id)},
                        {"items.product_id": ObjectId(product_id)}
                    ]
                },
                sort=[("created_at", -1)]
            )

            return {
                "confirmed_request": confirmed,
                "latest_request": pending or confirmed
            }
        except:
            return {
                "confirmed_request": None,
                "latest_request": None
            }

    @staticmethod
    def can_review(user_id, product_id):
        return purchase_requests_collection.find_one({
            "user_id": ObjectId(user_id),
            "status": "confirmed",
            "$or": [
                {"product_id": ObjectId(product_id)},
                {"items.product_id": ObjectId(product_id)}
            ]
        })

    @staticmethod
    def has_purchased(user_id, product_id):
        return bool(PurchaseRequestModel.can_review(user_id, product_id))
