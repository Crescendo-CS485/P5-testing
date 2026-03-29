"""
Tests for backend/app/models.py

Covers: Artist.to_dict, User.to_dict, User.to_dict_auth,
        Discussion.to_dict, Post.to_dict, Album.to_dict,
        List.to_dict (with and without include_albums).
"""

from datetime import datetime, timezone, date
from app import db
from app.models import (
    Artist, Genre, User, Discussion, Post, Album, List, ListAlbum,
)


# ── Artist.to_dict ──────────────────────────────────────────────────────

class TestArtistToDict:
    """Spec tests 1-5"""

    def test_basic_serialization(self, app, make_genre, make_artist, make_user, make_discussion):
        g1 = make_genre("Pop")
        g2 = make_genre("Indie")
        artist = make_artist(
            name="Luna Rivera",
            activity_score=9.4,
            image_url="https://img.com/luna.jpg",
            bio="Singer",
            discussion_count=5,
            genres=[g1, g2],
        )
        user = make_user()
        make_discussion(artist.id, user.id, title="Thread 1")
        db.session.commit()

        d = artist.to_dict()
        assert d["name"] == "Luna Rivera"
        assert d["activityScore"] == 9.4
        assert d["image"] == "https://img.com/luna.jpg"
        assert d["bio"] == "Singer"
        assert d["discussionCount"] == 5
        assert set(d["genres"]) == {"Pop", "Indie"}
        assert d["latestThread"]["id"] is not None

    def test_id_is_string(self, app, make_artist):
        artist = make_artist()
        db.session.commit()
        d = artist.to_dict()
        assert isinstance(d["id"], str)
        assert d["id"] == str(artist.id)

    def test_latest_thread_none_when_no_discussions(self, app, make_artist):
        artist = make_artist()
        db.session.commit()
        d = artist.to_dict()
        assert d["latestThread"]["id"] is None

    def test_latest_thread_picks_most_recent(self, app, make_artist, make_user, make_discussion):
        artist = make_artist()
        user = make_user()
        old = make_discussion(
            artist.id, user.id, title="Old",
            last_activity_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        )
        new = make_discussion(
            artist.id, user.id, title="New",
            last_activity_at=datetime(2026, 3, 1, tzinfo=timezone.utc),
        )
        db.session.commit()
        d = artist.to_dict()
        assert d["latestThread"]["id"] == str(new.id)

    def test_genres_empty(self, app, make_artist):
        artist = make_artist(genres=[])
        db.session.commit()
        d = artist.to_dict()
        assert d["genres"] == []


# ── User.to_dict ────────────────────────────────────────────────────────

class TestUserToDict:
    """Spec tests 6-8"""

    def test_human_user(self, app, make_user):
        user = make_user(display_name="Alice", handle="@alice", is_bot=False)
        db.session.commit()
        d = user.to_dict()
        assert d["displayName"] == "Alice"
        assert d["handle"] == "@alice"
        assert d["isBot"] is False
        assert d["botLabel"] is None

    def test_bot_user(self, app, make_user):
        user = make_user(
            display_name="BotFan", handle="@botfan",
            is_bot=True, bot_label="Synthetic Fan",
        )
        db.session.commit()
        d = user.to_dict()
        assert d["isBot"] is True
        assert d["botLabel"] == "Synthetic Fan"

    def test_id_is_string(self, app, make_user):
        user = make_user(handle="@unique1")
        db.session.commit()
        assert isinstance(user.to_dict()["id"], str)


# ── User.to_dict_auth ──────────────────────────────────────────────────

class TestUserToDictAuth:
    """Spec tests 9-11"""

    def test_includes_email(self, app, make_user):
        user = make_user(email="alice@example.com", handle="@alice_auth")
        db.session.commit()
        d = user.to_dict_auth()
        assert d["email"] == "alice@example.com"

    def test_includes_base_fields(self, app, make_user):
        user = make_user(display_name="Alice", handle="@alice_auth2", is_bot=False)
        db.session.commit()
        d = user.to_dict_auth()
        assert d["displayName"] == "Alice"
        assert d["handle"] == "@alice_auth2"
        assert d["isBot"] is False

    def test_email_none_for_bot(self, app, make_user):
        user = make_user(
            handle="@bot_auth", is_bot=True,
            bot_label="Synthetic Fan", email=None,
        )
        db.session.commit()
        d = user.to_dict_auth()
        assert d["email"] is None


