import random
from datetime import datetime, timezone, timedelta
from .. import db
from ..models import Artist, Discussion, LLMJob, LLMPersona, User


class StaggerScheduler:
    def schedule_jobs(self, event_data: dict) -> int:
        """
        Schedule LLM response jobs.

        event_data keys:
          artist_id     (required) — which artist the discussion belongs to
          discussion_id (optional) — pin all jobs to a specific discussion;
                                     if omitted, jobs are spread across all of the
                                     artist's discussions (organic activity mode)
          bot_count     (optional) — override number of bots to schedule;
                                     defaults to 3–5 for organic, 1–2 for replies
        """
        from ..scheduler import scheduler
        from .llm_worker import run_llm_job

        artist_id = event_data["artist_id"]
        discussion_id = event_data.get("discussion_id")
        bot_count = event_data.get("bot_count")

        artist = Artist.query.get(artist_id)
        if not artist:
            return 0

        # Resolve target discussions
        if discussion_id:
            target = Discussion.query.get(discussion_id)
            if not target:
                return 0
            discussions = [target]
        else:
            discussions = Discussion.query.filter_by(artist_id=artist_id).all()
            if not discussions:
                seed_user = User.query.filter_by(is_bot=True).first()
                if not seed_user:
                    return 0
                disc = Discussion(
                    artist_id=artist_id,
                    author_user_id=seed_user.id,
                    title=f"Let's talk about {artist.name}",
                    post_count=0,
                )
                db.session.add(disc)
                db.session.flush()
                discussions = [disc]

        # Pick bot personas
        personas = LLMPersona.query.all()
        if not personas:
            return 0

        n = bot_count if bot_count else random.randint(3, min(5, len(personas)))
        n = min(n, len(personas))
        selected_personas = random.sample(personas, n)

        now = datetime.now(timezone.utc)
        jobs_created = 0

        for persona in selected_personas:
            discussion = random.choice(discussions)
            offset_seconds = random.randint(10, 120)
            scheduled_time = now + timedelta(seconds=offset_seconds)

            job = LLMJob(
                artist_id=artist_id,
                discussion_id=discussion.id,
                llm_user_id=persona.user_id,
                scheduled_time=scheduled_time,
                status="pending",
            )
            db.session.add(job)
            db.session.flush()

            scheduler.add_job(
                run_llm_job,
                "date",
                run_date=scheduled_time,
                args=[job.id],
                id=f"llm_job_{job.id}",
                misfire_grace_time=30,
            )
            jobs_created += 1

        db.session.commit()
        return jobs_created
