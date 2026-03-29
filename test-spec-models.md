# Test Specification: backend/app/models.py

## Function List

1. **Artist.to_dict()** — Serializes an Artist instance to a camelCase dictionary for API responses. Includes nested `latestThread` from the artist's discussions.
2. **User.to_dict()** — Serializes a User instance to a dictionary with `displayName`, `handle`, `isBot`, and `botLabel`.
3. **User.to_dict_auth()** — Extends `to_dict()` with the user's `email` field for authenticated responses.
4. **Discussion.to_dict()** — Serializes a Discussion instance including `artistName`, `postCount`, and ISO-formatted timestamps.
5. **Post.to_dict()** — Serializes a Post instance with nested author data via `author.to_dict()`.
6. **Album.to_dict()** — Serializes an Album instance with formatted release date, scores, and genre names.
7. **List.to_dict(include_albums=False)** — Serializes a List instance with album count and creator name. Optionally includes full album data.

## Test Table

| # | Function | Test Purpose | Test Inputs | Expected Output |
|---|----------|-------------|-------------|-----------------|
| 1 | Artist.to_dict() | Verify basic artist serialization with all fields populated | Artist with name="Luna Rivera", activity_score=9.4, image_url="https://img.com/luna.jpg", bio="Singer", discussion_count=5, genres=[Genre(name="Pop"), Genre(name="Indie")], one Discussion with id=10 | Dict with `"name": "Luna Rivera"`, `"activityScore": 9.4`, `"image": "https://img.com/luna.jpg"`, `"bio": "Singer"`, `"discussionCount": 5`, `"genres": ["Pop", "Indie"]`, `"latestThread": {"id": "10", ...}` |
| 2 | Artist.to_dict() | Verify `id` field is returned as a string | Artist with id=42 | `"id"` equals `"42"` (string, not int) |
| 3 | Artist.to_dict() | Verify latestThread is null-safe when artist has no discussions | Artist with no discussions | `"latestThread": {"id": None, "title": None, "timestamp": None}` |
| 4 | Artist.to_dict() | Verify latestThread picks the discussion with the most recent last_activity_at | Artist with two discussions: disc_old (last_activity_at=2026-01-01) and disc_new (last_activity_at=2026-03-01) | `"latestThread": {"id": str(disc_new.id), ...}` |
| 5 | Artist.to_dict() | Verify genres list is empty when artist has no genres | Artist with genres=[] | `"genres": []` |
| 6 | User.to_dict() | Verify human user serialization | User with id=1, display_name="Alice", handle="@alice", is_bot=False, bot_label=None | `{"id": "1", "displayName": "Alice", "handle": "@alice", "isBot": False, "botLabel": None}` |
| 7 | User.to_dict() | Verify bot user serialization includes bot label | User with id=2, display_name="BotFan", handle="@botfan", is_bot=True, bot_label="Synthetic Fan" | `{"id": "2", "displayName": "BotFan", "handle": "@botfan", "isBot": True, "botLabel": "Synthetic Fan"}` |
| 8 | User.to_dict() | Verify `id` is returned as string | User with id=99 | `"id"` equals `"99"` |
| 9 | User.to_dict_auth() | Verify auth dict includes email field | User with email="alice@example.com" | Result contains `"email": "alice@example.com"` |
| 10 | User.to_dict_auth() | Verify auth dict still includes all base to_dict fields | User with display_name="Alice", handle="@alice", is_bot=False | Result contains `"displayName": "Alice"`, `"handle": "@alice"`, `"isBot": False` |
| 11 | User.to_dict_auth() | Verify auth dict when email is None (bot user) | User with email=None, is_bot=True | Result contains `"email": None` |
| 12 | Discussion.to_dict() | Verify basic discussion serialization | Discussion with id=5, artist_id=1, artist.name="SZA", title="New album thoughts", post_count=12, last_activity_at=2026-03-15T10:00:00Z, created_at=2026-03-01T08:00:00Z | `{"id": "5", "artistId": "1", "artistName": "SZA", "title": "New album thoughts", "postCount": 12, "lastActivityAt": "2026-03-15T10:00:00+00:00", "createdAt": "2026-03-01T08:00:00+00:00"}` |
| 13 | Discussion.to_dict() | Verify IDs are strings | Discussion with id=7, artist_id=3 | `"id"` equals `"7"`, `"artistId"` equals `"3"` |
| 14 | Discussion.to_dict() | Verify artistName is populated from the artist relationship | Discussion with artist.name="Temp" | `"artistName": "Temp"` |
| 15 | Post.to_dict() | Verify post serialization with nested author | Post with id=20, body="Great track!", created_at=2026-03-10T12:00:00Z, author=User(display_name="Alice", handle="@alice", is_bot=False) | `{"id": "20", "body": "Great track!", "createdAt": "2026-03-10T12:00:00+00:00", "author": {"displayName": "Alice", "handle": "@alice", "isBot": False, ...}}` |
| 16 | Post.to_dict() | Verify post by bot user includes bot flair in nested author | Post with author=User(is_bot=True, bot_label="Synthetic Fan") | `"author"` dict contains `"isBot": True`, `"botLabel": "Synthetic Fan"` |
| 17 | Post.to_dict() | Verify author relationship is serialized as nested dict via author.to_dict() | Post with author=User(display_name="Embedded", handle="@post_embed") | `"author"` is not None, contains `"displayName": "Embedded"`, `"handle": "@post_embed"` |
| 18 | Album.to_dict() | Verify basic album serialization with formatted date | Album with id=3, title="Ctrl", artist_id=2, artist.name="SZA", release_date=date(2017,6,9), release_year=2017, user_score=9.2, critic_score=8.5, review_count=150, genres=[Genre(name="R&B")] | `{"id": "3", "title": "Ctrl", "artistName": "SZA", "releaseDate": "June 9, 2017", "releaseYear": 2017, "userScore": 9.2, "criticScore": 8.5, "reviewCount": 150, "genres": ["R&B"]}` |
| 19 | Album.to_dict() | Verify releaseDate is None when release_date is null | Album with release_date=None | `"releaseDate": None` |
| 20 | Album.to_dict() | Verify albumType defaults to "studio" | Album with album_type="studio" | `"albumType": "studio"` |
| 21 | Album.to_dict() | Verify criticScore can be None | Album with critic_score=None | `"criticScore": None` |
| 22 | List.to_dict() | Verify list serialization without albums | List with id=1, title="Top 10 R&B", description="My favorites", creator=User(display_name="Alice"), like_count=5, list_albums=[ListAlbum1, ListAlbum2] | `{"id": "1", "title": "Top 10 R&B", "description": "My favorites", "createdBy": "Alice", "albumCount": 2, "likes": 5}` and no `"albums"` key |
| 23 | List.to_dict(include_albums=True) | Verify list serialization includes albums array | List with 2 list_albums, include_albums=True | Result contains `"albums"` key with array of 2 album dicts |
| 24 | List.to_dict() | Verify creator falls back to "Anonymous" when None | List with creator=None | `"createdBy": "Anonymous"` |
| 25 | List.to_dict() | Verify albumCount is 0 when list has no albums | List with list_albums=[] | `"albumCount": 0` |
