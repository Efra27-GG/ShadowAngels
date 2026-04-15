from pymongo import MongoClient
import certifi
from config import Config

client = MongoClient(
    Config.MONGO_URI,
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000,
)
db = client[Config.DB_NAME]
