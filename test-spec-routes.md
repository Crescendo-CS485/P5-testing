# Test Specification: backend/app/routes.py

## Function List

1. **get_artists()** — `GET /api/artists` — Returns paginated artist list with optional filters for active discussions, genre, and sort order.
2. **get_artist(artist_id)** — `GET /api/artists/<id>` — Returns a single artist by ID.
3. **get_genres()** — `GET /api/genres` — Returns all genre names sorted alphabetically.
4. **post_event()** — `POST /api/events` — Triggers staggered LLM bot activity for an artist.
5. **get_artist_discussions(artist_id)** — `GET /api/artists/<id>/discussions` — Returns paginated discussions for an artist.
6. **create_post(discussion_id)** — `POST /api/discussions/<id>/posts` — Creates a new post in a discussion and triggers bot replies.
7. **get_discussion_posts(discussion_id)** — `GET /api/discussions/<id>/posts` — Returns paginated posts for a discussion with nested author data.
8. **get_albums()** — `GET /api/albums` — Returns paginated albums with genre, type, time range, and sort filters.
9. **get_album_genres()** — `GET /api/albums/genres` — Returns genres with album counts, average scores, and cover images.
10. **get_all_discussions()** — `GET /api/discussions` — Returns all discussions sorted by recent or popular.
11. **get_stats()** — `GET /api/stats` — Returns platform-wide statistics (artist, user, post, bot counts).
12. **search()** — `GET /api/search` — Searches artists and albums by name/title.
13. **debug_jobs()** — `GET /api/debug/jobs` — Returns the last 20 LLM jobs with status.
14. **debug_run_job(job_id)** — `POST /api/debug/run-job/<id>` — Synchronously executes a pending LLM job.

## Test Table

