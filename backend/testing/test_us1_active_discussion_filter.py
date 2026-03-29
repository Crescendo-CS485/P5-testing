"""
User Story 1: Active Discussion Filter for Music Discovery Page

Program path under test:
  GET /api/artists?active_discussions=true
    → routes.py: filters Artist.activity_score >= 8.5
  POST (LLM job completes)
    → llm_worker._execute_job()
    → ActivityAggregationService.update_artist_scores()
    → Artist.activity_score recomputed from recent posts + unique authors
"""

import pytest
from app import db
from app.models import Artist, Discussion, Post, User
from app.services.activity_aggregation import ActivityAggregationService


@pytest.fixture
def two_artists():
    """One artist above the 8.5 threshold, one below."""
    active = Artist(name="Active Artist", activity_score=9.0)
    inactive = Artist(name="Inactive Artist", activity_score=5.0)
    db.session.add_all([active, inactive])
    db.session.commit()
    return active.id, inactive.id


def test_filter_returns_only_active_artists(client, two_artists):
    resp = client.get("/api/artists?active_discussions=true")
    assert resp.status_code == 200
    names = [a["name"] for a in resp.get_json()["artists"]]
    assert "Active Artist" in names
    assert "Inactive Artist" not in names


def test_no_filter_returns_all_artists(client, two_artists):
    resp = client.get("/api/artists")
    assert resp.status_code == 200
    names = [a["name"] for a in resp.get_json()["artists"]]
    assert "Active Artist" in names
    assert "Inactive Artist" in names


def test_activity_score_crosses_threshold_after_enough_posts():
    """
    Score formula: base 5.5 + posts*0.5 (max 3.0) + authors*0.6 (max 1.5) = max 10.0.
    6 posts from 3 unique authors → post_contribution=3.0, author_contribution=1.5 → score=10.0 >= 8.5.
    """
    bot = User(display_name="Bot", handle="@bot_us1", is_bot=True)
    u1 = User(display_name="User1", handle="@u1_us1")
    u2 = User(display_name="User2", handle="@u2_us1")
    artist = Artist(name="Score Test Artist", activity_score=0.0)
    db.session.add_all([bot, u1, u2, artist])
    db.session.flush()

    disc = Discussion(artist_id=artist.id, author_user_id=bot.id, title="Test discussion")
    db.session.add(disc)
    db.session.flush()

    # 6 posts across 3 unique authors
    for author in [bot, u1, u2, bot, u1, u2]:
        db.session.add(Post(discussion_id=disc.id, author_user_id=author.id, body="x"))
    db.session.commit()

    ActivityAggregationService().update_artist_scores(artist.id)

    db.session.refresh(artist)
    assert artist.activity_score >= 8.5


def test_activity_score_stays_below_threshold_with_few_posts():
    """
    1 post from 1 unique author → post_contribution=0.5, author_contribution=0.6 → score=6.6 < 8.5.
    """
    bot = User(display_name="Bot2", handle="@bot2_us1", is_bot=True)
    artist = Artist(name="Low Score Artist", activity_score=0.0)
    db.session.add_all([bot, artist])
    db.session.flush()

    disc = Discussion(artist_id=artist.id, author_user_id=bot.id, title="Quiet discussion")
    db.session.add(disc)
    db.session.flush()

    db.session.add(Post(discussion_id=disc.id, author_user_id=bot.id, body="only post"))
    db.session.commit()

    ActivityAggregationService().update_artist_scores(artist.id)

    db.session.refresh(artist)
    assert artist.activity_score < 8.5


def test_latest_thread_info_updated_after_score_recalculation():
    """
    After update_artist_scores(), Artist.latest_thread_title reflects the most
    recently active discussion — this feeds the latestThread field in the API response.
    """
    bot = User(display_name="Bot3", handle="@bot3_us1", is_bot=True)
    artist = Artist(name="Thread Update Artist", activity_score=0.0)
    db.session.add_all([bot, artist])
    db.session.flush()

    disc = Discussion(artist_id=artist.id, author_user_id=bot.id, title="Expected Title")
    db.session.add(disc)
    db.session.commit()

    ActivityAggregationService().update_artist_scores(artist.id)

    db.session.refresh(artist)
    assert artist.latest_thread_title == "Expected Title"
