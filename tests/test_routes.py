"""
Tests for backend/app/routes.py

Covers all 14 route handlers: get_artists, get_artist, get_genres,
post_event, get_artist_discussions, create_post, get_discussion_posts,
get_albums, get_album_genres, get_all_discussions, get_stats, search,
debug_jobs, debug_run_job.
"""

from datetime import datetime, timezone, timedelta, date
from unittest.mock import patch, MagicMock
from app import db
from app.models import (
    Artist, Genre, User, Discussion, Post, Album,
    LLMJob, LLMPersona, List, ListAlbum,
)


# ── GET /api/artists ────────────────────────────────────────────────────

class TestGetArtists:
    """Spec tests 1-9"""

    def test_default_response(self, client, make_artist):
        make_artist(name="A1")
        db.session.commit()
        r = client.get("/api/artists")
        assert r.status_code == 200
        data = r.get_json()
        assert "artists" in data
        assert "total" in data
        assert data["page"] == 1
        assert data["total"] >= 1

    def test_active_discussions_filter(self, client, make_artist):
        make_artist(name="High", activity_score=9.0)
        make_artist(name="Low", activity_score=7.0)
        db.session.commit()
        r = client.get("/api/artists?active_discussions=true")
        data = r.get_json()
        names = [a["name"] for a in data["artists"]]
        assert "High" in names
        assert "Low" not in names

    def test_active_discussions_false(self, client, make_artist):
        make_artist(name="High2", activity_score=9.0)
        make_artist(name="Low2", activity_score=7.0)
        db.session.commit()
        r = client.get("/api/artists?active_discussions=false")
        data = r.get_json()
        assert data["total"] == 2

    def test_genre_filter(self, client, make_genre, make_artist):
        pop = make_genre("Pop")
        rock = make_genre("Rock")
        make_artist(name="PopArtist", genres=[pop])
        make_artist(name="RockArtist", genres=[rock])
        db.session.commit()
        r = client.get("/api/artists?genre=Pop")
        data = r.get_json()
        assert len(data["artists"]) == 1
        assert data["artists"][0]["name"] == "PopArtist"

    def test_multi_genre_filter(self, client, make_genre, make_artist):
        pop = make_genre("Pop")
        rock = make_genre("Rock")
        jazz = make_genre("Jazz")
        make_artist(name="PopArt", genres=[pop])
        make_artist(name="RockArt", genres=[rock])
        make_artist(name="JazzArt", genres=[jazz])
        db.session.commit()
        r = client.get("/api/artists?genre=Pop&genre=Rock")
        data = r.get_json()
        assert data["total"] == 2

    def test_sort_activity(self, client, make_artist):
        make_artist(name="Low3", activity_score=5.0)
        make_artist(name="High3", activity_score=9.0)
        db.session.commit()
        r = client.get("/api/artists?sort=activity")
        data = r.get_json()
        assert data["artists"][0]["activityScore"] == 9.0

    def test_sort_recent(self, client, make_artist):
        make_artist(name="Few", discussion_count=2)
        make_artist(name="Many", discussion_count=20)
        db.session.commit()
        r = client.get("/api/artists?sort=recent")
        data = r.get_json()
        assert data["artists"][0]["discussionCount"] == 20

    def test_pagination(self, client, make_artist):
        for i in range(3):
            make_artist(name=f"Art{i}", activity_score=float(i))
        db.session.commit()
        r = client.get("/api/artists?page=2&per_page=1")
        data = r.get_json()
        assert data["page"] == 2
        assert data["pages"] == 3
        assert len(data["artists"]) == 1

    def test_empty_when_no_match(self, client, make_artist):
        make_artist(name="LowScore", activity_score=3.0)
        db.session.commit()
        r = client.get("/api/artists?active_discussions=true")
        data = r.get_json()
        assert data["artists"] == []
        assert data["total"] == 0


# ── GET /api/artists/<id> ──────────────────────────────────────────────

