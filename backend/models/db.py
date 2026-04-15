import os
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import certifi
from config import Config

def _as_bool(value: str | None) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


def create_mongo_client() -> MongoClient:
    uri = Config.MONGO_URI
    client_options = {
        "serverSelectionTimeoutMS": 30000,
        "connectTimeoutMS": 20000,
        "socketTimeoutMS": 20000,
        "retryWrites": True,
        "appname": "ShadowAngels",
        "server_api": ServerApi("1"),
    }

    # For Atlas and other TLS-enabled deployments, use certifi's CA bundle
    # but avoid forcing tls=True explicitly when the URI already defines it.
    if uri.startswith("mongodb+srv://") or "ssl=true" in uri.lower() or "tls=true" in uri.lower():
        client_options["tlsCAFile"] = certifi.where()

    # Optional escape hatch for deployment diagnostics only.
    if _as_bool(os.getenv("MONGO_TLS_ALLOW_INVALID_CERTIFICATES")):
        client_options["tlsAllowInvalidCertificates"] = True

    return MongoClient(uri, **client_options)


client = create_mongo_client()
db = client[Config.DB_NAME]
