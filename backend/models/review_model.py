from bson import ObjectId
from datetime import datetime
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
    def delete_review(review_id):
        return reviews_collection.delete_one({"_id": ObjectId(review_id)})