class TestGetArtist:
    """Spec tests 10-11"""

    def test_returns_artist(self, client, make_artist):
        a = make_artist(name="Solo")
        db.session.commit()
        r = client.get(f"/api/artists/{a.id}")
        assert r.status_code == 200
        assert r.get_json()["artist"]["id"] == str(a.id)

    def test_404_missing(self, client):
        r = client.get("/api/artists/9999")
        assert r.status_code == 404


# ── GET /api/genres ─────────────────────────────────────────────────────

class TestGetGenres:
    """Spec tests 12-13"""

    def test_sorted_alphabetically(self, client, make_genre):
        make_genre("Rock")
        make_genre("Jazz")
        make_genre("Pop")
        db.session.commit()
        r = client.get("/api/genres")
        assert r.status_code == 200
        assert r.get_json()["genres"] == ["Jazz", "Pop", "Rock"]

    def test_empty(self, client):
        r = client.get("/api/genres")
        assert r.status_code == 200
        assert r.get_json()["genres"] == []


# ── POST /api/events ───────────────────────────────────────────────────

class TestPostEvent:
    """Spec tests 14-17"""

    def test_successful_trigger(self, client, make_artist, make_user, make_persona):
        a = make_artist(name="TrigArt")
        # Need at least 3 personas (StaggerScheduler picks randint(3, min(5, N)))
        bot1 = make_user(display_name="Bot1", handle="@trigbot1", is_bot=True)
        bot2 = make_user(display_name="Bot2", handle="@trigbot2", is_bot=True)
        bot3 = make_user(display_name="Bot3", handle="@trigbot3", is_bot=True)
        make_persona(bot1.id)
        make_persona(bot2.id, name="Bot2")
        make_persona(bot3.id, name="Bot3")
        disc = Discussion(
            artist_id=a.id, author_user_id=bot1.id,
            title="Trigger disc", post_count=0,
        )
        db.session.add(disc)
        db.session.commit()
        r = client.post("/api/events", json={
            "eventType": "page_activation",
            "artistId": a.id,
        })
        assert r.status_code == 200
        data = r.get_json()
        assert data["job_count"] >= 1

    def test_missing_artist_id(self, client):
        r = client.post("/api/events", json={"eventType": "page_activation"})
        assert r.status_code == 400
        assert "artistId" in r.get_json()["error"]

    def test_nonexistent_artist(self, client):
        r = client.post("/api/events", json={
            "eventType": "page_activation",
            "artistId": 9999,
        })
        assert r.status_code == 404

    def test_dedup_within_60s(self, client, make_artist, make_user, make_persona):
        a = make_artist(name="DedupArt")
        bot1 = make_user(display_name="DBot1", handle="@dedupbot1", is_bot=True)
        bot2 = make_user(display_name="DBot2", handle="@dedupbot2", is_bot=True)
        bot3 = make_user(display_name="DBot3", handle="@dedupbot3", is_bot=True)
        make_persona(bot1.id)
        make_persona(bot2.id, name="DBot2")
        make_persona(bot3.id, name="DBot3")
        disc = Discussion(
            artist_id=a.id, author_user_id=bot1.id,
            title="Dedup disc", post_count=0,
        )
        db.session.add(disc)
        db.session.commit()
        # First call
        client.post("/api/events", json={
            "eventType": "page_activation", "artistId": a.id,
        })
        # Second call — should be deduped
        r2 = client.post("/api/events", json={
            "eventType": "page_activation", "artistId": a.id,
        })
        assert r2.get_json()["job_count"] == 0


# ── GET /api/artists/<id>/discussions ──────────────────────────────────

