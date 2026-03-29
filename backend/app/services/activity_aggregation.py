from datetime import datetime, timezone, timedelta
from .. import db
from ..models import Artist, Discussion, Post


class ActivityAggregationService:
    def update_artist_scores(self, artist_id: int) -> None:
        artist = Artist.query.get(artist_id)
        if not artist:
            return

        discussions = Discussion.query.filter_by(artist_id=artist_id).all()
        artist.discussion_count = len(discussions)

        # Count posts from the last 7 days across all discussions
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        recent_post_count = 0
        unique_authors: set[int] = set()

        for disc in discussions:
            recent_posts = Post.query.filter(
                Post.discussion_id == disc.id,
                Post.created_at >= cutoff,
                Post.is_deleted == False,
            ).all()
            recent_post_count += len(recent_posts)
            for p in recent_posts:
                unique_authors.add(p.author_user_id)

        # Activity score: base 5.5 + posts (max 3.0) + unique authors (max 1.5)
        post_contribution = min(recent_post_count * 0.5, 3.0)
        author_contribution = min(len(unique_authors) * 0.6, 1.5)
        artist.activity_score = round(5.5 + post_contribution + author_contribution, 1)

        # Update latest thread info
        latest = (
            Discussion.query.filter_by(artist_id=artist_id)
            .order_by(Discussion.last_activity_at.desc())
            .first()
        )
        if latest:
            artist.latest_thread_title = latest.title
            artist.latest_thread_timestamp = latest.last_activity_at.isoformat()

        db.session.commit()