# ── Discussion.to_dict ──────────────────────────────────────────────────

class TestDiscussionToDict:
    """Spec tests 12-14"""

    def test_basic_serialization(self, app, make_artist, make_user, make_discussion):
        artist = make_artist(name="SZA")
        user = make_user(handle="@disc_author")
        disc = make_discussion(
            artist.id, user.id,
            title="New album thoughts",
            post_count=12,
            last_activity_at=datetime(2026, 3, 15, 10, 0, 0, tzinfo=timezone.utc),
        )
        db.session.commit()
        d = disc.to_dict()
        assert d["id"] == str(disc.id)
        assert d["artistId"] == str(artist.id)
        assert d["artistName"] == "SZA"
        assert d["title"] == "New album thoughts"
        assert d["postCount"] == 12
        assert "2026-03-15" in d["lastActivityAt"]

    def test_ids_are_strings(self, app, make_artist, make_user, make_discussion):
        artist = make_artist(name="Test")
        user = make_user(handle="@disc_id")
        disc = make_discussion(artist.id, user.id)
        db.session.commit()
        d = disc.to_dict()
        assert isinstance(d["id"], str)
        assert isinstance(d["artistId"], str)

    def test_artist_name_populated_from_relationship(self, app, make_user):
        """Verify artistName is populated from the artist relationship."""
        user = make_user(handle="@orphan")
        artist = Artist(name="Temp")
        db.session.add(artist)
        db.session.flush()
        disc = Discussion(
            artist_id=artist.id,
            author_user_id=user.id,
            title="Test",
            post_count=0,
        )
        db.session.add(disc)
        db.session.commit()
        d = disc.to_dict()
        assert d["artistName"] == "Temp"


# ── Post.to_dict ────────────────────────────────────────────────────────

class TestPostToDict:
    """Spec tests 15-17"""

    def test_with_human_author(self, app, make_artist, make_user, make_discussion, make_post):
        artist = make_artist(name="PostArtist")
        user = make_user(display_name="Alice", handle="@post_human", is_bot=False)
        disc = make_discussion(artist.id, user.id)
        post = make_post(disc.id, user.id, body="Great track!")
        db.session.commit()
        d = post.to_dict()
        assert d["id"] == str(post.id)
        assert d["body"] == "Great track!"
        assert d["author"]["displayName"] == "Alice"
        assert d["author"]["isBot"] is False

    def test_with_bot_author(self, app, make_artist, make_user, make_discussion, make_post):
        artist = make_artist(name="PostArtist2")
        bot = make_user(
            display_name="BotFan", handle="@post_bot",
            is_bot=True, bot_label="Synthetic Fan",
        )
        disc = make_discussion(artist.id, bot.id)
        post = make_post(disc.id, bot.id, body="Love it!")
        db.session.commit()
        d = post.to_dict()
        assert d["author"]["isBot"] is True
        assert d["author"]["botLabel"] == "Synthetic Fan"

    def test_author_dict_embedded(self, app, make_artist, make_user, make_discussion):
        """Verify author relationship is serialized as a nested dict via author.to_dict()."""
        artist = make_artist(name="PostArtist3")
        user = make_user(handle="@post_embed", display_name="Embedded")
        disc = make_discussion(artist.id, user.id)
        post = Post(
            discussion_id=disc.id,
            author_user_id=user.id,
            body="Hello",
        )
        db.session.add(post)
        db.session.commit()
        d = post.to_dict()
        assert d["author"] is not None
        assert d["author"]["displayName"] == "Embedded"
        assert d["author"]["handle"] == "@post_embed"


