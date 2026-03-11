from bson import ObjectId
from datetime import datetime
from models.db import db

products_collection = db["products"]

class ProductModel:

    @staticmethod
    def create_product(data):
        price = float(data.get("price", 0))
        discount = float(data.get("discount", 0))
        final_price = round(price - (price * discount / 100), 2)

        product = {
            "name": data.get("name", "").strip(),
            "description": data.get("description", "").strip(),
            "category": data.get("category", "").strip().lower(),  # dama, caballero
            "sizes": data.get("sizes", []),  # ["S","M","L"]
            "price": price,
            "discount": discount,
            "final_price": final_price,
            "images": data.get("images", []),
            "is_new": data.get("is_new", False),
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        return products_collection.insert_one(product)

    @staticmethod
    def get_all(filters=None):
        query = {"is_active": True}
        if filters:
            query.update(filters)
        return list(products_collection.find(query))

    @staticmethod
    def get_by_id(product_id):
        try:
            return products_collection.find_one({"_id": ObjectId(product_id), "is_active": True})
        except:
            return None

    @staticmethod
    def update_product(product_id, data):
        update_fields = {}

        for field in ["name", "description", "category", "sizes", "images", "is_new", "is_active"]:
            if field in data:
                update_fields[field] = data[field]

        if "price" in data or "discount" in data:
            current = ProductModel.get_by_id(product_id)
            if not current:
                return None

            price = float(data.get("price", current.get("price", 0)))
            discount = float(data.get("discount", current.get("discount", 0)))
            update_fields["price"] = price
            update_fields["discount"] = discount
            update_fields["final_price"] = round(price - (price * discount / 100), 2)

        if not update_fields:
            return None

        return products_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_fields}
        )

    @staticmethod
    def delete_product(product_id):
        return products_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"is_active": False}}
        )