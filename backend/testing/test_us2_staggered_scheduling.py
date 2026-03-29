"""
User Story 2: Staggered Scheduling for LLM-Generated Interactions

Program path under test:
  POST /api/events
    → routes.py → TriggerHandlerService.handle_event()
    → StaggerScheduler.schedule_jobs()   (organic: spread across all discussions, 3-5 bots)
    → LLMJob records persisted; scheduler.add_job() called with random date offsets

  POST /api/discussions/:id/posts  (human posts)
    → routes.py create_post() → TriggerHandlerService.handle_user_reply()
    → StaggerScheduler.schedule_jobs()   (reply: pinned to one discussion, 1-2 bots)

Dedup logic:
  - handle_event:      skips if a pending job for the artist exists within last 60s
  - handle_user_reply: skips if a pending job for the discussion exists within last 30s
"""

import pytest
from datetime import datetime, timezone, timedelta

from app import db
from app.models import Artist, User, LLMPersona, Discussion, LLMJob
from app.services.stagger_scheduler import StaggerScheduler
from app.services.trigger_handler import TriggerHandlerService


@pytest.fixture
def seeded():
    """Artist + 2 bot personas — minimum required by StaggerScheduler."""
    artist = Artist(name="Scheduler Artist", activity_score=5.0)
    db.session.add(artist)

    # Organic trigger needs randint(3, min(5, n_personas)) — seed at least 3.
    for i in range(3):
        bot = User(display_name=f"SchedBot{i}", handle=f"@schedbot{i}", is_bot=True)
        db.session.add(bot)
        db.session.flush()
        db.session.add(LLMPersona(name=f"Persona{i}", engagement_style="a music critic", user_id=bot.id))

    db.session.commit()
    return artist.id


def test_post_events_endpoint_creates_llm_jobs(client, seeded):
    """POST /api/events triggers the full scheduling path and returns job_count > 0."""
    resp = client.post("/api/events", json={"eventType": "trigger", "artistId": seeded})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["job_count"] > 0


def test_schedule_jobs_persists_staggered_llm_job_records(seeded):
    """
    Each scheduled job must have a scheduled_time between 10s and 120s from now.
    This verifies the random offset range in StaggerScheduler.schedule_jobs().
    """
    before = datetime.now(timezone.utc)
    count = StaggerScheduler().schedule_jobs({"artist_id": seeded})
    after = datetime.now(timezone.utc)

    assert count > 0

    jobs = LLMJob.query.filter_by(artist_id=seeded).all()
    assert len(jobs) == count

    for job in jobs:
        # SQLite strips tzinfo on retrieval; restore UTC so comparisons work
        sched = job.scheduled_time.replace(tzinfo=timezone.utc)
        assert sched >= before + timedelta(seconds=10), "offset must be at least 10s"
        assert sched <= after + timedelta(seconds=120), "offset must be at most 120s"


def test_organic_trigger_deduplicates_within_60s(seeded):
    """Second handle_event call within 60s for the same artist must return job_count=0."""
    svc = TriggerHandlerService()

    first = svc.handle_event("trigger", seeded)
    assert first["job_count"] > 0

    second = svc.handle_event("trigger", seeded)
    assert second["job_count"] == 0


def test_user_reply_pins_jobs_to_specific_discussion(seeded):
    """
    handle_user_reply must create jobs whose discussion_id matches the reply discussion,
    not spread them across other discussions.
    """
    bot = User.query.filter_by(is_bot=True).first()
    disc = Discussion(artist_id=seeded, author_user_id=bot.id, title="Reply target discussion")
    db.session.add(disc)
    db.session.commit()

    result = TriggerHandlerService().handle_user_reply(artist_id=seeded, discussion_id=disc.id)
    assert result["job_count"] >= 1

    jobs = LLMJob.query.filter_by(artist_id=seeded).all()
    assert all(j.discussion_id == disc.id for j in jobs)


def test_user_reply_schedules_at_most_two_bots(seeded):
    """handle_user_reply is configured for 1–2 bots (not the 3–5 organic default)."""
    bot = User.query.filter_by(is_bot=True).first()
    disc = Discussion(artist_id=seeded, author_user_id=bot.id, title="Reply count discussion")
    db.session.add(disc)
    db.session.commit()

    result = TriggerHandlerService().handle_user_reply(artist_id=seeded, discussion_id=disc.id)
    assert 1 <= result["job_count"] <= 2


def test_user_reply_deduplicates_within_30s(seeded):
    """Second handle_user_reply for the same discussion within 30s must return job_count=0."""
    bot = User.query.filter_by(is_bot=True).first()
    disc = Discussion(artist_id=seeded, author_user_id=bot.id, title="Dedup reply discussion")
    db.session.add(disc)
    db.session.commit()

    svc = TriggerHandlerService()
    first = svc.handle_user_reply(artist_id=seeded, discussion_id=disc.id)
    assert first["job_count"] >= 1

    second = svc.handle_user_reply(artist_id=seeded, discussion_id=disc.id)
    assert second["job_count"] == 0
