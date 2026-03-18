from datetime import datetime
from getpass import getpass

from models.user_model import UserModel


def prompt_value(label: str) -> str:
    return input(f"{label}: ").strip()


def main() -> None:
    print("Crear o promover superadmin de ShadowAngels")
    print("Deja vacio un campo si no quieres cambiarlo en un usuario existente.")

    name = prompt_value("Nombre")
    email = prompt_value("Correo").lower()

    if not email:
      print("El correo es obligatorio.")
      return

    password = getpass("Contrasena: ").strip()

    existing_user = UserModel.find_by_email(email)

    if existing_user:
        update_data = {"role": "superadmin"}

        if name:
            update_data["name"] = name

        if password:
            update_data["password"] = password

        UserModel.update_user(str(existing_user["_id"]), update_data)

        if existing_user.get("role") == "superadmin":
            print("Ese usuario ya era superadmin. Se actualizaron los datos enviados.")
        else:
            print("Usuario existente promovido a superadmin correctamente.")
        return

    if not name or not password:
        print("Para crear un nuevo superadmin necesitas nombre, correo y contrasena.")
        return

    UserModel.create_user({
        "name": name,
        "email": email,
        "password": password,
        "role": "superadmin",
        "created_at": datetime.utcnow()
    })
    print("Superadmin creado correctamente.")


if __name__ == "__main__":
    main()
