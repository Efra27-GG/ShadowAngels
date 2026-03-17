from models.db import db

contact_collection = db["contact"]

class ContactModel:

    @staticmethod
    def get_contact():
        contact = contact_collection.find_one({})
        if not contact:
            default_contact = {
                "whatsapp_number": "",
                "whatsapp_label": "",
                "facebook": "",
                "instagram": "",
                "tiktok": "",
                "email": "",
                "location": ""
            }
            contact_collection.insert_one(default_contact)
            return contact_collection.find_one({})
        return contact

    @staticmethod
    def update_contact(data):
        current = ContactModel.get_contact()
        return contact_collection.update_one(
            {"_id": current["_id"]},
            {"$set": {
                "whatsapp_number": data.get("whatsapp_number", "").strip(),
                "whatsapp_label": data.get("whatsapp_label", "").strip(),
                "facebook": data.get("facebook", ""),
                "instagram": data.get("instagram", ""),
                "tiktok": data.get("tiktok", ""),
                "email": data.get("email", ""),
                "location": data.get("location", "")
            }},
            upsert=True
        )