class TestGetArtistDiscussions:
    """Spec tests 18-20"""

    def test_returns_discussions(self, client, make_artist, make_user, make_discussion):
        a = make_artist(name="DiscArt")
        u = make_user(handle="@disc_rt")
        make_discussion(a.id, u.id, title="D1")
        make_discussion(a.id, u.id, title="D2")
        db.session.commit()
        r = client.get(f"/api/artists/{a.id}/discussions")
        assert r.status_code == 200
        data = r.get_json()
        assert len(data["discussions"]) == 2
        assert data["total"] == 2

    def test_404_missing_artist(self, client):
        r = client.get("/api/artists/9999/discussions")
        assert r.status_code == 404

    def test_ordered_by_last_activity(self, client, make_artist, make_user, make_discussion):
        a = make_artist(name="OrderArt")
        u = make_user(handle="@order_rt")
        make_discussion(
            a.id, u.id, title="Old",
            last_activity_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        )
        make_discussion(
            a.id, u.id, title="New",
            last_activity_at=datetime(2026, 3, 1, tzinfo=timezone.utc),
        )
        db.session.commit()
        r = client.get(f"/api/artists/{a.id}/discussions")
        data = r.get_json()
        assert data["discussions"][0]["title"] == "New"


# ── POST /api/discussions/<id>/posts ───────────────────────────────────

class TestCreatePost:
    """Spec tests 21-26"""

    def test_with_session_user(self, client, make_artist, make_user, make_discussion):
        a = make_artist(name="PostArt")
        u = make_user(handle="@sess_user")
        d = make_discussion(a.id, u.id)
        db.session.commit()
        with client.session_transaction() as sess:
            sess["user_id"] = u.id
        r = client.post(f"/api/discussions/{d.id}/posts", json={"body": "Great song!"})
        assert r.status_code == 201
        data = r.get_json()
        assert data["post"]["body"] == "Great song!"
        assert data["post"]["author"]["handle"] == "@sess_user"

    def test_with_display_name_handle(self, client, make_artist, make_user, make_discussion):
        a = make_artist(name="PostArt2")
        u = make_user(handle="@anon_creator")
        d = make_discussion(a.id, u.id)
        db.session.commit()
        r = client.post(f"/api/discussions/{d.id}/posts", json={
            "body": "Nice!",
            "displayName": "Guest",
            "handle": "@guest",
        })
        assert r.status_code == 201
        assert r.get_json()["post"]["author"]["displayName"] == "Guest"

    def test_404_missing_discussion(self, client):
        r = client.post("/api/discussions/9999/posts", json={"body": "Hello"})
        assert r.status_code == 404

    def test_400_empty_body(self, client, make_artist, make_user, make_discussion):
        a = make_artist(name="EmptyBody")
        u = make_user(handle="@empty_body")
        d = make_discussion(a.id, u.id)
        db.session.commit()
        r = client.post(f"/api/discussions/{d.id}/posts", json={"body": ""})
        assert r.status_code == 400

    def test_increments_post_count(self, client, make_artist, make_user, make_discussion):
        a = make_artist(name="CountArt")
        u = make_user(handle="@count_user")
        d = make_discussion(a.id, u.id, post_count=5)
        db.session.commit()
        with client.session_transaction() as sess:
            sess["user_id"] = u.id
        client.post(f"/api/discussions/{d.id}/posts", json={"body": "Test"})
        db.session.expire(d)
        assert Discussion.query.get(d.id).post_count == 6

    def test_handle_gets_at_prefix(self, client, make_artist, make_user, make_discussion):
        a = make_artist(name="PrefixArt")
        u = make_user(handle="@prefix_creator")
        d = make_discussion(a.id, u.id)
        db.session.commit()
        client.post(f"/api/discussions/{d.id}/posts", json={
            "body": "Hi",
            "handle": "noatsign",
        })
        created_user = User.query.filter_by(handle="@noatsign").first()
        assert created_user is not None


# ── GET /api/discussions/<id>/posts ────────────────────────────────────

