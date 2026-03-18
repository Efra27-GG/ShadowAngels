from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from models.db import db

users_collection = db["users"]

class UserModel:

    @staticmethod
    def create_user(data):
        user = {
            "name": data.get("name", "").strip(),
            "email": data.get("email", "").strip().lower(),
            "password": generate_password_hash(data.get("password", "")),
            "role": data.get("role", "user"),  # user, admin, superadmin
            "is_active": True,
            "created_at": data.get("created_at"),
        }
        return users_collection.insert_one(user)

    @staticmethod
    def find_by_email(email):
        return users_collection.find_one({"email": email.strip().lower()})

    @staticmethod
    def find_by_email_except(email, user_id):
        return users_collection.find_one({
            "email": email.strip().lower(),
            "_id": {"$ne": ObjectId(user_id)}
        })

    @staticmethod
    def find_by_id(user_id):
        try:
            return users_collection.find_one({"_id": ObjectId(user_id)})
        except:
            return None

    @staticmethod
    def get_all_admins():
        return list(users_collection.find(
            {"role": {"$in": ["admin", "superadmin"]}},
            {"password": 0}
        ))

    @staticmethod
    def update_user(user_id, data):
        update_fields = {}

        if "name" in data:
            update_fields["name"] = data["name"].strip()

        if "email" in data:
            update_fields["email"] = data["email"].strip().lower()

        if "password" in data and data["password"]:
            update_fields["password"] = generate_password_hash(data["password"])

        if "role" in data:
            update_fields["role"] = data["role"]

        if not update_fields:
            return None

        return users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_fields}
        )

    @staticmethod
    def delete_user(user_id):
        return users_collection.delete_one({"_id": ObjectId(user_id)})

    @staticmethod
    def verify_password(user, password):
        return check_password_hash(user["password"], password)
