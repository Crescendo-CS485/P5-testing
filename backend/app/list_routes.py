from flask import Blueprint, request, jsonify, session
from .models import List, ListAlbum, Album
from . import db

list_bp = Blueprint("lists", __name__, url_prefix="/api/lists")


@list_bp.route("", methods=["GET"])
def get_lists():
    lists = List.query.order_by(List.id).all()
    return jsonify({
        "lists": [l.to_dict() for l in lists],
        "total": len(lists),
    })


@list_bp.route("/<int:list_id>", methods=["GET"])
def get_list(list_id):
    lst = List.query.get(list_id)
    if not lst:
        return jsonify({"error": "List not found"}), 404
    return jsonify({"list": lst.to_dict(include_albums=True)})


@list_bp.route("", methods=["POST"])
def create_list():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip() or None

    if not title:
        return jsonify({"error": "Title is required"}), 400

    creator_user_id = session.get("user_id")

    lst = List(
        title=title,
        description=description,
        creator_user_id=creator_user_id,
        like_count=0,
    )
    db.session.add(lst)
    db.session.commit()
    return jsonify({"list": lst.to_dict()}), 201


@list_bp.route("/<int:list_id>/albums", methods=["POST"])
def add_album(list_id):
    lst = List.query.get(list_id)
    if not lst:
        return jsonify({"error": "List not found"}), 404

    data = request.get_json(silent=True) or {}
    album_id = data.get("albumId")
    if not album_id:
        return jsonify({"error": "albumId is required"}), 400

    album = Album.query.get(int(album_id))
    if not album:
        return jsonify({"error": "Album not found"}), 404

    existing = ListAlbum.query.filter_by(list_id=list_id, album_id=album.id).first()
    if not existing:
        la = ListAlbum(list_id=list_id, album_id=album.id)
        db.session.add(la)
        db.session.commit()

    return jsonify({"list": lst.to_dict(include_albums=True)}), 200


@list_bp.route("/<int:list_id>/albums/<int:album_id>", methods=["DELETE"])
def remove_album(list_id, album_id):
    lst = List.query.get(list_id)
    if not lst:
        return jsonify({"error": "List not found"}), 404

    la = ListAlbum.query.filter_by(list_id=list_id, album_id=album_id).first()
    if la:
        db.session.delete(la)
        db.session.commit()

    return jsonify({"list": lst.to_dict(include_albums=True)}), 200
