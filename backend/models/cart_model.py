from bson import ObjectId
from datetime import datetime
from models.db import db

cart_collection = db["carts"]


class CartModel:

    @staticmethod
    def create_cart(user_id):
        cart = {
            "user_id": ObjectId(user_id),
            "status": "draft",
            "items": [],
            "request_id": None,
            "request_channel": None,
            "requested_at": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = cart_collection.insert_one(cart)
        return cart_collection.find_one({"_id": result.inserted_id})

    @staticmethod
    def get_active_cart(user_id):
        cart = cart_collection.find_one(
            {
                "user_id": ObjectId(user_id),
                "status": "draft"
            },
            sort=[("updated_at", -1)]
        )

        if not cart:
            cart = CartModel.create_cart(user_id)

        return cart

    @staticmethod
    def get_by_id(cart_id):
        try:
            return cart_collection.find_one({"_id": ObjectId(cart_id)})
        except:
            return None

    @staticmethod
    def get_history(user_id):
        return list(cart_collection.find(
            {
                "user_id": ObjectId(user_id),
                "status": {"$in": ["pending", "confirmed"]}
            }
        ).sort("requested_at", -1))

    @staticmethod
    def add_item(user_id, item):
        cart = CartModel.get_active_cart(user_id)
        items = cart.get("items", [])

        for current_item in items:
            if (
                current_item["product_id"] == ObjectId(item["product_id"]) and
                current_item.get("selected_size") == item.get("selected_size")
            ):
                current_item["quantity"] += int(item.get("quantity", 1))
                cart_collection.update_one(
                    {"_id": cart["_id"]},
                    {"$set": {"items": items, "updated_at": datetime.utcnow()}}
                )
                return CartModel.get_active_cart(user_id)

        items.append({
            "product_id": ObjectId(item["product_id"]),
            "product_name": item["product_name"],
            "selected_size": item["selected_size"],
            "product_image": item.get("product_image", ""),
            "price": float(item.get("price", 0)),
            "final_price": float(item.get("final_price", 0)),
            "quantity": int(item.get("quantity", 1))
        })

        cart_collection.update_one(
            {"_id": cart["_id"]},
            {"$set": {"items": items, "updated_at": datetime.utcnow()}}
        )
        return CartModel.get_active_cart(user_id)

    @staticmethod
    def update_item_quantity(user_id, product_id, selected_size, quantity):
        cart = CartModel.get_active_cart(user_id)
        items = cart.get("items", [])

        for current_item in items:
            if (
                current_item["product_id"] == ObjectId(product_id) and
                current_item.get("selected_size") == selected_size
            ):
                current_item["quantity"] = int(quantity)
                break

        cart_collection.update_one(
            {"_id": cart["_id"]},
            {"$set": {"items": items, "updated_at": datetime.utcnow()}}
        )
        return CartModel.get_active_cart(user_id)

    @staticmethod
    def remove_item(user_id, product_id, selected_size):
        cart = CartModel.get_active_cart(user_id)
        items = [
            item for item in cart.get("items", [])
            if not (
                item["product_id"] == ObjectId(product_id) and
                item.get("selected_size") == selected_size
            )
        ]

        cart_collection.update_one(
            {"_id": cart["_id"]},
            {"$set": {"items": items, "updated_at": datetime.utcnow()}}
        )
        return CartModel.get_active_cart(user_id)

    @staticmethod
    def submit_cart(cart_id, request_id, channel):
        cart = CartModel.get_by_id(cart_id)
        if not cart:
            return None

        cart_collection.update_one(
            {"_id": cart["_id"]},
            {"$set": {
                "status": "pending",
                "request_id": ObjectId(request_id),
                "request_channel": channel,
                "requested_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        return CartModel.get_by_id(cart_id)

    @staticmethod
    def sync_request_status(cart_id, status):
        if not cart_id:
            return None

        return cart_collection.update_one(
            {"_id": ObjectId(cart_id)},
            {"$set": {
                "status": status,
                "updated_at": datetime.utcnow()
            }}
        )
