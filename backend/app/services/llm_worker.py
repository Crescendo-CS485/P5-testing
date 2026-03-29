from datetime import datetime, timezone
from .. import db
from ..models import LLMJob, LLMPersona, Post, Discussion
from .llm_service import LLMServiceAPI
from .activity_aggregation import ActivityAggregationService


def run_llm_job(job_id: int) -> None:
    from ..scheduler import get_flask_app

    app = get_flask_app()
    if app is None:
        return
    with app.app_context():
        _execute_job(job_id)


def _execute_job(job_id: int) -> None:
    job = LLMJob.query.get(job_id)
    if not job or job.status != "pending":
        return

    try:
        # Load persona via the bot user
        persona = LLMPersona.query.filter_by(user_id=job.llm_user_id).first()
        if not persona:
            job.status = "failed"
            job.error_msg = "No persona found for llm_user_id"
            db.session.commit()
            return

        discussion = Discussion.query.get(job.discussion_id)
        if not discussion:
            job.status = "failed"
            job.error_msg = "Discussion not found"
            db.session.commit()
            return

        # Fetch last 5 posts for context
        recent_posts = (
            Post.query.filter_by(discussion_id=job.discussion_id, is_deleted=False)
            .order_by(Post.created_at.desc())
            .limit(5)
            .all()
        )
        recent_post_bodies = [p.body for p in reversed(recent_posts)]

        # Generate comment via LLM
        llm = LLMServiceAPI()
        comment_text = llm.generate_comment(
            artist_name=discussion.artist.name,
            discussion_title=discussion.title,
            recent_posts=recent_post_bodies,
            persona_style=persona.engagement_style,
        )

        # Insert post
        post = Post(
            discussion_id=job.discussion_id,
            author_user_id=job.llm_user_id,
            body=comment_text,
        )
        db.session.add(post)

        # Update discussion metadata
        discussion.post_count = (discussion.post_count or 0) + 1
        discussion.last_activity_at = datetime.now(timezone.utc)

        # Update artist scores
        activity_svc = ActivityAggregationService()
        activity_svc.update_artist_scores(job.artist_id)

        # Mark job complete
        job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)
        db.session.commit()

    except Exception as exc:
        job.status = "failed"
        job.error_msg = str(exc)
        db.session.commit()
        raise
