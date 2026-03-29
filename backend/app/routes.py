from datetime import date, timedelta
from flask import Blueprint, request, jsonify, session
from sqlalchemy import nullslast
from .models import Artist, Genre, Discussion, Post, LLMJob, Album, User
from . import db

bp = Blueprint("api", __name__, url_prefix="/api")


@bp.route("/artists")
def get_artists():
    query = Artist.query

    # Filter: active discussions (activity_score >= 8.5)
    active_discussions = request.args.get("active_discussions", "false").lower() == "true"
    if active_discussions:
        query = query.filter(Artist.activity_score >= 8.5)

    # Filter: genres (multi-value)
    genres = request.args.getlist("genre")
    if genres:
        query = query.filter(Artist.genres.any(Genre.name.in_(genres)))

    # Sort
    sort = request.args.get("sort", "activity")
    if sort == "recent":
        query = query.order_by(Artist.discussion_count.desc())
    else:
        query = query.order_by(Artist.activity_score.desc())

    # Pagination
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 12, type=int)

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "artists": [a.to_dict() for a in paginated.items],
            "total": paginated.total,
            "page": paginated.page,
            "pages": paginated.pages,
        }
    )


@bp.route("/artists/<int:artist_id>")
def get_artist(artist_id):
    artist = Artist.query.get(artist_id)
    if not artist:
        return jsonify({"error": "Artist not found"}), 404
    return jsonify({"artist": artist.to_dict()})


@bp.route("/genres")
def get_genres():
    genres = Genre.query.order_by(Genre.name).all()
    return jsonify({"genres": [g.name for g in genres]})


@bp.route("/events", methods=["POST"])
def post_event():
    data = request.get_json(silent=True) or {}
    event_type = data.get("eventType", "")
    artist_id = data.get("artistId")

    if not artist_id:
        return jsonify({"error": "artistId is required"}), 400

    from .services.trigger_handler import TriggerHandlerService
    result = TriggerHandlerService().handle_event(event_type, int(artist_id))

    if "error" in result:
        return jsonify(result), 404
    return jsonify(result), 200


@bp.route("/artists/<int:artist_id>/discussions")
def get_artist_discussions(artist_id):
    artist = Artist.query.get(artist_id)
    if not artist:
        return jsonify({"error": "Artist not found"}), 404

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    paginated = (
        Discussion.query.filter_by(artist_id=artist_id)
        .order_by(Discussion.last_activity_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return jsonify({
        "discussions": [d.to_dict() for d in paginated.items],
        "total": paginated.total,
        "page": paginated.page,
        "pages": paginated.pages,
    })


@bp.route("/discussions/<int:discussion_id>/posts", methods=["POST"])
def create_post(discussion_id):
    from datetime import datetime, timezone
    from .models import User

    discussion = Discussion.query.get(discussion_id)
    if not discussion:
        return jsonify({"error": "Discussion not found"}), 404

    data = request.get_json(silent=True) or {}
    body = (data.get("body") or "").strip()
    if not body:
        return jsonify({"error": "Body is required"}), 400

    # Use session user if logged in; otherwise fall back to displayName/handle from body
    user_id = session.get("user_id")
    if user_id:
        author = User.query.get(user_id)
    else:
        display_name = (data.get("displayName") or "Anonymous").strip()
        handle = (data.get("handle") or "@anonymous").strip()
        if not handle.startswith("@"):
            handle = f"@{handle}"
        author = User.query.filter_by(handle=handle).first()
        if not author:
            author = User(display_name=display_name, handle=handle, is_bot=False)
            db.session.add(author)
            db.session.flush()

    post = Post(
        discussion_id=discussion_id,
        author_user_id=author.id,
        body=body,
    )
    db.session.add(post)

    # Keep discussion counters in sync
    discussion.post_count = (discussion.post_count or 0) + 1
    discussion.last_activity_at = datetime.now(timezone.utc)

    db.session.commit()

    # Trigger LLM responses to the user's post in this specific discussion
    from .services.trigger_handler import TriggerHandlerService
    TriggerHandlerService().handle_user_reply(
        artist_id=discussion.artist_id,
        discussion_id=discussion_id,
    )

    return jsonify({"post": post.to_dict()}), 201


@bp.route("/discussions/<int:discussion_id>/posts")
def get_discussion_posts(discussion_id):
    discussion = Discussion.query.get(discussion_id)
    if not discussion:
        return jsonify({"error": "Discussion not found"}), 404

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)

    paginated = (
        Post.query.filter_by(discussion_id=discussion_id, is_deleted=False)
        .order_by(Post.created_at.asc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return jsonify({
        "posts": [p.to_dict() for p in paginated.items],
        "total": paginated.total,
        "page": paginated.page,
        "pages": paginated.pages,
        "discussion": discussion.to_dict(),
    })


@bp.route("/albums")
def get_albums():
    query = Album.query

    # Filter: genres (multi-value)
    genres = request.args.getlist("genre")
    if genres:
        query = query.filter(Album.genres.any(Genre.name.in_(genres)))

    # Filter: album type
    album_type = request.args.get("type")
    if album_type:
        query = query.filter(Album.album_type == album_type)

    # Filter: time_range
    time_range = request.args.get("time_range", "all-time")
    today = date.today()
    if time_range in ("2026", "2025", "2024"):
        query = query.filter(Album.release_year == int(time_range))
    elif time_range == "today":
        query = query.filter(Album.release_date == today)
    elif time_range == "this-week":
        query = query.filter(Album.release_date >= today - timedelta(days=7), Album.release_date <= today)
    elif time_range == "this-month":
        query = query.filter(Album.release_date >= today - timedelta(days=30), Album.release_date <= today)
    elif time_range == "upcoming":
        query = query.filter(Album.release_date > today)

    # Sort
    sort = request.args.get("sort", "user_score")
    if sort == "critic_score":
        query = query.order_by(nullslast(Album.critic_score.desc()))
    elif sort == "release_date":
        query = query.order_by(Album.release_date.desc())
    elif sort == "review_count":
        query = query.order_by(Album.review_count.desc())
    else:
        query = query.order_by(Album.user_score.desc())

    # Pagination
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 12, type=int)
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "albums": [a.to_dict() for a in paginated.items],
        "total": paginated.total,
        "page": paginated.page,
        "pages": paginated.pages,
    })


