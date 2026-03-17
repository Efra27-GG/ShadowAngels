from bson import ObjectId
from datetime import datetime, timedelta
from models.db import db

reviews_collection = db["reviews"]

class ReviewModel:

    @staticmethod
    def already_reviewed(product_id, user_id):
        return reviews_collection.find_one({
            "product_id": ObjectId(product_id),
            "user_id": ObjectId(user_id)
        })

    @staticmethod
    def create_review(data):
        review = {
            "product_id": ObjectId(data["product_id"]),
            "user_id": ObjectId(data["user_id"]),
            "user_name": data["user_name"],
            "rating": int(data["rating"]),
            "comment": data["comment"].strip(),
            "created_at": datetime.utcnow()
        }
        return reviews_collection.insert_one(review)

    @staticmethod
    def get_by_product(product_id):
        return list(reviews_collection.find(
            {"product_id": ObjectId(product_id)}
        ).sort("created_at", -1))

    @staticmethod
    def get_by_id(review_id):
        try:
            return reviews_collection.find_one({"_id": ObjectId(review_id)})
        except:
            return None

    @staticmethod
    def can_edit(review):
        if not review:
            return False

        created_at = review.get("created_at")
        if not created_at:
            return False

        return datetime.utcnow() <= created_at + timedelta(minutes=10)

    @staticmethod
    def update_review(review_id, data):
        return reviews_collection.update_one(
            {"_id": ObjectId(review_id)},
            {
                "$set": {
                    "rating": int(data["rating"]),
                    "comment": data["comment"].strip(),
                    "updated_at": datetime.utcnow()
                }
            }
        )

    @staticmethod
    def delete_review(review_id):
        return reviews_collection.delete_one({"_id": ObjectId(review_id)})