class TestGetDiscussionPosts:
    """Spec tests 27-31"""

    def test_returns_posts_and_discussion(self, client, make_artist, make_user, make_discussion, make_post):
        a = make_artist(name="GetPosts")
        u = make_user(handle="@getposts")
        d = make_discussion(a.id, u.id)
        make_post(d.id, u.id, body="P1")
        make_post(d.id, u.id, body="P2")
        make_post(d.id, u.id, body="P3")
        db.session.commit()
        r = client.get(f"/api/discussions/{d.id}/posts")
        assert r.status_code == 200
        data = r.get_json()
        assert len(data["posts"]) == 3
        assert data["total"] == 3
        assert "discussion" in data

    def test_404_missing_discussion(self, client):
        r = client.get("/api/discussions/9999/posts")
        assert r.status_code == 404

    def test_ordered_ascending(self, client, make_artist, make_user, make_discussion):
        a = make_artist(name="OrderPosts")
        u = make_user(handle="@order_posts")
        d = make_discussion(a.id, u.id)
        p1 = Post(
            discussion_id=d.id, author_user_id=u.id, body="First",
            created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        )
        p2 = Post(
            discussion_id=d.id, author_user_id=u.id, body="Second",
            created_at=datetime(2026, 3, 1, tzinfo=timezone.utc),
        )
        db.session.add_all([p1, p2])
        db.session.commit()
        r = client.get(f"/api/discussions/{d.id}/posts")
        posts = r.get_json()["posts"]
        assert posts[0]["body"] == "First"
        assert posts[1]["body"] == "Second"

    def test_deleted_posts_excluded(self, client, make_artist, make_user, make_discussion, make_post):
        a = make_artist(name="Deleted")
        u = make_user(handle="@deleted_post")
        d = make_discussion(a.id, u.id)
        make_post(d.id, u.id, body="Visible")
        make_post(d.id, u.id, body="Gone", is_deleted=True)
        db.session.commit()
        r = client.get(f"/api/discussions/{d.id}/posts")
        data = r.get_json()
        assert len(data["posts"]) == 1
        assert data["total"] == 1

    def test_bot_flair_in_author(self, client, make_artist, make_user, make_discussion, make_post):
        a = make_artist(name="FlairArt")
        bot = make_user(
            display_name="BotFan", handle="@flair_bot",
            is_bot=True, bot_label="Synthetic Fan",
        )
        d = make_discussion(a.id, bot.id)
        make_post(d.id, bot.id, body="Bot says hi")
        db.session.commit()
        r = client.get(f"/api/discussions/{d.id}/posts")
        author = r.get_json()["posts"][0]["author"]
        assert author["isBot"] is True
        assert author["botLabel"] == "Synthetic Fan"


# ── GET /api/albums ─────────────────────────────────────────────────────

class TestGetAlbums:
    """Spec tests 32-36"""

    def test_default_listing(self, client, make_artist, make_album):
        a = make_artist(name="AlbumArt")
        make_album(title="A1", artist_id=a.id)
        db.session.commit()
        r = client.get("/api/albums")
        assert r.status_code == 200
        data = r.get_json()
        assert "albums" in data
        assert data["total"] >= 1

    def test_genre_filter(self, client, make_genre, make_artist, make_album):
        rb = make_genre("R&B")
        pop = make_genre("Pop")
        a = make_artist(name="AlbGenre")
        make_album(title="RB Album", artist_id=a.id, genres=[rb])
        make_album(title="Pop Album", artist_id=a.id, genres=[pop])
        db.session.commit()
        r = client.get("/api/albums?genre=R%26B")
        data = r.get_json()
        assert len(data["albums"]) == 1

    def test_type_filter(self, client, make_artist, make_album):
        a = make_artist(name="TypeArt")
        make_album(title="EP1", artist_id=a.id, album_type="EP")
        make_album(title="Studio1", artist_id=a.id, album_type="studio")
        make_album(title="Studio2", artist_id=a.id, album_type="studio")
        db.session.commit()
        r = client.get("/api/albums?type=EP")
        data = r.get_json()
        assert len(data["albums"]) == 1
        assert data["albums"][0]["albumType"] == "EP"

    def test_time_range_year(self, client, make_artist, make_album):
        a = make_artist(name="YearArt")
        make_album(title="2026 Album", artist_id=a.id,
                   release_date=date(2026, 1, 15), release_year=2026)
        make_album(title="2025 Album", artist_id=a.id,
                   release_date=date(2025, 6, 1), release_year=2025)
        db.session.commit()
        r = client.get("/api/albums?time_range=2026")
        data = r.get_json()
        assert len(data["albums"]) == 1
        assert data["albums"][0]["title"] == "2026 Album"

    def test_sort_user_score(self, client, make_artist, make_album):
        a = make_artist(name="ScoreArt")
        make_album(title="Low", artist_id=a.id, user_score=7.0)
        make_album(title="High", artist_id=a.id, user_score=9.5)
        db.session.commit()
        r = client.get("/api/albums?sort=user_score")
        data = r.get_json()
        assert data["albums"][0]["userScore"] == 9.5


