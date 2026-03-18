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
from models.hero_model import HeroModel
from models.purchase_request_model import PurchaseRequestModel
from models.cart_model import CartModel
from utils.auth import generate_token, token_required
from utils.helpers import serialize_doc, serialize_list

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
os.makedirs(app.config["NOTIFICATION_UPLOAD_FOLDER"], exist_ok=True)
os.makedirs(app.config["HERO_UPLOAD_FOLDER"], exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}


def allowed_image(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS


def save_uploaded_images(files, upload_folder):
    saved_files = []

    for file in files:
        if not file or not file.filename:
            continue

        if not allowed_image(file.filename):
            raise ValueError(f"Formato no permitido para {file.filename}")

        safe_name = secure_filename(file.filename)
        extension = safe_name.rsplit(".", 1)[1].lower()
        unique_name = f"{uuid.uuid4().hex}.{extension}"
        destination = os.path.join(upload_folder, unique_name)
        file.save(destination)
        saved_files.append(unique_name)

    return saved_files


def delete_uploaded_file(upload_folder, filename):
    if not filename:
        return

    file_path = os.path.join(upload_folder, filename)
    if os.path.exists(file_path):
        os.remove(file_path)


@app.route("/")
def home():
    return jsonify({"message": "ShadowAngels API funcionando"})


@app.route("/uploads/products/<path:filename>")
def uploaded_product_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/uploads/notifications/<path:filename>")
def uploaded_notification_file(filename):
    return send_from_directory(app.config["NOTIFICATION_UPLOAD_FOLDER"], filename)


@app.route("/uploads/hero/<path:filename>")
def uploaded_hero_file(filename):
    return send_from_directory(app.config["HERO_UPLOAD_FOLDER"], filename)


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
    data = request.json or {}
    allowed_fields = {
        "name": data.get("name", ""),
        "email": data.get("email", "")
    }

    email = allowed_fields["email"].strip().lower()
    if email:
        existing = UserModel.find_by_email_except(email, str(current_user["_id"]))
        if existing:
            return jsonify({"error": "El correo ya esta registrado por otra cuenta"}), 409

    UserModel.update_user(str(current_user["_id"]), allowed_fields)
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
        saved_files = save_uploaded_images(files, app.config["UPLOAD_FOLDER"])
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if not saved_files:
        return jsonify({"error": "No se pudieron procesar las imagenes"}), 400

    return jsonify({
        "message": "Imagenes subidas correctamente",
        "images": saved_files
    }), 201


@app.route("/api/uploads/notifications", methods=["POST"])
@token_required(allowed_roles=["admin", "superadmin"])
def upload_notification_image(current_user):
    files = request.files.getlist("images")

    if not files:
        return jsonify({"error": "No se envio ninguna imagen"}), 400

    try:
        saved_files = save_uploaded_images(files[:1], app.config["NOTIFICATION_UPLOAD_FOLDER"])
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if not saved_files:
        return jsonify({"error": "No se pudo procesar la imagen"}), 400

    return jsonify({
        "message": "Imagen subida correctamente",
        "images": saved_files
    }), 201


@app.route("/api/uploads/hero", methods=["POST"])
@token_required(allowed_roles=["superadmin"])
def upload_hero_image(current_user):
    files = request.files.getlist("images")

    if not files:
        return jsonify({"error": "No se envio ninguna imagen"}), 400

    try:
        saved_files = save_uploaded_images(files[:1], app.config["HERO_UPLOAD_FOLDER"])
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if not saved_files:
        return jsonify({"error": "No se pudo procesar la imagen"}), 400

    return jsonify({
        "message": "Imagen del hero subida correctamente",
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

    try:
        price = float(data.get("price", 0))
        discount = float(data.get("discount", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Precio o descuento no validos"}), 400

    if price <= 0:
        return jsonify({"error": "El precio debe ser mayor a cero"}), 400

    if discount < 0 or discount > 100:
        return jsonify({"error": "El descuento debe estar entre 0 y 100"}), 400

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
    if "price" in payload or "discount" in payload:
        try:
            price = float(payload.get("price", current_product.get("price", 0)))
            discount = float(payload.get("discount", current_product.get("discount", 0)))
        except (TypeError, ValueError):
            return jsonify({"error": "Precio o descuento no validos"}), 400

        if price <= 0:
            return jsonify({"error": "El precio debe ser mayor a cero"}), 400

        if discount < 0 or discount > 100:
            return jsonify({"error": "El descuento debe estar entre 0 y 100"}), 400

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

    try:
        rating = int(data["rating"])
    except (TypeError, ValueError):
        return jsonify({"error": "La calificacion no es valida"}), 400

    comment = data["comment"].strip()
    if rating < 1 or rating > 5:
        return jsonify({"error": "La calificacion debe estar entre 1 y 5"}), 400

    if len(comment) < 5 or len(comment) > 500:
        return jsonify({"error": "El comentario debe tener entre 5 y 500 caracteres"}), 400

    review_data = {
        "product_id": product_id,
        "user_id": str(current_user["_id"]),
        "user_name": current_user["name"],
        "rating": rating,
        "comment": comment
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


@app.route("/api/admin/reviews", methods=["GET"])
@token_required(allowed_roles=["admin", "superadmin"])
def get_admin_reviews(current_user):
    reviews = [ReviewModel.enrich_with_product(review) for review in ReviewModel.get_all()]
    return jsonify(serialize_list(reviews))


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

    try:
        rating = int(data["rating"])
    except (TypeError, ValueError):
        return jsonify({"error": "La calificacion no es valida"}), 400

    comment = data["comment"].strip()
    if rating < 1 or rating > 5:
        return jsonify({"error": "La calificacion debe estar entre 1 y 5"}), 400

    if len(comment) < 5 or len(comment) > 500:
        return jsonify({"error": "El comentario debe tener entre 5 y 500 caracteres"}), 400

    ReviewModel.update_review(review_id, {"rating": rating, "comment": comment})
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


@app.route("/api/guest-purchase-requests", methods=["POST"])
def create_guest_purchase_request():
    data = request.json or {}
    product_id = data.get("product_id")
    channel = data.get("channel")
    guest_name = data.get("guest_name", "").strip()
    guest_contact = data.get("guest_contact", "").strip()

    if not product_id or not channel or not guest_name or not guest_contact:
        return jsonify({"error": "Faltan datos para registrar la solicitud"}), 400

    if channel not in ["whatsapp", "instagram"]:
        return jsonify({"error": "Canal no valido"}), 400

    product = ProductModel.get_by_id(product_id)
    if not product:
        return jsonify({"error": "Producto no encontrado"}), 404

    purchase_request, created = PurchaseRequestModel.create_or_get_pending({
        "user_name": guest_name,
        "guest_contact": guest_contact,
        "product_id": product_id,
        "product_name": product["name"],
        "channel": channel
    })

    return jsonify({
        "message": "Solicitud registrada" if created else "Ya existe una solicitud pendiente para este producto con ese contacto",
        "request": serialize_doc(purchase_request)
    }), 201 if created else 200


@app.route("/api/purchase-requests/status/<product_id>", methods=["GET"])
@token_required(allowed_roles=["user"])
def get_purchase_request_status(current_user, product_id):
    status_data = PurchaseRequestModel.get_user_product_status(
        str(current_user["_id"]),
        product_id
    )
    can_review = bool(PurchaseRequestModel.can_review(str(current_user["_id"]), product_id))
    has_purchased = PurchaseRequestModel.has_purchased(str(current_user["_id"]), product_id)

    return jsonify({
        "request": serialize_doc(status_data.get("latest_request")),
        "confirmed_request": serialize_doc(status_data.get("confirmed_request")),
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

    if (
        updated_request and
        status == "confirmed" and
        updated_request.get("user_id")
    ):
        title = "Compra confirmada"
        if updated_request.get("request_type") == "cart":
            summary = "Tu solicitud de compra fue confirmada. Ya puedes dejar resenas en los productos incluidos."
            content = (
                "El administrador confirmo tu solicitud de carrito. "
                "Ya puedes volver a los productos de esa compra y dejar tus resenas."
            )
        else:
            product_name = updated_request.get("product_name", "tu producto")
            summary = f"Tu compra de {product_name} fue confirmada. Ya puedes dejar tu resena."
            content = (
                f"El administrador confirmo la compra de {product_name}. "
                "Ya puedes entrar al detalle del producto y publicar tu resena."
            )

        NotificationModel.create_system_notification_for_users(
            {
                "title": title,
                "summary": summary,
                "content": content,
                "created_by": str(current_user["_id"])
            },
            [str(updated_request["user_id"])]
        )

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

    if purchase_request.get("status") == "confirmed":
        return jsonify({"error": "No se pueden eliminar solicitudes confirmadas"}), 400

    delete_result = PurchaseRequestModel.delete(request_id)
    if not delete_result or delete_result.deleted_count == 0:
        return jsonify({"error": "No se pudo eliminar la solicitud"}), 400

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

    required = ["title", "summary", "content", "status"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Falta el campo {field}"}), 400

    if data.get("status") not in ["draft", "scheduled", "published"]:
        return jsonify({"error": "Estado de notificacion no valido"}), 400

    if data.get("status") == "scheduled":
        scheduled_for = data.get("scheduled_for")
        if not scheduled_for:
            return jsonify({"error": "Falta la fecha programada"}), 400
        try:
            scheduled_at = datetime.fromisoformat(scheduled_for)
        except ValueError:
            return jsonify({"error": "La fecha programada no es valida"}), 400

        if scheduled_at <= datetime.utcnow():
            return jsonify({"error": "La fecha programada debe estar en el futuro"}), 400

    notification = NotificationModel.create_notification({
        "title": data["title"],
        "summary": data["summary"],
        "content": data["content"],
        "image": data.get("image", ""),
        "status": data["status"],
        "scheduled_for": data.get("scheduled_for"),
        "created_by": str(current_user["_id"])
    })

    return jsonify({
        "message": "Notificacion guardada correctamente",
        "notification": serialize_doc(notification)
    }), 201


@app.route("/api/admin/notifications", methods=["GET"])
@token_required(allowed_roles=["admin", "superadmin"])
def get_admin_notifications(current_user):
    notifications = NotificationModel.get_all()
    return jsonify(serialize_list(notifications))


@app.route("/api/admin/notifications/<notification_id>", methods=["PUT"])
@token_required(allowed_roles=["admin", "superadmin"])
def update_admin_notification(current_user, notification_id):
    notification = NotificationModel.get_by_id(notification_id)
    if not notification:
        return jsonify({"error": "Notificacion no encontrada"}), 404

    data = request.json or {}
    if data.get("status") and data.get("status") not in ["draft", "scheduled", "published"]:
        return jsonify({"error": "Estado de notificacion no valido"}), 400

    current_status = notification.get("status")
    requested_status = data.get("status")
    if current_status == "published" and requested_status in ["draft", "scheduled"]:
        data["status"] = "published"

    if data.get("status") == "scheduled":
        scheduled_for = data.get("scheduled_for")
        if not scheduled_for:
            return jsonify({"error": "Falta la fecha programada"}), 400
        try:
            scheduled_at = datetime.fromisoformat(scheduled_for)
        except ValueError:
            return jsonify({"error": "La fecha programada no es valida"}), 400

        if scheduled_at <= datetime.utcnow():
            return jsonify({"error": "La fecha programada debe estar en el futuro"}), 400

    updated = NotificationModel.update_notification(notification_id, data)

    previous_image = notification.get("image", "")
    next_image = (data.get("image") if data.get("image") is not None else previous_image) or ""
    if previous_image and previous_image != next_image:
        delete_uploaded_file(app.config["NOTIFICATION_UPLOAD_FOLDER"], previous_image)

    return jsonify({
        "message": "Notificacion actualizada",
        "notification": serialize_doc(updated)
    })


@app.route("/api/admin/notifications/<notification_id>", methods=["DELETE"])
@token_required(allowed_roles=["admin", "superadmin"])
def delete_admin_notification(current_user, notification_id):
    notification = NotificationModel.get_by_id(notification_id)
    if not notification:
        return jsonify({"error": "Notificacion no encontrada"}), 404

    NotificationModel.delete_notification(notification_id)
    delete_uploaded_file(app.config["NOTIFICATION_UPLOAD_FOLDER"], notification.get("image", ""))
    return jsonify({"message": "Notificacion eliminada"})


@app.route("/api/notifications/<user_notification_id>/read", methods=["PUT"])
@token_required(allowed_roles=["user"])
def mark_notification_as_read(current_user, user_notification_id):
    NotificationModel.mark_as_read(str(current_user["_id"]), user_notification_id)
    return jsonify({"message": "Notificacion marcada como leida"})


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
# HERO PRINCIPAL
# =========================
@app.route("/api/hero", methods=["GET"])
def get_hero():
    hero = HeroModel.get_hero()
    return jsonify(serialize_doc(hero))


@app.route("/api/hero", methods=["PUT"])
@token_required(allowed_roles=["superadmin"])
def update_hero(current_user):
    current_hero = HeroModel.get_hero()
    payload = request.json or {}
    previous_image = current_hero.get("image", "")
    next_image = payload.get("image", previous_image) or ""

    HeroModel.update_hero(payload)

    if previous_image and previous_image != next_image:
      delete_uploaded_file(app.config["HERO_UPLOAD_FOLDER"], previous_image)

    return jsonify({"message": "Hero principal actualizado"})


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

    data = request.json or {}
    email = data.get("email", "").strip().lower()
    if email:
        existing = UserModel.find_by_email_except(email, admin_id)
        if existing:
            return jsonify({"error": "El correo ya esta registrado por otra cuenta"}), 409

    UserModel.update_user(admin_id, data)
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
