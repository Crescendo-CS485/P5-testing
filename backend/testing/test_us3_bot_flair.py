"""
User Story 3: Bot Flair for LLM-Generated Comments

Program path under test:
  GET /api/discussions/:id/posts
    → routes.py get_discussion_posts()
    → Post.to_dict() → author.to_dict()
    → response includes author.isBot and author.botLabel for every post

The backend data is already complete (User.is_bot, User.bot_label flow through to_dict).
These tests confirm the full path from DB → API response carries the correct bot identity
so the frontend can render the bot flair badge.
"""

import pytest
from app import db
from app.models import Artist, User, Discussion, Post


@pytest.fixture
def discussion_with_posts():
    """One discussion containing one bot post and one human post."""
    artist = Artist(name="Bot Flair Artist", activity_score=5.0)
    bot = User(
        display_name="Music Critic Bot",
        handle="@critic_bot",
        is_bot=True,
        bot_label="Music Critic",
    )
    human = User(display_name="Human User", handle="@human_user", is_bot=False)
    db.session.add_all([artist, bot, human])
    db.session.flush()

    disc = Discussion(artist_id=artist.id, author_user_id=bot.id, title="Bot Flair Test")
    db.session.add(disc)
    db.session.flush()

    bot_post = Post(discussion_id=disc.id, author_user_id=bot.id, body="This is a bot comment.")
    human_post = Post(discussion_id=disc.id, author_user_id=human.id, body="This is a human comment.")
    db.session.add_all([bot_post, human_post])
    db.session.commit()

    return disc.id, bot_post.id, human_post.id


def test_bot_post_author_has_is_bot_true(client, discussion_with_posts):
    disc_id, bot_post_id, _ = discussion_with_posts
    resp = client.get(f"/api/discussions/{disc_id}/posts")
    assert resp.status_code == 200
    posts = resp.get_json()["posts"]
    bot_posts = [p for p in posts if p["id"] == str(bot_post_id)]
    assert len(bot_posts) == 1
    assert bot_posts[0]["author"]["isBot"] is True


def test_bot_post_author_includes_bot_label(client, discussion_with_posts):
    disc_id, bot_post_id, _ = discussion_with_posts
    resp = client.get(f"/api/discussions/{disc_id}/posts")
    posts = resp.get_json()["posts"]
    bot_posts = [p for p in posts if p["id"] == str(bot_post_id)]
    assert bot_posts[0]["author"]["botLabel"] == "Music Critic"


def test_human_post_author_has_is_bot_false(client, discussion_with_posts):
    disc_id, _, human_post_id = discussion_with_posts
    resp = client.get(f"/api/discussions/{disc_id}/posts")
    assert resp.status_code == 200
    posts = resp.get_json()["posts"]
    human_posts = [p for p in posts if p["id"] == str(human_post_id)]
    assert len(human_posts) == 1
    assert human_posts[0]["author"]["isBot"] is False


def test_human_post_author_has_null_bot_label(client, discussion_with_posts):
    disc_id, _, human_post_id = discussion_with_posts
    resp = client.get(f"/api/discussions/{disc_id}/posts")
    posts = resp.get_json()["posts"]
    human_posts = [p for p in posts if p["id"] == str(human_post_id)]
    assert human_posts[0]["author"]["botLabel"] is None


def test_both_post_bodies_are_returned(client, discussion_with_posts):
    disc_id, bot_post_id, human_post_id = discussion_with_posts
    resp = client.get(f"/api/discussions/{disc_id}/posts")
    posts = resp.get_json()["posts"]
    bodies = {p["id"]: p["body"] for p in posts}
    assert bodies[str(bot_post_id)] == "This is a bot comment."
    assert bodies[str(human_post_id)] == "This is a human comment."