# ── GET /api/albums/genres ──────────────────────────────────────────────

class TestGetAlbumGenres:
    """Spec tests 37-38"""

    def test_returns_genres_with_stats(self, client, make_genre, make_artist, make_album):
        pop = make_genre("Pop")
        a = make_artist(name="GenreStatArt")
        make_album(title="Pop1", artist_id=a.id, user_score=8.0, genres=[pop])
        make_album(title="Pop2", artist_id=a.id, user_score=9.0, genres=[pop])
        db.session.commit()
        r = client.get("/api/albums/genres")
        data = r.get_json()
        pop_entry = next(g for g in data["genres"] if g["name"] == "Pop")
        assert pop_entry["albumCount"] == 2
        assert pop_entry["avgScore"] == 8.5

    def test_excludes_empty_genres(self, client, make_genre):
        make_genre("Classical")
        db.session.commit()
        r = client.get("/api/albums/genres")
        names = [g["name"] for g in r.get_json()["genres"]]
        assert "Classical" not in names


# ── GET /api/discussions ────────────────────────────────────────────────

class TestGetAllDiscussions:
    """Spec tests 39-40"""

    def test_default_sort_recent(self, client, make_artist, make_user, make_discussion):
        a = make_artist(name="AllDiscArt")
        u = make_user(handle="@all_disc")
        make_discussion(
            a.id, u.id, title="Old",
            last_activity_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        )
        make_discussion(
            a.id, u.id, title="New",
            last_activity_at=datetime(2026, 3, 1, tzinfo=timezone.utc),
        )
        db.session.commit()
        r = client.get("/api/discussions")
        assert r.status_code == 200
        data = r.get_json()
        assert data["discussions"][0]["title"] == "New"

    def test_sort_popular(self, client, make_artist, make_user, make_discussion):
        a = make_artist(name="PopDiscArt")
        u = make_user(handle="@pop_disc")
        make_discussion(a.id, u.id, title="Few", post_count=5)
        make_discussion(a.id, u.id, title="Many", post_count=20)
        db.session.commit()
        r = client.get("/api/discussions?sort=popular")
        data = r.get_json()
        assert data["discussions"][0]["postCount"] == 20


# ── GET /api/stats ──────────────────────────────────────────────────────

class TestGetStats:
    """Spec test 41"""

    def test_correct_counts(self, client, make_artist, make_user, make_discussion, make_post):
        a1 = make_artist(name="Stat1")
        a2 = make_artist(name="Stat2")
        a3 = make_artist(name="Stat3")
        human1 = make_user(handle="@stat_h1", is_bot=False)
        human2 = make_user(handle="@stat_h2", is_bot=False)
        bot = make_user(handle="@stat_bot", is_bot=True)
        d = make_discussion(a1.id, human1.id)
        make_post(d.id, human1.id, body="P1")
        make_post(d.id, human2.id, body="P2")
        db.session.commit()
        r = client.get("/api/stats")
        assert r.status_code == 200
        data = r.get_json()
        assert data["artistCount"] == 3
        assert data["userCount"] == 2
        assert data["botCount"] == 1
        assert data["discussionCount"] == 1
        assert data["postCount"] == 2


