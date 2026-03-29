from datetime import datetime, timezone
from . import db

artist_genres = db.Table(
    "artist_genres",
    db.Column("artist_id", db.Integer, db.ForeignKey("artist.id"), primary_key=True),
    db.Column("genre_id", db.Integer, db.ForeignKey("genre.id"), primary_key=True),
)

album_genres = db.Table(
    "album_genres",
    db.Column("album_id", db.Integer, db.ForeignKey("album.id"), primary_key=True),
    db.Column("genre_id", db.Integer, db.ForeignKey("genre.id"), primary_key=True),
)


class Genre(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)


class Artist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    image_url = db.Column(db.Text)
    bio = db.Column(db.Text)
    activity_score = db.Column(db.Float, default=0.0)
    discussion_count = db.Column(db.Integer, default=0)
    latest_thread_title = db.Column(db.String(500))
    latest_thread_timestamp = db.Column(db.String(100))
    genres = db.relationship(
        "Genre", secondary=artist_genres, backref="artists", lazy="joined"
    )

    def to_dict(self):
        # Find the most recently active discussion for this artist
        latest_disc = (
            max(self.discussions, key=lambda d: d.last_activity_at)
            if self.discussions else None
        )
        return {
            "id": str(self.id),
            "name": self.name,
            "image": self.image_url,
            "bio": self.bio,
            "activityScore": self.activity_score,
            "discussionCount": self.discussion_count,
            "latestThread": {
                "id": str(latest_disc.id) if latest_disc else None,
                "title": self.latest_thread_title,
                "timestamp": self.latest_thread_timestamp,
            },
            "genres": [g.name for g in self.genres],
        }


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    display_name = db.Column(db.String(200), nullable=False)
    handle = db.Column(db.String(100), unique=True, nullable=False)
    is_bot = db.Column(db.Boolean, default=False)
    bot_label = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    email = db.Column(db.String(255), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "displayName": self.display_name,
            "handle": self.handle,
            "isBot": self.is_bot,
            "botLabel": self.bot_label,
        }

    def to_dict_auth(self):
        d = self.to_dict()
        d["email"] = self.email
        return d


class LLMPersona(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    engagement_style = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    user = db.relationship("User", backref="persona")


class Discussion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    artist_id = db.Column(db.Integer, db.ForeignKey("artist.id"), nullable=False)
    author_user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    post_count = db.Column(db.Integer, default=0)
    last_activity_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    artist = db.relationship("Artist", backref="discussions")
    author = db.relationship("User", foreign_keys=[author_user_id])

    def to_dict(self):
        return {
            "id": str(self.id),
            "artistId": str(self.artist_id),
            "artistName": self.artist.name if self.artist else None,
            "title": self.title,
            "postCount": self.post_count,
            "lastActivityAt": self.last_activity_at.isoformat() if self.last_activity_at else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    discussion_id = db.Column(db.Integer, db.ForeignKey("discussion.id"), nullable=False)
    author_user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    is_deleted = db.Column(db.Boolean, default=False)

    discussion = db.relationship("Discussion", backref="posts")
    author = db.relationship("User", foreign_keys=[author_user_id])

    def to_dict(self):
        return {
            "id": str(self.id),
            "body": self.body,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "author": self.author.to_dict() if self.author else None,
        }


class Album(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    artist_id = db.Column(db.Integer, db.ForeignKey("artist.id"))
    cover_url = db.Column(db.String)
    release_date = db.Column(db.Date)
    release_year = db.Column(db.Integer)
    user_score = db.Column(db.Float)
    critic_score = db.Column(db.Float, nullable=True)
    review_count = db.Column(db.Integer, default=0)
    discussion_count = db.Column(db.Integer, default=0)
    list_appearances = db.Column(db.Integer, default=0)
    album_type = db.Column(db.String(50), default="studio")
    genres = db.relationship("Genre", secondary=album_genres, backref="albums", lazy="joined")
    artist = db.relationship("Artist", backref="albums")

    def to_dict(self):
        rd = self.release_date
        formatted = f"{rd.strftime('%B')} {rd.day}, {rd.year}" if rd else None
        return {
            "id": str(self.id),
            "title": self.title,
            "artistId": str(self.artist_id),
            "artistName": self.artist.name if self.artist else None,
            "coverUrl": self.cover_url,
            "releaseDate": formatted,
            "releaseYear": self.release_year,
            "userScore": self.user_score,
            "criticScore": self.critic_score,
            "reviewCount": self.review_count,
            "discussionCount": self.discussion_count,
            "listAppearances": self.list_appearances,
            "albumType": self.album_type,
            "genres": [g.name for g in self.genres],
        }


class List(db.Model):
    __tablename__ = "list"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text, nullable=True)
    creator_user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    like_count = db.Column(db.Integer, default=0)

    creator = db.relationship("User")
    list_albums = db.relationship("ListAlbum", backref="list", cascade="all, delete-orphan")

    def to_dict(self, include_albums=False):
        creator_name = self.creator.display_name if self.creator else "Anonymous"
        albums = [la.album.to_dict() for la in self.list_albums] if include_albums else []
        album_count = len(self.list_albums)
        result = {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "createdBy": creator_name,
            "albumCount": album_count,
            "likes": self.like_count,
        }
        if include_albums:
            result["albums"] = albums
        return result


class ListAlbum(db.Model):
    __tablename__ = "list_album"
    id = db.Column(db.Integer, primary_key=True)
    list_id = db.Column(db.Integer, db.ForeignKey("list.id"), nullable=False)
    album_id = db.Column(db.Integer, db.ForeignKey("album.id"), nullable=False)
    added_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    album = db.relationship("Album")


class LLMJob(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    artist_id = db.Column(db.Integer, db.ForeignKey("artist.id"), nullable=False)
    discussion_id = db.Column(db.Integer, db.ForeignKey("discussion.id"), nullable=False)
    llm_user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    scheduled_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default="pending")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime, nullable=True)
    error_msg = db.Column(db.Text, nullable=True)

    artist = db.relationship("Artist", backref="llm_jobs")
    discussion = db.relationship("Discussion", backref="llm_jobs")
    llm_user = db.relationship("User", foreign_keys=[llm_user_id])
