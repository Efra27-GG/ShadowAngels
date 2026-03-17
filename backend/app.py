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
from models.purchase_request_model import PurchaseRequestModel
from models.cart_model import CartModel
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
        return jsonify({"error": "El correo ya esta registrado"}), 409

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
        return jsonify({"error": "No tienes permisos de administracion"}), 403

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
# RESENAS
# =========================
@app.route("/api/products/<product_id>/reviews", methods=["POST"])
@token_required(allowed_roles=["user"])
def create_review(current_user, product_id):
    data = request.json or {}

    if not PurchaseRequestModel.can_review(str(current_user["_id"]), product_id):
        return jsonify({"error": "Solo puedes reseñar productos con compra confirmada"}), 403

    if ReviewModel.already_reviewed(product_id, str(current_user["_id"])):
        return jsonify({"error": "Ya dejaste una resena para este producto"}), 409

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
        "message": "Resena creada",
        "review_id": str(result.inserted_id)
    }), 201


@app.route("/api/reviews/<review_id>", methods=["DELETE"])
@token_required(allowed_roles=["admin", "superadmin"])
def delete_review(current_user, review_id):
    ReviewModel.delete_review(review_id)
    return jsonify({"message": "Resena eliminada"})


@app.route("/api/reviews/<review_id>", methods=["PUT"])
@token_required(allowed_roles=["user"])
def update_review(current_user, review_id):
    data = request.json or {}
    review = ReviewModel.get_by_id(review_id)

    if not review:
        return jsonify({"error": "Resena no encontrada"}), 404

    if str(review["user_id"]) != str(current_user["_id"]):
        return jsonify({"error": "No puedes editar esta resena"}), 403

    if not ReviewModel.can_edit(review):
        return jsonify({"error": "Solo puedes editar tu resena durante los primeros 10 minutos"}), 403

    required = ["rating", "comment"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Falta el campo {field}"}), 400

    ReviewModel.update_review(review_id, data)
    return jsonify({"message": "Resena actualizada"})


# =========================
# CARRITO
# =========================
@app.route("/api/cart", methods=["GET"])
@token_required(allowed_roles=["user"])
def get_cart(current_user):
    cart = CartModel.get_active_cart(str(current_user["_id"]))
    return jsonify(serialize_doc(cart))


@app.route("/api/cart/history", methods=["GET"])
@token_required(allowed_roles=["user"])
def get_cart_history(current_user):
    history = PurchaseRequestModel.get_user_history(str(current_user["_id"]))
    return jsonify(serialize_list(history))


@app.route("/api/cart/items", methods=["POST"])
@token_required(allowed_roles=["user"])
def add_cart_item(current_user):
    data = request.json or {}
    product_id = data.get("product_id")
    quantity = int(data.get("quantity", 1))

    if not product_id:
        return jsonify({"error": "Falta el producto"}), 400

    if quantity < 1:
        return jsonify({"error": "La cantidad debe ser mayor a cero"}), 400

    product = ProductModel.get_by_id(product_id)
    if not product:
        return jsonify({"error": "Producto no encontrado"}), 404

    cart = CartModel.add_item(str(current_user["_id"]), {
        "product_id": product_id,
        "product_name": product["name"],
        "product_image": product.get("images", [""])[0] if product.get("images") else "",
        "price": product.get("price", 0),
        "final_price": product.get("final_price", 0),
        "quantity": quantity
    })

    return jsonify({
        "message": "Producto agregado al carrito",
        "cart": serialize_doc(cart)
    }), 201


@app.route("/api/cart/items/<product_id>", methods=["PUT"])
@token_required(allowed_roles=["user"])
def update_cart_item(current_user, product_id):
    data = request.json or {}
    quantity = int(data.get("quantity", 1))

    if quantity < 1:
        return jsonify({"error": "La cantidad debe ser mayor a cero"}), 400

    cart = CartModel.update_item_quantity(str(current_user["_id"]), product_id, quantity)
    return jsonify({
        "message": "Cantidad actualizada",
        "cart": serialize_doc(cart)
    })


@app.route("/api/cart/items/<product_id>", methods=["DELETE"])
@token_required(allowed_roles=["user"])
def remove_cart_item(current_user, product_id):
    cart = CartModel.remove_item(str(current_user["_id"]), product_id)
    return jsonify({
        "message": "Producto eliminado del carrito",
        "cart": serialize_doc(cart)
    })


@app.route("/api/cart/checkout", methods=["POST"])
@token_required(allowed_roles=["user"])
def checkout_cart(current_user):
    data = request.json or {}
    channel = data.get("channel")

    if channel not in ["whatsapp", "instagram"]:
        return jsonify({"error": "Canal no valido"}), 400

    cart = CartModel.get_active_cart(str(current_user["_id"]))
    items = cart.get("items", [])

    if not items:
        return jsonify({"error": "Tu carrito esta vacio"}), 400

    purchase_request = PurchaseRequestModel.create_from_cart({
        "user_id": str(current_user["_id"]),
        "user_name": current_user["name"],
        "user_email": current_user["email"],
        "cart_id": str(cart["_id"]),
        "items": [
            {
                "product_id": str(item["product_id"]),
                "product_name": item["product_name"],
                "product_image": item.get("product_image", ""),
                "price": item.get("price", 0),
                "final_price": item.get("final_price", 0),
                "quantity": item.get("quantity", 1)
            }
            for item in items
        ],
        "channel": channel
    })

    submitted_cart = CartModel.submit_cart(str(cart["_id"]), str(purchase_request["_id"]), channel)
    active_cart = CartModel.create_cart(str(current_user["_id"]))

    return jsonify({
        "message": "Solicitud de carrito registrada",
        "submitted_cart": serialize_doc(submitted_cart),
        "active_cart": serialize_doc(active_cart),
        "request": serialize_doc(purchase_request)
    }), 201


# =========================
# SOLICITUDES
# =========================
@app.route("/api/purchase-requests", methods=["POST"])
@token_required(allowed_roles=["user"])
def create_purchase_request(current_user):
    data = request.json or {}
    product_id = data.get("product_id")
    channel = data.get("channel")

    if not product_id or not channel:
        return jsonify({"error": "Faltan datos para registrar la solicitud"}), 400

    if channel not in ["whatsapp", "instagram"]:
        return jsonify({"error": "Canal no valido"}), 400

    product = ProductModel.get_by_id(product_id)
    if not product:
        return jsonify({"error": "Producto no encontrado"}), 404

    purchase_request, created = PurchaseRequestModel.create_or_get_pending({
        "user_id": str(current_user["_id"]),
        "user_name": current_user["name"],
        "user_email": current_user["email"],
        "product_id": product_id,
        "product_name": product["name"],
        "channel": channel
    })

    return jsonify({
        "message": "Solicitud registrada" if created else "Ya tienes una solicitud pendiente para este producto",
        "request": serialize_doc(purchase_request)
    }), 201 if created else 200


@app.route("/api/purchase-requests/status/<product_id>", methods=["GET"])
@token_required(allowed_roles=["user"])
def get_purchase_request_status(current_user, product_id):
    purchase_request = PurchaseRequestModel.get_user_product_status(
        str(current_user["_id"]),
        product_id
    )
    can_review = bool(PurchaseRequestModel.can_review(str(current_user["_id"]), product_id))
    has_purchased = PurchaseRequestModel.has_purchased(str(current_user["_id"]), product_id)

    return jsonify({
        "request": serialize_doc(purchase_request),
        "can_review": can_review,
        "has_purchased": has_purchased
    })


@app.route("/api/admin/purchase-requests", methods=["GET"])
@token_required(allowed_roles=["admin", "superadmin"])
def get_admin_purchase_requests(current_user):
    purchase_requests = PurchaseRequestModel.get_all()
    return jsonify(serialize_list(purchase_requests))


@app.route("/api/admin/purchase-requests/<request_id>", methods=["PUT"])
@token_required(allowed_roles=["admin", "superadmin"])
def update_admin_purchase_request(current_user, request_id):
    data = request.json or {}
    status = data.get("status")
    admin_note = data.get("admin_note", "")

    if status not in ["pending", "confirmed", "rejected"]:
        return jsonify({"error": "Estado no valido"}), 400

    purchase_request = PurchaseRequestModel.get_by_id(request_id)
    if not purchase_request:
        return jsonify({"error": "Solicitud no encontrada"}), 404

    PurchaseRequestModel.update_status(request_id, status, str(current_user["_id"]), admin_note)
    updated_request = PurchaseRequestModel.get_by_id(request_id)

    if updated_request and updated_request.get("request_type") == "cart":
        CartModel.sync_request_status(updated_request.get("cart_id"), status)

    return jsonify({
        "message": "Solicitud actualizada",
        "request": serialize_doc(updated_request)
    })


@app.route("/api/admin/purchase-requests/<request_id>", methods=["DELETE"])
@token_required(allowed_roles=["admin", "superadmin"])
def delete_admin_purchase_request(current_user, request_id):
    purchase_request = PurchaseRequestModel.get_by_id(request_id)
    if not purchase_request:
        return jsonify({"error": "Solicitud no encontrada"}), 404

    PurchaseRequestModel.delete(request_id)
    return jsonify({"message": "Solicitud eliminada"})


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
        "message": "Notificacion publicada",
        "notification_id": str(result.inserted_id)
    }), 201


@app.route("/api/notifications/<user_notification_id>", methods=["DELETE"])
@token_required(allowed_roles=["user"])
def delete_user_notification(current_user, user_notification_id):
    NotificationModel.delete_user_notification(str(current_user["_id"]), user_notification_id)
    return jsonify({"message": "Notificacion eliminada de tu bandeja"})


# =========================
# CONTACTO
# =========================
@app.route("/api/contact", methods=["GET"])
def get_contact():
    contact = ContactModel.get_contact()
    return jsonify(serialize_doc(contact))


@app.route("/api/contact", methods=["PUT"])
@token_required(allowed_roles=["superadmin"])
def update_contact(current_user):
    ContactModel.update_contact(request.json)
    return jsonify({"message": "Informacion de contacto actualizada"})


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
        return jsonify({"error": "El correo ya esta registrado"}), 409

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
