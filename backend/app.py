import os
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from config import Config
from models.user_model import UserModel
from models.product_model import ProductModel
from models.review_model import ReviewModel
from models.notification_model import NotificationModel
from models.contact_model import ContactModel
from utils.auth import generate_token, token_required
from utils.helpers import serialize_doc, serialize_list

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}


def allowed_image(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS


def save_uploaded_images(files):
    saved_files = []

    for file in files:
        if not file or not file.filename:
            continue

        if not allowed_image(file.filename):
            raise ValueError(f"Formato no permitido para {file.filename}")

        safe_name = secure_filename(file.filename)
        extension = safe_name.rsplit(".", 1)[1].lower()
        unique_name = f"{uuid.uuid4().hex}.{extension}"
        destination = os.path.join(app.config["UPLOAD_FOLDER"], unique_name)
        file.save(destination)
        saved_files.append(unique_name)

    return saved_files


@app.route("/")
def home():
    return jsonify({"message": "ShadowAngels API funcionando"})


@app.route("/uploads/products/<path:filename>")
def uploaded_product_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# =========================
# AUTH USUARIOS
# =========================
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json

    required = ["name", "email", "password"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Falta el campo {field}"}), 400

    existing = UserModel.find_by_email(data["email"])
    if existing:
        return jsonify({"error": "El correo ya está registrado"}), 409

    data["role"] = "user"
    data["created_at"] = datetime.utcnow()
    UserModel.create_user(data)

    return jsonify({"message": "Usuario registrado correctamente"}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = UserModel.find_by_email(email)
    if not user:
        return jsonify({"error": "Credenciales incorrectas"}), 401

    if user["role"] not in ["user"]:
        return jsonify({"error": "Esta ruta es solo para usuarios registrados"}), 403

    if not UserModel.verify_password(user, password):
        return jsonify({"error": "Credenciales incorrectas"}), 401

    token = generate_token(user)
    return jsonify({
        "message": "Login exitoso",
        "token": token,
        "user": serialize_doc({
            "_id": user["_id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        })
    })


# =========================
# AUTH ADMINS
# =========================
@app.route("/api/admin/auth/login", methods=["POST"])
def admin_login():
    data = request.json
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = UserModel.find_by_email(email)
    if not user:
        return jsonify({"error": "Credenciales incorrectas"}), 401

    if user["role"] not in ["admin", "superadmin"]:
        return jsonify({"error": "No tienes permisos de administración"}), 403

    if not UserModel.verify_password(user, password):
        return jsonify({"error": "Credenciales incorrectas"}), 401

    token = generate_token(user)
    return jsonify({
        "message": "Login admin exitoso",
        "token": token,
        "user": serialize_doc({
            "_id": user["_id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        })
    })


# =========================
# PERFIL
# =========================
@app.route("/api/profile", methods=["GET"])
@token_required(allowed_roles=["user", "admin", "superadmin"])
def get_profile(current_user):
    safe_user = {
        "_id": current_user["_id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "is_active": current_user.get("is_active", True)
    }
    return jsonify(serialize_doc(safe_user))


@app.route("/api/profile", methods=["PUT"])
@token_required(allowed_roles=["user", "admin", "superadmin"])
def update_profile(current_user):
    data = request.json
    UserModel.update_user(str(current_user["_id"]), data)
    updated = UserModel.find_by_id(str(current_user["_id"]))

    safe_user = {
        "_id": updated["_id"],
        "name": updated["name"],
        "email": updated["email"],
        "role": updated["role"],
        "is_active": updated.get("is_active", True)
    }
    return jsonify({
        "message": "Perfil actualizado",
        "user": serialize_doc(safe_user)
    })


# =========================
# PRODUCTOS
# =========================
@app.route("/api/products", methods=["GET"])
def get_products():
    category = request.args.get("category")
    offers = request.args.get("offers")
    newest = request.args.get("newest")

    filters = {}

    if category:
        filters["category"] = category.lower()

    if offers == "true":
        filters["discount"] = {"$gt": 0}

    if newest == "true":
        filters["is_new"] = True

    products = ProductModel.get_all(filters)
    return jsonify(serialize_list(products))


@app.route("/api/products/<product_id>", methods=["GET"])
def get_product(product_id):
    product = ProductModel.get_by_id(product_id)
    if not product:
        return jsonify({"error": "Producto no encontrado"}), 404

    reviews = ReviewModel.get_by_product(product_id)
    product_data = serialize_doc(product)
    product_data["reviews"] = serialize_list(reviews)

    return jsonify(product_data)


@app.route("/api/uploads/products", methods=["POST"])
@token_required(allowed_roles=["admin", "superadmin"])
def upload_product_images(current_user):
    files = request.files.getlist("images")

    if not files:
        return jsonify({"error": "No se enviaron imagenes"}), 400

    try:
        saved_files = save_uploaded_images(files)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if not saved_files:
        return jsonify({"error": "No se pudieron procesar las imagenes"}), 400

    return jsonify({
        "message": "Imagenes subidas correctamente",
        "images": saved_files
    }), 201


@app.route("/api/products", methods=["POST"])
@token_required(allowed_roles=["admin", "superadmin"])
def create_product(current_user):
    data = request.json
    required = ["name", "description", "category", "price"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Falta el campo {field}"}), 400

    result = ProductModel.create_product(data)
    return jsonify({
        "message": "Producto creado",
        "product_id": str(result.inserted_id)
    }), 201


@app.route("/api/products/<product_id>", methods=["PUT"])
@token_required(allowed_roles=["admin", "superadmin"])
def update_product(current_user, product_id):
    current_product = ProductModel.get_by_id(product_id)
    if not current_product:
        return jsonify({"error": "Producto no encontrado"}), 404

    payload = request.json or {}
    previous_images = current_product.get("images", [])
    next_images = payload.get("images", previous_images)

    result = ProductModel.update_product(product_id, payload)
    if result is None:
        return jsonify({"error": "No se pudo actualizar el producto"}), 400

    removed_images = [image for image in previous_images if image not in next_images]
    ProductModel.cleanup_unused_images(
        removed_images,
        app.config["UPLOAD_FOLDER"],
        exclude_product_id=product_id
    )

    return jsonify({"message": "Producto actualizado"})


@app.route("/api/products/<product_id>", methods=["DELETE"])
@token_required(allowed_roles=["admin", "superadmin"])
def delete_product(current_user, product_id):
    current_product = ProductModel.get_by_id(product_id)
    if not current_product:
        return jsonify({"error": "Producto no encontrado"}), 404

    ProductModel.delete_product(product_id)
    ProductModel.cleanup_unused_images(
        current_product.get("images", []),
        app.config["UPLOAD_FOLDER"],
        exclude_product_id=product_id
    )
    return jsonify({"message": "Producto eliminado"})


# =========================
# RESEÑAS
# =========================
@app.route("/api/products/<product_id>/reviews", methods=["POST"])
@token_required(allowed_roles=["user"])
def create_review(current_user, product_id):
    data = request.json

    if ReviewModel.already_reviewed(product_id, str(current_user["_id"])):
        return jsonify({"error": "Ya dejaste una reseña para este producto"}), 409

    required = ["rating", "comment"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Falta el campo {field}"}), 400

    review_data = {
        "product_id": product_id,
        "user_id": str(current_user["_id"]),
        "user_name": current_user["name"],
        "rating": data["rating"],
        "comment": data["comment"]
    }

    result = ReviewModel.create_review(review_data)
    return jsonify({
        "message": "Reseña creada",
        "review_id": str(result.inserted_id)
    }), 201


@app.route("/api/reviews/<review_id>", methods=["DELETE"])
@token_required(allowed_roles=["admin", "superadmin"])
def delete_review(current_user, review_id):
    ReviewModel.delete_review(review_id)
    return jsonify({"message": "Reseña eliminada"})


# =========================
# NOTIFICACIONES
# =========================
@app.route("/api/notifications", methods=["GET"])
@token_required(allowed_roles=["user"])
def get_notifications(current_user):
    notifications = NotificationModel.get_user_notifications(str(current_user["_id"]))
    return jsonify(serialize_list(notifications))


@app.route("/api/notifications", methods=["POST"])
@token_required(allowed_roles=["admin", "superadmin"])
def create_notification(current_user):
    data = request.json

    required = ["title", "message"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Falta el campo {field}"}), 400

    result = NotificationModel.create_notification({
        "title": data["title"],
        "message": data["message"],
        "created_by": str(current_user["_id"])
    })

    return jsonify({
        "message": "Notificación publicada",
        "notification_id": str(result.inserted_id)
    }), 201


@app.route("/api/notifications/<user_notification_id>", methods=["DELETE"])
@token_required(allowed_roles=["user"])
def delete_user_notification(current_user, user_notification_id):
    NotificationModel.delete_user_notification(str(current_user["_id"]), user_notification_id)
    return jsonify({"message": "Notificación eliminada de tu bandeja"})


# =========================
# CONTACTO
# =========================
@app.route("/api/contact", methods=["GET"])
def get_contact():
    contact = ContactModel.get_contact()
    return jsonify(serialize_doc(contact))


@app.route("/api/contact", methods=["PUT"])
@token_required(allowed_roles=["admin", "superadmin"])
def update_contact(current_user):
    ContactModel.update_contact(request.json)
    return jsonify({"message": "Información de contacto actualizada"})


# =========================
# ADMINS - SOLO SUPERADMIN
# =========================
@app.route("/api/admins", methods=["GET"])
@token_required(allowed_roles=["superadmin"])
def get_admins(current_user):
    admins = UserModel.get_all_admins()
    return jsonify(serialize_list(admins))


@app.route("/api/admins", methods=["POST"])
@token_required(allowed_roles=["superadmin"])
def create_admin(current_user):
    data = request.json

    required = ["name", "email", "password"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Falta el campo {field}"}), 400

    existing = UserModel.find_by_email(data["email"])
    if existing:
        return jsonify({"error": "El correo ya está registrado"}), 409

    data["role"] = "admin"
    data["created_at"] = datetime.utcnow()
    result = UserModel.create_user(data)

    return jsonify({
        "message": "Administrador creado",
        "admin_id": str(result.inserted_id)
    }), 201


@app.route("/api/admins/<admin_id>", methods=["PUT"])
@token_required(allowed_roles=["superadmin"])
def update_admin(current_user, admin_id):
    target = UserModel.find_by_id(admin_id)
    if not target:
        return jsonify({"error": "Administrador no encontrado"}), 404

    if str(target["_id"]) == str(current_user["_id"]) and "role" in request.json:
        return jsonify({"error": "No puedes modificar tu propio rol"}), 403

    UserModel.update_user(admin_id, request.json)
    return jsonify({"message": "Administrador actualizado"})


@app.route("/api/admins/<admin_id>", methods=["DELETE"])
@token_required(allowed_roles=["superadmin"])
def delete_admin(current_user, admin_id):
    target = UserModel.find_by_id(admin_id)
    if not target:
        return jsonify({"error": "Administrador no encontrado"}), 404

    if str(target["_id"]) == str(current_user["_id"]):
        return jsonify({"error": "No puedes eliminarte a ti mismo"}), 403

    if target["role"] == "superadmin":
        return jsonify({"error": "No puedes eliminar otro superadmin desde esta ruta"}), 403

    UserModel.delete_user(admin_id)
    return jsonify({"message": "Administrador eliminado"})


if __name__ == "__main__":
    app.run(debug=True)
