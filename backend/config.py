import os


class Config:
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    DB_NAME = os.getenv("DB_NAME", "shadowangels_db")
    SECRET_KEY = os.getenv("SECRET_KEY", "shadowangels_super_secret_key")
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads", "products"))
    NOTIFICATION_UPLOAD_FOLDER = os.getenv(
        "NOTIFICATION_UPLOAD_FOLDER",
        os.path.join(BASE_DIR, "uploads", "notifications"),
    )
    HERO_UPLOAD_FOLDER = os.getenv("HERO_UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads", "hero"))
