from models.db import db

hero_collection = db["hero"]


class HeroModel:

    @staticmethod
    def get_hero():
        hero = hero_collection.find_one({})
        if not hero:
            default_hero = {
                "title": "Bienvenido a ShadowAngels",
                "subtitle": "Descubre nuestros productos, novedades y ofertas especiales.",
                "image": ""
            }
            hero_collection.insert_one(default_hero)
            return hero_collection.find_one({})
        return hero

    @staticmethod
    def update_hero(data):
        current = HeroModel.get_hero()
        payload = {
            "title": data.get("title", "").strip(),
            "subtitle": data.get("subtitle", "").strip(),
            "image": data.get("image", "").strip()
        }
        return hero_collection.update_one(
            {"_id": current["_id"]},
            {"$set": payload},
            upsert=True
        )