# ── Album.to_dict ───────────────────────────────────────────────────────

class TestAlbumToDict:
    """Spec tests 18-21"""

    def test_basic_serialization(self, app, make_genre, make_artist, make_album):
        g = make_genre("R&B")
        artist = make_artist(name="SZA")
        album = make_album(
            title="Ctrl",
            artist_id=artist.id,
            release_date=date(2017, 6, 9),
            release_year=2017,
            user_score=9.2,
            critic_score=8.5,
            review_count=150,
            genres=[g],
        )
        db.session.commit()
        d = album.to_dict()
        assert d["title"] == "Ctrl"
        assert d["artistName"] == "SZA"
        assert d["releaseDate"] == "June 9, 2017"
        assert d["releaseYear"] == 2017
        assert d["userScore"] == 9.2
        assert d["criticScore"] == 8.5
        assert d["reviewCount"] == 150
        assert "R&B" in d["genres"]

    def test_release_date_none(self, app, make_artist, make_album):
        artist = make_artist(name="NullDate")
        album = make_album(title="No Date", artist_id=artist.id, release_date=None)
        # Manually set to None since factory defaults it
        album.release_date = None
        db.session.commit()
        d = album.to_dict()
        assert d["releaseDate"] is None

    def test_album_type_default(self, app, make_artist, make_album):
        artist = make_artist(name="TypeTest")
        album = make_album(title="Studio Album", artist_id=artist.id, album_type="studio")
        db.session.commit()
        assert album.to_dict()["albumType"] == "studio"

    def test_critic_score_none(self, app, make_artist, make_album):
        artist = make_artist(name="NullCritic")
        album = make_album(title="No Critic", artist_id=artist.id, critic_score=None)
        db.session.commit()
        assert album.to_dict()["criticScore"] is None


# ── List.to_dict ────────────────────────────────────────────────────────

class TestListToDict:
    """Spec tests 22-25"""

    def test_without_albums(self, app, make_user, make_artist, make_album):
        creator = make_user(display_name="Alice", handle="@list_creator")
        artist = make_artist(name="ListArtist")
        album = make_album(title="ListAlbum", artist_id=artist.id)
        lst = List(
            title="Top 10 R&B",
            description="My favorites",
            creator_user_id=creator.id,
            like_count=5,
        )
        db.session.add(lst)
        db.session.flush()
        la = ListAlbum(list_id=lst.id, album_id=album.id)
        db.session.add(la)
        db.session.commit()

        d = lst.to_dict()
        assert d["title"] == "Top 10 R&B"
        assert d["description"] == "My favorites"
        assert d["createdBy"] == "Alice"
        assert d["albumCount"] == 1
        assert d["likes"] == 5
        assert "albums" not in d

    def test_with_albums(self, app, make_user, make_artist, make_album):
        creator = make_user(display_name="Bob", handle="@list_albums")
        artist = make_artist(name="ListArtist2")
        album1 = make_album(title="Album A", artist_id=artist.id)
        album2 = make_album(title="Album B", artist_id=artist.id)
        lst = List(
            title="Best of 2026",
            creator_user_id=creator.id,
        )
        db.session.add(lst)
        db.session.flush()
        db.session.add_all([
            ListAlbum(list_id=lst.id, album_id=album1.id),
            ListAlbum(list_id=lst.id, album_id=album2.id),
        ])
        db.session.commit()

        d = lst.to_dict(include_albums=True)
        assert "albums" in d
        assert len(d["albums"]) == 2

    def test_creator_fallback_anonymous(self, app):
        lst = List(title="Orphan List", creator_user_id=None)
        db.session.add(lst)
        db.session.commit()
        d = lst.to_dict()
        assert d["createdBy"] == "Anonymous"

    def test_album_count_zero(self, app, make_user):
        creator = make_user(handle="@empty_list")
        lst = List(title="Empty", creator_user_id=creator.id)
        db.session.add(lst)
        db.session.commit()
        assert lst.to_dict()["albumCount"] == 0
