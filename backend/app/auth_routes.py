from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from .models import User
from . import db

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    display_name = data.get("displayName", "").strip()
    handle = data.get("handle", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not display_name or not handle or not email or not password:
        return jsonify({"error": "All fields are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # Normalise handle
    if not handle.startswith("@"):
        handle = f"@{handle}"

    # Check uniqueness
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already in use"}), 400
    if User.query.filter_by(handle=handle).first():
        return jsonify({"error": "Handle already taken"}), 400

    user = User(
        display_name=display_name,
        handle=handle,
        email=email,
        password_hash=generate_password_hash(password),
        is_bot=False,
    )
    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.id
    return jsonify({"user": user.to_dict_auth()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.password_hash or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    session["user_id"] = user.id
    return jsonify({"user": user.to_dict_auth()}), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    return jsonify({"message": "Logged out"}), 200


@auth_bp.route("/me", methods=["GET"])
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"user": None}), 200
    user = User.query.get(user_id)
    if not user:
        session.pop("user_id", None)
        return jsonify({"user": None}), 200
    return jsonify({"user": user.to_dict_auth()}), 200
