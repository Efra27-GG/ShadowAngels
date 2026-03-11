from models.db import db

contact_collection = db["contact"]

class ContactModel:

    @staticmethod
    def get_contact():
        contact = contact_collection.find_one({})
        if not contact:
            default_contact = {
                "whatsapp": "",
                "facebook": "",
                "instagram": "",
                "email": "",
                "location": ""
            }
            contact_collection.insert_one(default_contact)
            return contact_collection.find_one({})
        return contact

    @staticmethod
    def update_contact(data):
        return contact_collection.update_one(
            {},
            {"$set": {
                "whatsapp": data.get("whatsapp", ""),
                "facebook": data.get("facebook", ""),
                "instagram": data.get("instagram", ""),
                "email": data.get("email", ""),
                "location": data.get("location", "")
            }},
            upsert=True
        )