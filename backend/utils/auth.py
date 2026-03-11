import jwt
from functools import wraps
from flask import request, jsonify, current_app
from models.user_model import UserModel

def generate_token(user):
    payload = {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"]
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")

def token_required(allowed_roles=None):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            token = request.headers.get("Authorization")

            if not token:
                return jsonify({"error": "Token requerido"}), 401

            if token.startswith("Bearer "):
                token = token.split(" ")[1]

            try:
                data = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
                current_user = UserModel.find_by_id(data["user_id"])

                if not current_user:
                    return jsonify({"error": "Usuario no encontrado"}), 404

                if allowed_roles and current_user["role"] not in allowed_roles:
                    return jsonify({"error": "Acceso denegado"}), 403

                return func(current_user, *args, **kwargs)

            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expirado"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error": "Token inválido"}), 401

        return wrapper
    return decorator