| # | Function | Test Purpose | Test Inputs | Expected Output |
|---|----------|-------------|-------------|-----------------|
| 1 | get_artists() | Verify default paginated response returns artists | `GET /api/artists` | Status 200. JSON body contains `"artists"` (array), `"total"` (int), `"page": 1`, `"pages"` (int) |
| 2 | get_artists() | Verify active_discussions filter only returns artists with score >= 8.5 | `GET /api/artists?active_discussions=true` (DB has artists with scores 7.0 and 9.0) | Status 200. `"artists"` array contains only the artist with score 9.0 |
| 3 | get_artists() | Verify active_discussions=false returns all artists | `GET /api/artists?active_discussions=false` | Status 200. `"artists"` array includes artists regardless of score |
| 4 | get_artists() | Verify genre filter narrows results | `GET /api/artists?genre=Pop` (DB has 1 Pop artist, 1 Rock artist) | Status 200. `"artists"` array length is 1, artist has "Pop" in genres |
| 5 | get_artists() | Verify multi-genre filter | `GET /api/artists?genre=Pop&genre=Rock` | Status 200. Returns artists matching either Pop or Rock |
| 6 | get_artists() | Verify sort=activity orders by activity_score descending | `GET /api/artists?sort=activity` (DB has artists with scores 5.0 and 9.0) | Status 200. First artist in array has score 9.0 |
| 7 | get_artists() | Verify sort=recent orders by discussion_count descending | `GET /api/artists?sort=recent` | Status 200. Artists ordered by discussion_count descending |
| 8 | get_artists() | Verify pagination with page and per_page | `GET /api/artists?page=2&per_page=1` (DB has 3 artists) | Status 200. `"page": 2`, `"pages": 3`, `"artists"` array length is 1 |
| 9 | get_artists() | Verify empty result when no artists match filter | `GET /api/artists?active_discussions=true` (all artists have score < 8.5) | Status 200. `"artists": []`, `"total": 0` |
| 10 | get_artist() | Verify returns single artist by ID | `GET /api/artists/1` (artist exists) | Status 200. JSON body contains `"artist"` dict with `"id": "1"` |
| 11 | get_artist() | Verify 404 for non-existent artist | `GET /api/artists/9999` | Status 404. JSON body contains `"error"` |
| 12 | get_genres() | Verify returns all genre names sorted alphabetically | `GET /api/genres` (DB has genres: "Rock", "Pop", "Jazz") | Status 200. `"genres": ["Jazz", "Pop", "Rock"]` |
| 13 | get_genres() | Verify empty response when no genres exist | `GET /api/genres` (empty DB) | Status 200. `"genres": []` |
| 14 | post_event() | Verify successful event trigger returns job count | `POST /api/events` with body `{"eventType": "page_activation", "artistId": 1}` (artist exists, personas exist) | Status 200. JSON contains `"message"` and `"job_count"` >= 1 |
| 15 | post_event() | Verify 400 when artistId is missing | `POST /api/events` with body `{"eventType": "page_activation"}` | Status 400. JSON contains `"error": "artistId is required"` |
| 16 | post_event() | Verify 404 when artist does not exist | `POST /api/events` with body `{"eventType": "page_activation", "artistId": 9999}` | Status 404. JSON contains `"error"` |
| 17 | post_event() | Verify deduplication within 60s returns job_count 0 | `POST /api/events` with artistId=1 twice within 60 seconds | Second call returns `"job_count": 0` |
| 18 | get_artist_discussions() | Verify returns paginated discussions for an artist | `GET /api/artists/1/discussions` (artist has 2 discussions) | Status 200. `"discussions"` array length is 2, `"total": 2` |
| 19 | get_artist_discussions() | Verify 404 for non-existent artist | `GET /api/artists/9999/discussions` | Status 404. JSON contains `"error"` |
| 20 | get_artist_discussions() | Verify discussions are ordered by last_activity_at descending | `GET /api/artists/1/discussions` (2 discussions with different last_activity_at) | First discussion in array has the more recent last_activity_at |
| 21 | create_post() | Verify creating a post with session user | `POST /api/discussions/1/posts` with body `{"body": "Great song!"}`, session user_id=1 | Status 201. JSON `"post"` contains `"body": "Great song!"`, `"author"` with the session user's data |
| 22 | create_post() | Verify creating a post with displayName/handle (anonymous) | `POST /api/discussions/1/posts` with body `{"body": "Nice!", "displayName": "Guest", "handle": "@guest"}`, no session | Status 201. JSON `"post"` contains author with `"displayName": "Guest"` |
| 23 | create_post() | Verify 404 for non-existent discussion | `POST /api/discussions/9999/posts` with body `{"body": "Hello"}` | Status 404. JSON contains `"error"` |
| 24 | create_post() | Verify 400 when body is empty | `POST /api/discussions/1/posts` with body `{"body": ""}` | Status 400. JSON contains `"error": "Body is required"` |
| 25 | create_post() | Verify post increments discussion post_count | `POST /api/discussions/1/posts` with body `{"body": "Test"}` (discussion.post_count was 5) | After request, discussion.post_count equals 6 |
| 26 | create_post() | Verify handle gets "@" prefix if missing | `POST /api/discussions/1/posts` with body `{"body": "Hi", "handle": "noatsign"}` | Created user has handle `"@noatsign"` |
| 27 | get_discussion_posts() | Verify returns paginated posts with discussion metadata | `GET /api/discussions/1/posts` (discussion has 3 posts) | Status 200. JSON contains `"posts"` (array of 3), `"total": 3`, `"discussion"` dict |
| 28 | get_discussion_posts() | Verify 404 for non-existent discussion | `GET /api/discussions/9999/posts` | Status 404. JSON contains `"error"` |
| 29 | get_discussion_posts() | Verify posts are ordered by created_at ascending | `GET /api/discussions/1/posts` (posts created at t1, t2, t3) | Posts array is ordered oldest first |
| 30 | get_discussion_posts() | Verify deleted posts are excluded | `GET /api/discussions/1/posts` (1 normal post, 1 with is_deleted=True) | `"posts"` array length is 1, `"total": 1` |
| 31 | get_discussion_posts() | Verify each post includes nested author with isBot field | `GET /api/discussions/1/posts` (post by bot user) | Post's `"author"` contains `"isBot": true`, `"botLabel": "Synthetic Fan"` |
| 32 | get_albums() | Verify default album listing | `GET /api/albums` | Status 200. JSON contains `"albums"` (array), `"total"`, `"page"`, `"pages"` |
| 33 | get_albums() | Verify genre filter | `GET /api/albums?genre=R%26B` (1 R&B album exists) | Status 200. `"albums"` array length is 1 |
| 34 | get_albums() | Verify album type filter | `GET /api/albums?type=EP` (1 EP, 2 studio albums) | Status 200. `"albums"` array length is 1 with `"albumType": "EP"` |
| 35 | get_albums() | Verify time_range=2026 filters by year | `GET /api/albums?time_range=2026` (1 album in 2026, 1 in 2025) | Status 200. `"albums"` array contains only the 2026 album |
| 36 | get_albums() | Verify sort=user_score orders descending | `GET /api/albums?sort=user_score` (albums with scores 7.0 and 9.5) | First album has `"userScore": 9.5` |
| 37 | get_album_genres() | Verify returns genres with album counts and avg scores | `GET /api/albums/genres` (genre "Pop" has 2 albums with scores 8.0 and 9.0) | Status 200. `"genres"` array includes entry with `"name": "Pop"`, `"albumCount": 2`, `"avgScore": 8.5` |
| 38 | get_album_genres() | Verify genres with no albums are excluded | `GET /api/albums/genres` (genre "Classical" has 0 albums) | `"genres"` array does not contain an entry with `"name": "Classical"` |
| 39 | get_all_discussions() | Verify default sort is by most recent | `GET /api/discussions` (2 discussions with different last_activity_at) | Status 200. First discussion has the more recent last_activity_at |
| 40 | get_all_discussions() | Verify sort=popular orders by post_count descending | `GET /api/discussions?sort=popular` (discussions with post_count 5 and 20) | First discussion has `"postCount": 20` |
| 41 | get_stats() | Verify returns correct platform counts | `GET /api/stats` (DB has 3 artists, 2 human users, 1 bot, 10 discussions, 50 posts) | Status 200. `{"artistCount": 3, "userCount": 2, "botCount": 1, "discussionCount": 10, "postCount": 50}` |
| 42 | search() | Verify artist search by partial name | `GET /api/search?q=Luna` (artist "Luna Rivera" exists) | Status 200. `"artists"` array contains artist with name "Luna Rivera" |
| 43 | search() | Verify album search by partial title | `GET /api/search?q=Ctrl` (album "Ctrl" exists) | Status 200. `"albums"` array contains album with title "Ctrl" |
| 44 | search() | Verify query under 2 characters returns empty | `GET /api/search?q=A` | Status 200. `"artists": []`, `"albums": []` |
| 45 | search() | Verify search is case-insensitive | `GET /api/search?q=luna` (artist "Luna Rivera" exists) | Status 200. `"artists"` array contains "Luna Rivera" |
| 46 | debug_jobs() | Verify returns last 20 jobs | `GET /api/debug/jobs` (DB has 25 LLMJobs) | Status 200. JSON array length is 20, ordered by created_at descending |
| 47 | debug_jobs() | Verify job fields are present | `GET /api/debug/jobs` (1 completed job exists) | Each job object contains keys: `id`, `artist_id`, `discussion_id`, `status`, `scheduled_time`, `completed_at`, `error_msg` |
| 48 | debug_run_job() | Verify sync execution of a pending job | `POST /api/debug/run-job/1` (job 1 is pending, persona and discussion exist, LLM mocked) | Status 200. JSON `"status"` equals `"completed"` |
| 49 | debug_run_job() | Verify error returned for non-existent job | `POST /api/debug/run-job/9999` | Status 200 or 500. `"status"` is not `"completed"` or error is returned |
