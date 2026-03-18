import os


class Config:
    MONGO_URI = "mongodb://localhost:27017/"
    DB_NAME = "shadowangels_db"
    SECRET_KEY = "shadowangels_super_secret_key"
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "products")
    NOTIFICATION_UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "notifications")
    HERO_UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "hero")