# ── GET /api/search ─────────────────────────────────────────────────────

class TestSearch:
    """Spec tests 42-45"""

    def test_artist_by_name(self, client, make_artist):
        make_artist(name="Luna Rivera")
        db.session.commit()
        r = client.get("/api/search?q=Luna")
        data = r.get_json()
        assert any(a["name"] == "Luna Rivera" for a in data["artists"])

    def test_album_by_title(self, client, make_artist, make_album):
        a = make_artist(name="SearchArt")
        make_album(title="Ctrl", artist_id=a.id)
        db.session.commit()
        r = client.get("/api/search?q=Ctrl")
        data = r.get_json()
        assert any(al["title"] == "Ctrl" for al in data["albums"])

    def test_short_query_returns_empty(self, client):
        r = client.get("/api/search?q=A")
        data = r.get_json()
        assert data["artists"] == []
        assert data["albums"] == []

    def test_case_insensitive(self, client, make_artist):
        make_artist(name="Luna Rivera")
        db.session.commit()
        r = client.get("/api/search?q=luna")
        data = r.get_json()
        assert any(a["name"] == "Luna Rivera" for a in data["artists"])


# ── GET /api/debug/jobs ─────────────────────────────────────────────────

class TestDebugJobs:
    """Spec tests 46-47"""

    def test_returns_last_20(self, client, make_artist, make_user, make_discussion):
        a = make_artist(name="DebugArt")
        u = make_user(handle="@debug_user", is_bot=True)
        d = make_discussion(a.id, u.id)
        db.session.commit()
        for i in range(25):
            job = LLMJob(
                artist_id=a.id, discussion_id=d.id, llm_user_id=u.id,
                scheduled_time=datetime.now(timezone.utc),
                status="completed",
            )
            db.session.add(job)
        db.session.commit()
        r = client.get("/api/debug/jobs")
        assert r.status_code == 200
        assert len(r.get_json()) == 20

    def test_job_fields_present(self, client, make_artist, make_user, make_discussion):
        a = make_artist(name="FieldArt")
        u = make_user(handle="@field_user", is_bot=True)
        d = make_discussion(a.id, u.id)
        job = LLMJob(
            artist_id=a.id, discussion_id=d.id, llm_user_id=u.id,
            scheduled_time=datetime.now(timezone.utc),
            status="completed",
            completed_at=datetime.now(timezone.utc),
        )
        db.session.add(job)
        db.session.commit()
        r = client.get("/api/debug/jobs")
        entry = r.get_json()[0]
        for key in ("id", "artist_id", "discussion_id", "status",
                     "scheduled_time", "completed_at", "error_msg"):
            assert key in entry


# ── POST /api/debug/run-job/<id> ───────────────────────────────────────

class TestDebugRunJob:
    """Spec tests 48-49"""

    def test_sync_execution(self, client, make_artist, make_user, make_discussion, make_persona):
        a = make_artist(name="RunJobArt")
        bot = make_user(display_name="RunBot", handle="@runjob_bot", is_bot=True)
        make_persona(bot.id)
        d = make_discussion(a.id, bot.id, title="Run disc")
        job = LLMJob(
            artist_id=a.id, discussion_id=d.id, llm_user_id=bot.id,
            scheduled_time=datetime.now(timezone.utc),
            status="pending",
        )
        db.session.add(job)
        db.session.commit()

        with patch("app.services.llm_service.LLMServiceAPI.generate_comment",
                    return_value="Mocked comment"):
            r = client.post(f"/api/debug/run-job/{job.id}")
        assert r.status_code == 200
        assert r.get_json()["status"] == "completed"

    def test_nonexistent_job(self, client):
        r = client.post("/api/debug/run-job/9999")
        # _execute_job returns early for None job, then route tries job.status on None → 500
        assert r.status_code == 500
        data = r.get_json()
        assert "error" in data
