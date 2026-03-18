from bson import ObjectId
from datetime import datetime, timedelta
from models.db import db

reviews_collection = db["reviews"]
products_collection = db["products"]

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
    def get_all():
        return list(reviews_collection.find({}).sort("created_at", -1))

    @staticmethod
    def enrich_with_product(review):
        if not review:
            return None

        product = products_collection.find_one({"_id": review.get("product_id")})
        enriched = dict(review)
        enriched["product_name"] = product.get("name") if product else "Producto eliminado"
        enriched["product_image"] = product.get("images", [""])[0] if product and product.get("images") else ""
        return enriched

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
