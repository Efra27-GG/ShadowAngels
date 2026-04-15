import os

import certifi
from pymongo import MongoClient
from pymongo.server_api import ServerApi

from config import Config

_client: MongoClient | None = None
_client_pid: int | None = None


def _as_bool(value: str | None) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


def _build_client() -> MongoClient:
    uri = Config.MONGO_URI
    client_options = {
        "serverSelectionTimeoutMS": 30000,
        "connectTimeoutMS": 20000,
        "socketTimeoutMS": 20000,
        "retryWrites": True,
        "appname": "ShadowAngels",
        "server_api": ServerApi("1"),
    }

    # Atlas / TLS-enabled deployments should use certifi's CA bundle.
    if uri.startswith("mongodb+srv://") or "ssl=true" in uri.lower() or "tls=true" in uri.lower():
        client_options["tlsCAFile"] = certifi.where()

    # Optional escape hatch for deployment diagnostics only.
    if _as_bool(os.getenv("MONGO_TLS_ALLOW_INVALID_CERTIFICATES")):
        client_options["tlsAllowInvalidCertificates"] = True

    return MongoClient(uri, **client_options)


def get_client() -> MongoClient:
    global _client, _client_pid

    current_pid = os.getpid()
    if _client is None or _client_pid != current_pid:
        _client = _build_client()
        _client_pid = current_pid

    return _client


def get_db():
    return get_client()[Config.DB_NAME]


class CollectionProxy:
    def __init__(self, name: str):
        self.name = name

    def _collection(self):
        return get_db()[self.name]

    def __getattr__(self, item):
        return getattr(self._collection(), item)


class DatabaseProxy:
    def __getitem__(self, name: str) -> CollectionProxy:
        return CollectionProxy(name)

    def __getattr__(self, item):
        return getattr(get_db(), item)


db = DatabaseProxy()