@bp.route("/albums/genres")
def get_album_genres():
    genres = Genre.query.order_by(Genre.name).all()
    result = []
    for genre in genres:
        albums = genre.albums
        if not albums:
            continue
        count = len(albums)
        scores = [a.user_score for a in albums if a.user_score is not None]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
        cover_images = [a.cover_url for a in albums[:4] if a.cover_url]
        result.append({
            "name": genre.name,
            "albumCount": count,
            "avgScore": avg_score,
            "coverImages": cover_images,
        })
    result.sort(key=lambda x: x["albumCount"], reverse=True)
    return jsonify({"genres": result})


@bp.route("/discussions")
def get_all_discussions():
    sort = request.args.get("sort", "recent")
    if sort == "popular":
        query = Discussion.query.order_by(Discussion.post_count.desc())
    else:
        query = Discussion.query.order_by(Discussion.last_activity_at.desc())

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "discussions": [d.to_dict() for d in paginated.items],
        "total": paginated.total,
        "page": paginated.page,
        "pages": paginated.pages,
    })


@bp.route("/stats")
def get_stats():
    from .models import LLMPersona
    artist_count = Artist.query.count()
    discussion_count = Discussion.query.count()
    post_count = Post.query.filter_by(is_deleted=False).count()
    bot_count = User.query.filter_by(is_bot=True).count()
    user_count = User.query.filter_by(is_bot=False).count()
    return jsonify({
        "artistCount": artist_count,
        "discussionCount": discussion_count,
        "postCount": post_count,
        "botCount": bot_count,
        "userCount": user_count,
    })


@bp.route("/search")
def search():
    q = request.args.get("q", "").strip()
    if len(q) < 2:
        return jsonify({"artists": [], "albums": []})

    pattern = f"%{q}%"
    artists = Artist.query.filter(Artist.name.ilike(pattern)).limit(5).all()
    albums = Album.query.filter(Album.title.ilike(pattern)).limit(5).all()

    return jsonify({
        "artists": [a.to_dict() for a in artists],
        "albums": [a.to_dict() for a in albums],
    })


@bp.route("/debug/jobs")
def debug_jobs():
    """Shows the last 20 LLMJobs and their status/errors."""
    jobs = LLMJob.query.order_by(LLMJob.created_at.desc()).limit(20).all()
    return jsonify([
        {
            "id": j.id,
            "artist_id": j.artist_id,
            "discussion_id": j.discussion_id,
            "status": j.status,
            "scheduled_time": j.scheduled_time.isoformat(),
            "completed_at": j.completed_at.isoformat() if j.completed_at else None,
            "error_msg": j.error_msg,
        }
        for j in jobs
    ])


@bp.route("/debug/run-job/<int:job_id>", methods=["POST"])
def debug_run_job(job_id):
    """Synchronously runs a pending job — useful for testing without waiting for the scheduler."""
    from .services.llm_worker import _execute_job
    try:
        _execute_job(job_id)
        job = LLMJob.query.get(job_id)
        return jsonify({"status": job.status, "error_msg": job.error_msg})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
