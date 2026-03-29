from datetime import datetime, timezone, date
from . import db
from .models import Artist, Genre, User, LLMPersona, Discussion, Post, Album, List, ListAlbum

ARTISTS_DATA = [
    {
        "name": "Kendrick Lamar",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/54/28/14/54281424-eece-0935-299d-fdd2ab403f92/24UM1IM28978.rgb.jpg/600x600bb.jpg",
        "bio": "Pulitzer Prize-winning rapper from Compton widely regarded as one of the greatest MCs of all time. His politically charged, deeply personal albums have redefined the possibilities of hip-hop as a literary art form.",
        "activity_score": 9.8,
        "discussion_count": 1842,
        "latest_thread_title": "GNX first listen thread — reactions?",
        "latest_thread_timestamp": "1 hour ago",
        "genres": ["Hip Hop"],
    },
    {
        "name": "Tyler, the Creator",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/b6/ef/ee/b6efeefa-fc99-37d1-ad21-0d769b2a4958/196872796971.jpg/600x600bb.jpg",
        "bio": "Grammy-winning rapper, producer, and creative director from Los Angeles known for his maximalist aesthetic and refusal to stay in one lane. Each album reinvents his persona while pushing the boundaries of rap, jazz, and pop.",
        "activity_score": 9.5,
        "discussion_count": 1456,
        "latest_thread_title": "CHROMAKOPIA production breakdown",
        "latest_thread_timestamp": "2 hours ago",
        "genres": ["Hip Hop"],
    },
    {
        "name": "Frank Ocean",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a2/5b/fb/a25bfb51-6377-a2c4-debf-9f1bcfee1151/00602527815084.rgb.jpg/600x600bb.jpg",
        "bio": "Reclusive R&B visionary whose albums channel ORANGE and Blonde are landmark statements in contemporary pop and soul. His elliptical songwriting and meticulous production have made him one of the most influential voices of his generation.",
        "activity_score": 9.4,
        "discussion_count": 1203,
        "latest_thread_title": "Blonde turns 8 — still holds up?",
        "latest_thread_timestamp": "3 hours ago",
        "genres": ["R&B", "Hip Hop"],
    },
    {
        "name": "SZA",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/62/93/13/6293132e-20ff-67ab-3d1f-96bb6797a6ba/196589564955.jpg/600x600bb.jpg",
        "bio": "St. Louis-born R&B artist whose 2017 debut CTRL became a generational touchstone for vulnerable, complex womanhood. Her 2022 follow-up SOS became one of the longest-charting albums in Billboard history.",
        "activity_score": 9.3,
        "discussion_count": 987,
        "latest_thread_title": "SOS deep cuts you haven't appreciated yet",
        "latest_thread_timestamp": "45 minutes ago",
        "genres": ["R&B"],
    },
    {
        "name": "boygenius",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/3d/e1/dc/3de1dc68-fcdf-3cc4-721a-d00cdc5f984b/744861140856.png/600x600bb.jpg",
        "bio": "Indie rock supergroup formed by Phoebe Bridgers, Julien Baker, and Lucy Dacus, whose 2023 debut album the record became a landmark of collaborative songwriting. Their harmonies and interlocking perspectives create something greater than the sum of three already extraordinary parts.",
        "activity_score": 9.2,
        "discussion_count": 876,
        "latest_thread_title": "the record deep dive — track rankings",
        "latest_thread_timestamp": "4 hours ago",
        "genres": ["Indie", "Folk"],
    },
    {
        "name": "Mitski",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/8f/4b/40/8f4b4044-d02b-dc25-7d01-7d9d225fdce4/40240.jpg/600x600bb.jpg",
        "bio": "Japanese-American singer-songwriter whose unflinching examinations of identity, longing, and alienation have made her essential listening for a generation. Her albums move between raw indie rock and minimalist art pop with extraordinary emotional precision.",
        "activity_score": 9.1,
        "discussion_count": 743,
        "latest_thread_title": "Be the Cowboy vs Laurel Hell — which era?",
        "latest_thread_timestamp": "2 hours ago",
        "genres": ["Indie", "Alternative"],
    },
    {
        "name": "Caroline Polachek",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/10/51/f2/1051f2cc-195f-ddb6-2d9e-26c74f0387fd/197187988518.jpg/600x600bb.jpg",
        "bio": "New York-based avant-pop visionary whose 2023 album Desire, I Want to Turn Into You was widely hailed as one of the decade's defining pop records. Her shapeshifting voice and conceptually ambitious productions occupy a space entirely her own.",
        "activity_score": 9.0,
        "discussion_count": 621,
        "latest_thread_title": "Desire — best pop album of the decade?",
        "latest_thread_timestamp": "1 hour ago",
        "genres": ["Pop", "Electronic"],
    },
    {
        "name": "Phoebe Bridgers",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/dd/1c/b8/dd1cb88f-f117-d707-b11f-fabe5acc39e4/36890.jpg/600x600bb.jpg",
        "bio": "Los Angeles singer-songwriter whose hushed, devastating indie folk has made her one of the defining voices of millennial heartbreak. A founding member of boygenius, her 2020 album Punisher is one of the decade's most celebrated records.",
        "activity_score": 8.9,
        "discussion_count": 598,
        "latest_thread_title": "Punisher lyrics dissection thread",
        "latest_thread_timestamp": "5 hours ago",
        "genres": ["Indie", "Folk"],
    },
    {
        "name": "Big Thief",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/40/40/53/404053dc-586e-f51c-8de9-446eef5af471/191400085077.png/600x600bb.jpg",
        "bio": "Brooklyn-based indie folk band led by Adrianne Lenker, whose prolific output and raw emotional power have made them one of the most acclaimed bands of the 2020s. Their sound moves between intimate acoustic folk and sprawling electric rock.",
        "activity_score": 8.8,
        "discussion_count": 463,
        "latest_thread_title": "Adrianne Lenker solo vs Big Thief — which do you prefer?",
        "latest_thread_timestamp": "6 hours ago",
        "genres": ["Indie", "Folk"],
    },
    {
        "name": "Japanese Breakfast",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/93/8b/8b/938b8b5d-1022-414f-995e-a25608fc68c3/17251.jpg/600x600bb.jpg",
        "bio": "The project of Michelle Zauner, Philadelphia-based musician and New York Times bestselling author of Crying in H Mart. Her albums are luminous, orchestral indie pop records that wrestle with grief, joy, and self-discovery.",
        "activity_score": 8.8,
        "discussion_count": 487,
        "latest_thread_title": "For Melancholy Brunettes first impressions",
        "latest_thread_timestamp": "3 hours ago",
        "genres": ["Indie", "Pop"],
    },
    {
        "name": "Floating Points",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/9d/a5/3f/9da53f24-8e91-bac8-588a-71fbc033ca45/5054429190212.png/600x600bb.jpg",
        "bio": "London producer Sam Shepherd whose meticulous approach to jazz-influenced electronic music has produced some of the most critically revered records of the 2010s and 2020s. His 2021 collaboration with Pharoah Sanders is considered a modern masterpiece.",
        "activity_score": 8.7,
        "discussion_count": 389,
        "latest_thread_title": "Promises — underrated electronic masterpiece?",
        "latest_thread_timestamp": "8 hours ago",
        "genres": ["Electronic", "Jazz"],
    },
    {
        "name": "Bon Iver",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/de/f0/bf/def0bfe3-6b57-34fa-3a40-bb67aa6284b2/656605235066.jpg/600x600bb.jpg",
        "bio": "Wisconsin-based project led by Justin Vernon, whose lo-fi cabin recordings evolved into ambitious orchestral explorations of grief, identity, and time. From For Emma, Forever Ago to 22, A Million, each record reinvents the sound entirely.",
        "activity_score": 8.7,
        "discussion_count": 412,
        "latest_thread_title": "SABLE, fABLE listening thread — first reactions",
        "latest_thread_timestamp": "2 hours ago",
        "genres": ["Indie", "Folk", "Electronic"],
    },
    {
        "name": "Sufjan Stevens",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/47/9e/a3/479ea382-2686-3ea9-3def-d67d81fb2ee3/mzi.lhtprasx.jpg/600x600bb.jpg",
        "bio": "Michigan-born singer-songwriter and multi-instrumentalist whose baroque-folk compositions rank among the most emotionally ambitious in contemporary music. His 2015 album Carrie & Lowell, made in the wake of his mother's death, is considered one of the great records of its era.",
        "activity_score": 8.6,
        "discussion_count": 367,
        "latest_thread_title": "Javelin and grief — emotional impact discussion",
        "latest_thread_timestamp": "10 hours ago",
        "genres": ["Folk", "Indie"],
    },
    {
        "name": "Thundercat",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/6d/57/95/6d579536-ee41-77a3-5c19-7ce1b80da929/5054429002584.png/600x600bb.jpg",
        "bio": "Los Angeles bassist and singer whose virtuosic playing spans jazz, funk, R&B, and experimental pop. A cornerstone of the Kendrick Lamar collaborator circle and Flying Lotus's Brainfeeder label, his records are sui generis in every sense.",
        "activity_score": 8.5,
        "discussion_count": 298,
        "latest_thread_title": "Thundercat's bass technique — breakdown thread",
        "latest_thread_timestamp": "7 hours ago",
        "genres": ["R&B", "Jazz", "Electronic"],
    },
    {
        "name": "Snail Mail",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e3/f0/b8/e3f0b8b0-88c4-58df-a148-d4714d4fe7dc/744861117957.png/600x600bb.jpg",
        "bio": "The project of Baltimore singer-songwriter Lindsey Jordan, whose debut Lush announced a major new voice in indie rock at age 18. Her 2021 follow-up Valentine solidified her reputation for devastatingly honest lyricism.",
        "activity_score": 8.5,
        "discussion_count": 312,
        "latest_thread_title": "Valentine vs Lush — which era is better?",
        "latest_thread_timestamp": "4 hours ago",
        "genres": ["Indie"],
    },
    {
        "name": "Denzel Curry",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ff/7a/2c/ff7a2cfa-d9d3-1625-0970-dcfbbd8d8b33/25CRGIM52646.rgb.jpg/600x600bb.jpg",
        "bio": "Intensely versatile Miami rapper who moves between brutal trap, punk-inflected aggression, and emotionally raw storytelling. His fearless genre-hopping and technical precision have cemented him as one of hip-hop's most vital voices.",
        "activity_score": 8.4,
        "discussion_count": 289,
        "latest_thread_title": "Ranking Denzel's discography from best to worst",
        "latest_thread_timestamp": "5 hours ago",
        "genres": ["Hip Hop"],
    },
    {
        "name": "Sudan Archives",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/92/55/b3/9255b3af-d9a9-a488-c5be-088d81067206/710.jpg/600x600bb.jpg",
        "bio": "Cincinnati-born violinist, singer, and producer Brittney Parks blends West African fiddle traditions with R&B, electronic production, and experimental pop. Her debut Natural Brown Prom Queen was one of the most acclaimed albums of 2022.",
        "activity_score": 8.4,
        "discussion_count": 276,
        "latest_thread_title": "Natural Brown Prom Queen — one year later",
        "latest_thread_timestamp": "9 hours ago",
        "genres": ["R&B", "Experimental"],
    },
    {
        "name": "Blood Orange",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/15/b5/61/15b56142-10d6-f9d3-f29d-e0e0d123061d/196873161457.jpg/600x600bb.jpg",
        "bio": "London-born, New York-based multi-instrumentalist Dev Hynes creates intimate, melancholic R&B that blurs the lines between indie, soul, and post-punk. A prolific collaborator and in-demand songwriter, his solo work is quietly visionary.",
        "activity_score": 8.3,
        "discussion_count": 243,
        "latest_thread_title": "Dev Hynes and his collaborators — appreciation thread",
        "latest_thread_timestamp": "6 hours ago",
        "genres": ["R&B", "Indie"],
    },
    {
        "name": "Soccer Mommy",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/af/3f/34/af3f34a5-2b65-ccfd-2502-088437003470/24CRGIM42963.rgb.jpg/600x600bb.jpg",
        "bio": "Nashville-based singer-songwriter Sophie Allison makes hook-filled indie rock that balances catchy pop immediacy with confessional depth. Her meticulous lo-fi-inflected production and diary-entry lyrics have resonated widely across the indie landscape.",
        "activity_score": 8.3,
        "discussion_count": 267,
        "latest_thread_title": "color theory production breakdown",
        "latest_thread_timestamp": "11 hours ago",
        "genres": ["Indie"],
    },
    {
        "name": "JPEGmafia",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/e6/8b/b1/e68bb111-9daa-9191-2212-ee38147b9488/artwork.jpg/600x600bb.jpg",
        "bio": "Baltimore-born experimental rapper and producer whose abrasive, sample-heavy productions challenge every convention of hip-hop. His confrontational aesthetic and razor-sharp cultural commentary have earned a devoted cult following worldwide.",
        "activity_score": 8.2,
        "discussion_count": 234,
        "latest_thread_title": "The JPEG production style — how does he do it?",
        "latest_thread_timestamp": "3 hours ago",
        "genres": ["Hip Hop", "Experimental"],
    },
    {
        "name": "James Blake",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/c4/6b/7c/c46b7cd6-8514-2098-7efa-83790c3d4879/00602527614854.rgb.jpg/600x600bb.jpg",
        "bio": "London electronic producer and singer-songwriter who revolutionized post-dubstep with his minimalist, soul-drenched vocal productions. His albums are emotionally raw explorations of loneliness and love, wrapped in immaculate sound design.",
        "activity_score": 8.2,
        "discussion_count": 221,
        "latest_thread_title": "Playing Robots Into Heaven — appreciation thread",
        "latest_thread_timestamp": "7 hours ago",
        "genres": ["Electronic", "R&B"],
    },
    {
        "name": "Four Tet",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/07/bc/32/07bc3225-318b-a1da-6912-7d259f7b7b1c/3663729313355_cover.jpg/600x600bb.jpg",
        "bio": "London producer Kieran Hebden whose career-spanning body of work has made him one of electronic music's most beloved figures. His sound blends intricate live instrumentation with club-facing rhythms across decades of remarkable output.",
        "activity_score": 8.1,
        "discussion_count": 198,
        "latest_thread_title": "Three — is this Four Tet's best work?",
        "latest_thread_timestamp": "5 hours ago",
        "genres": ["Electronic"],
    },
    {
        "name": "Wet Leg",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f7/fa/b3/f7fab37d-2e80-d27a-3718-bad739200376/887829125684.png/600x600bb.jpg",
        "bio": "Isle of Wight duo Rhian Teasdale and Hester Chambers whose sardonic post-punk debut became an unexpected global sensation in 2022. Their witty, deadpan observations about modern life are delivered with irresistible hook-laden guitar pop.",
        "activity_score": 8.0,
        "discussion_count": 187,
        "latest_thread_title": "Wet Leg debut — a year later, still holds up?",
        "latest_thread_timestamp": "8 hours ago",
        "genres": ["Indie", "Alternative"],
    },
    {
        "name": "Faye Webster",
        "image_url": "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/10/e1/3f/10e13f32-7d89-4092-ec35-fc6f6e19a291/656605041261.jpg/600x600bb.jpg",
        "bio": "Atlanta-based singer-songwriter who makes gently melancholic indie pop inflected with soft rock, bossa nova, and country. Her intimate, unhurried records have built a devoted following for their warmth, humor, and consistent charm.",
        "activity_score": 7.9,
        "discussion_count": 165,
        "latest_thread_title": "Underdressed at the Symphony — new direction for Faye?",
        "latest_thread_timestamp": "12 hours ago",
        "genres": ["Indie", "Pop"],
    },
]


def seed():
    if Artist.query.count() == 0:
        for data in ARTISTS_DATA:
            artist = Artist(
                name=data["name"],
                image_url=data["image_url"],
                bio=data["bio"],
                activity_score=data["activity_score"],
                discussion_count=data["discussion_count"],
                latest_thread_title=data["latest_thread_title"],
                latest_thread_timestamp=data["latest_thread_timestamp"],
            )
            db.session.add(artist)
            for genre_name in data["genres"]:
                genre = Genre.query.filter_by(name=genre_name).first()
                if not genre:
                    genre = Genre(name=genre_name)
                    db.session.add(genre)
                    db.session.flush()
                artist.genres.append(genre)

        db.session.commit()
        print(f"Seeded {len(ARTISTS_DATA)} artists.")
    else:
        print("Artists already seeded, skipping.")

    _seed_bots_and_discussions()
    _seed_albums()
    _seed_lists()


PERSONAS_DATA = [
    {
        "name": "Enthusiastic Fan",
        "engagement_style": "an enthusiastic fan who loves discovering new music and expresses genuine excitement about artists",
        "handle": "@bot_enthusiast",
        "display_name": "MusicEnthusiast",
        "bot_label": "Synthetic Fan",
    },
    {
        "name": "Genre Historian",
        "engagement_style": "a knowledgeable music historian who connects current artists to genre roots and historical context",
        "handle": "@bot_historian",
        "display_name": "GenreHistorian",
        "bot_label": "Synthetic Fan",
    },
    {
        "name": "Critical Listener",
        "engagement_style": "a thoughtful critic who provides balanced, nuanced observations about music craft and artistry",
        "handle": "@bot_critic",
        "display_name": "CriticalEar",
        "bot_label": "Synthetic Fan",
    },
    {
        "name": "New Listener",
        "engagement_style": "a newcomer to the genre who asks genuine questions and shares fresh first impressions",
        "handle": "@bot_newbie",
        "display_name": "NewListener",
        "bot_label": "Synthetic Fan",
    },
]

SEED_DISCUSSIONS = [
    "First impressions — what drew you to this artist?",
    "Favorite tracks and why they resonate with you",
    "How does this artist compare to others in the genre?",
    "The production quality on recent releases",
    "Live performance vs studio recordings discussion",
    "Hidden gems in the discography",
    "Genre-blending elements and influences",
    "What makes this artist stand out in today's music scene?",
]

SEED_OPENING_POSTS = [
    "Just discovered this artist and I can't stop listening. The way they blend different styles is really refreshing.",
    "Been following this artist for a while now. Their evolution has been fascinating to watch.",
    "The production on the latest release is top-notch. You can really hear the attention to detail.",
    "As someone who's been in the music scene for years, this artist represents something genuinely new.",
    "First time hearing this — really impressed by the unique approach to songwriting.",
    "The live energy translates so well into the recorded work. You can feel the authenticity.",
    "Been studying the genre for years and this artist brings something fresh while honoring the tradition.",
    "The community around this artist is what makes it special. Great discussions here.",
]


def _seed_bots_and_discussions():
    if User.query.filter_by(is_bot=True).count() > 0:
        print("Bot users already seeded, skipping.")
        return

    personas = []
    for i, p_data in enumerate(PERSONAS_DATA):
        bot_user = User(
            display_name=p_data["display_name"],
            handle=p_data["handle"],
            is_bot=True,
            bot_label=p_data["bot_label"],
        )
        db.session.add(bot_user)
        db.session.flush()

        persona = LLMPersona(
            name=p_data["name"],
            engagement_style=p_data["engagement_style"],
            user_id=bot_user.id,
        )
        db.session.add(persona)
        personas.append((bot_user, persona))

    db.session.flush()

    artists = Artist.query.all()
    first_bot_user = personas[0][0]

    for i, artist in enumerate(artists):
        for j in range(2):
            disc_title = SEED_DISCUSSIONS[(i * 2 + j) % len(SEED_DISCUSSIONS)]
            discussion = Discussion(
                artist_id=artist.id,
                author_user_id=first_bot_user.id,
                title=disc_title,
                post_count=1,
                last_activity_at=datetime.now(timezone.utc),
            )
            db.session.add(discussion)
            db.session.flush()

            opener_bot = personas[(i + j) % len(personas)][0]
            opening_post = Post(
                discussion_id=discussion.id,
                author_user_id=opener_bot.id,
                body=SEED_OPENING_POSTS[(i * 2 + j) % len(SEED_OPENING_POSTS)],
            )
            db.session.add(opening_post)

    db.session.commit()
    print(f"Seeded {len(PERSONAS_DATA)} bot personas and discussions for {len(artists)} artists.")


# cover_url is None where iTunes couldn't find the album or returned a duplicate.
# The frontend renders a neutral placeholder when cover_url is null.
ALBUMS_DATA = [
    # ── Kendrick Lamar ────────────────────────────────────────────────────────
    {
        "title": "GNX",
        "artist_name": "Kendrick Lamar",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/54/28/14/54281424-eece-0935-299d-fdd2ab403f92/24UM1IM28978.rgb.jpg/600x600bb.jpg",
        "release_date": date(2024, 11, 22),
        "user_score": 8.9, "critic_score": 8.7,
        "review_count": 3241, "discussion_count": 412, "list_appearances": 47,
        "album_type": "studio", "genres": ["Hip Hop"],
    },
    {
        "title": "Mr. Morale & The Big Steppers",
        "artist_name": "Kendrick Lamar",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/6b/17/e6/6b17e679-70e0-e00e-93e1-5af4d25ee8c8/22UMGIM52376.rgb.jpg/600x600bb.jpg",
        "release_date": date(2022, 5, 13),
        "user_score": 8.5, "critic_score": 8.1,
        "review_count": 4872, "discussion_count": 623, "list_appearances": 89,
        "album_type": "studio", "genres": ["Hip Hop"],
    },
    {
        "title": "DAMN.",
        "artist_name": "Kendrick Lamar",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/ab/16/ef/ab16efe9-e7f1-66ec-021c-5592a23f0f9e/17UMGIM88793.rgb.jpg/600x600bb.jpg",
        "release_date": date(2017, 4, 14),
        "user_score": 9.1, "critic_score": 9.5,
        "review_count": 9134, "discussion_count": 1842, "list_appearances": 214,
        "album_type": "studio", "genres": ["Hip Hop"],
    },
    {
        "title": "To Pimp a Butterfly",
        "artist_name": "Kendrick Lamar",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/b5/a6/91/b5a69171-5232-3d5b-9c15-8963802f83dd/15UMGIM15814.rgb.jpg/600x600bb.jpg",
        "release_date": date(2015, 3, 15),
        "user_score": 9.5, "critic_score": 9.6,
        "review_count": 11203, "discussion_count": 2341, "list_appearances": 389,
        "album_type": "studio", "genres": ["Hip Hop"],
    },
    # ── Tyler, the Creator ────────────────────────────────────────────────────
    {
        "title": "CHROMAKOPIA",
        "artist_name": "Tyler, the Creator",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/b6/ef/ee/b6efeefa-fc99-37d1-ad21-0d769b2a4958/196872796971.jpg/600x600bb.jpg",
        "release_date": date(2024, 10, 28),
        "user_score": 8.7, "critic_score": 8.6,
        "review_count": 2987, "discussion_count": 387, "list_appearances": 43,
        "album_type": "studio", "genres": ["Hip Hop"],
    },
    {
        "title": "CALL ME IF YOU GET LOST",
        "artist_name": "Tyler, the Creator",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e0/57/a9/e057a9f5-942d-5b54-51b4-242d298fa2fe/cover.jpg/600x600bb.jpg",
        "release_date": date(2021, 6, 25),
        "user_score": 8.8, "critic_score": 8.6,
        "review_count": 4123, "discussion_count": 512, "list_appearances": 76,
        "album_type": "studio", "genres": ["Hip Hop"],
    },
    {
        "title": "IGOR",
        "artist_name": "Tyler, the Creator",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/22/fd/10/22fd10a3-881d-2560-64e7-a9df650b9e47/17UM1IM42651.rgb.jpg/600x600bb.jpg",
        "release_date": date(2019, 5, 17),
        "user_score": 9.0, "critic_score": 8.3,
        "review_count": 5632, "discussion_count": 743, "list_appearances": 132,
        "album_type": "studio", "genres": ["Hip Hop"],
    },
    {
        "title": "Flower Boy",
        "artist_name": "Tyler, the Creator",
        "cover_url": None,  # iTunes returned IGOR cover — omitted to avoid mismatch
        "release_date": date(2017, 7, 21),
        "user_score": 8.9, "critic_score": 8.4,
        "review_count": 6841, "discussion_count": 876, "list_appearances": 167,
        "album_type": "studio", "genres": ["Hip Hop"],
    },
    # ── Frank Ocean ───────────────────────────────────────────────────────────
    {
        "title": "Blonde",
        "artist_name": "Frank Ocean",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a2/5b/fb/a25bfb51-6377-a2c4-debf-9f1bcfee1151/00602527815084.rgb.jpg/600x600bb.jpg",
        "release_date": date(2016, 8, 20),
        "user_score": 9.3, "critic_score": 8.8,
        "review_count": 8934, "discussion_count": 1203, "list_appearances": 287,
        "album_type": "studio", "genres": ["R&B", "Hip Hop"],
    },
    {
        "title": "channel ORANGE",
        "artist_name": "Frank Ocean",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/35/e3/83/35e383f9-324f-2ce6-09ae-82f98dd3e33c/FOprovider2-1.jpg/600x600bb.jpg",
        "release_date": date(2012, 7, 10),
        "user_score": 9.2, "critic_score": 9.2,
        "review_count": 7621, "discussion_count": 987, "list_appearances": 243,
        "album_type": "studio", "genres": ["R&B", "Hip Hop"],
    },
    # ── SZA ───────────────────────────────────────────────────────────────────
    {
        "title": "SOS",
        "artist_name": "SZA",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/62/93/13/6293132e-20ff-67ab-3d1f-96bb6797a6ba/196589564955.jpg/600x600bb.jpg",
        "release_date": date(2022, 12, 9),
        "user_score": 8.8, "critic_score": 8.2,
        "review_count": 5412, "discussion_count": 712, "list_appearances": 98,
        "album_type": "studio", "genres": ["R&B"],
    },
    {
        "title": "CTRL",
        "artist_name": "SZA",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/a2/bc/ad/a2bcad46-b389-4be1-8bac-5a0959b0b8e4/886446548449.jpg/600x600bb.jpg",
        "release_date": date(2017, 6, 9),
        "user_score": 9.0, "critic_score": 8.1,
        "review_count": 7234, "discussion_count": 987, "list_appearances": 178,
        "album_type": "studio", "genres": ["R&B"],
    },
    # ── boygenius ─────────────────────────────────────────────────────────────
    {
        "title": "the record",
        "artist_name": "boygenius",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/95/7b/7c/957b7c50-eac5-4a78-2070-5f30ef4c15c4/dj.auehhwxs.jpg/600x600bb.jpg",
        "release_date": date(2023, 3, 31),
        "user_score": 8.9, "critic_score": 8.7,
        "review_count": 3876, "discussion_count": 503, "list_appearances": 87,
        "album_type": "studio", "genres": ["Indie", "Folk"],
    },
    # ── Mitski ────────────────────────────────────────────────────────────────
    {
        "title": "The Land Is Inhospitable and So Are We",
        "artist_name": "Mitski",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/8f/4b/40/8f4b4044-d02b-dc25-7d01-7d9d225fdce4/40240.jpg/600x600bb.jpg",
        "release_date": date(2023, 9, 15),
        "user_score": 8.8, "critic_score": 8.9,
        "review_count": 2341, "discussion_count": 312, "list_appearances": 54,
        "album_type": "studio", "genres": ["Indie", "Alternative"],
    },
    {
        "title": "Laurel Hell",
        "artist_name": "Mitski",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/fe/01/99/fe019995-88e4-9e5c-9621-d28953dc9aa5/27273.jpg/600x600bb.jpg",
        "release_date": date(2022, 2, 4),
        "user_score": 8.4, "critic_score": 8.3,
        "review_count": 3102, "discussion_count": 398, "list_appearances": 67,
        "album_type": "studio", "genres": ["Indie", "Alternative"],
    },
    {
        "title": "Be the Cowboy",
        "artist_name": "Mitski",
        "cover_url": None,
        "release_date": date(2018, 8, 17),
        "user_score": 9.0, "critic_score": 8.6,
        "review_count": 4521, "discussion_count": 612, "list_appearances": 121,
        "album_type": "studio", "genres": ["Indie", "Alternative"],
    },
    {
        "title": "Puberty 2",
        "artist_name": "Mitski",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/7a/ee/82/7aee8209-a778-109f-0a98-bb415bc8e95d/656605142364.jpg/600x600bb.jpg",
        "release_date": date(2016, 6, 17),
        "user_score": 8.8, "critic_score": 8.6,
        "review_count": 3987, "discussion_count": 534, "list_appearances": 98,
        "album_type": "studio", "genres": ["Indie", "Alternative"],
    },
    # ── Caroline Polachek ─────────────────────────────────────────────────────
    {
        "title": "Desire, I Want to Turn Into You",
        "artist_name": "Caroline Polachek",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/10/51/f2/1051f2cc-195f-ddb6-2d9e-26c74f0387fd/197187988518.jpg/600x600bb.jpg",
        "release_date": date(2023, 2, 14),
        "user_score": 9.0, "critic_score": 8.8,
        "review_count": 3234, "discussion_count": 421, "list_appearances": 76,
        "album_type": "studio", "genres": ["Pop", "Electronic"],
    },
    {
        "title": "Pang",
        "artist_name": "Caroline Polachek",
        "cover_url": None,  # iTunes returned Desire cover — omitted
        "release_date": date(2019, 10, 25),
        "user_score": 8.8, "critic_score": 8.4,
        "review_count": 2187, "discussion_count": 287, "list_appearances": 43,
        "album_type": "studio", "genres": ["Pop", "Electronic"],
    },
    # ── Phoebe Bridgers ───────────────────────────────────────────────────────
    {
        "title": "Punisher",
        "artist_name": "Phoebe Bridgers",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/5a/5d/1f/5a5d1fde-7f6f-9997-3bca-d75f1e799464/656605154565.jpg/600x600bb.jpg",
        "release_date": date(2020, 6, 19),
        "user_score": 9.0, "critic_score": 8.9,
        "review_count": 4312, "discussion_count": 567, "list_appearances": 134,
        "album_type": "studio", "genres": ["Indie", "Folk"],
    },
    {
        "title": "Stranger in the Alps",
        "artist_name": "Phoebe Bridgers",
        "cover_url": None,
        "release_date": date(2017, 9, 22),
        "user_score": 8.7, "critic_score": 8.3,
        "review_count": 2134, "discussion_count": 287, "list_appearances": 45,
        "album_type": "studio", "genres": ["Indie", "Folk"],
    },
    # ── Big Thief ─────────────────────────────────────────────────────────────
    {
        "title": "Dragon New Warm Mountain I Believe in You",
        "artist_name": "Big Thief",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/14/c8/ea/14c8ea65-2155-8d44-f0c5-6faa8f51f95d/191400040878.png/600x600bb.jpg",
        "release_date": date(2022, 2, 11),
        "user_score": 8.8, "critic_score": 9.0,
        "review_count": 2876, "discussion_count": 376, "list_appearances": 67,
        "album_type": "studio", "genres": ["Indie", "Folk"],
    },
    {
        "title": "Two Hands",
        "artist_name": "Big Thief",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/44/1e/68/441e686c-9276-b50c-ad68-f7d3e2d53b38/cover.jpg/600x600bb.jpg",
        "release_date": date(2019, 10, 11),
        "user_score": 8.9, "critic_score": 8.8,
        "review_count": 2341, "discussion_count": 312, "list_appearances": 54,
        "album_type": "studio", "genres": ["Indie", "Folk"],
    },
    {
        "title": "U.F.O.F.",
        "artist_name": "Big Thief",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c2/71/2b/c2712ba8-9fb4-da63-6b2a-f1f25275e9e6/Big_Thief_UFOF.jpg/600x600bb.jpg",
        "release_date": date(2019, 5, 3),
        "user_score": 8.7, "critic_score": 8.8,
        "review_count": 1987, "discussion_count": 267, "list_appearances": 43,
        "album_type": "studio", "genres": ["Indie", "Folk"],
    },
    # ── Japanese Breakfast ────────────────────────────────────────────────────
    {
        "title": "For Melancholy Brunettes (& Sad Women)",
        "artist_name": "Japanese Breakfast",
        "cover_url": None,
        "release_date": date(2025, 3, 28),
        "user_score": 8.5, "critic_score": 8.6,
        "review_count": 1243, "discussion_count": 178, "list_appearances": 23,
        "album_type": "studio", "genres": ["Indie", "Pop"],
    },
    {
        "title": "Jubilee",
        "artist_name": "Japanese Breakfast",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/93/8b/8b/938b8b5d-1022-414f-995e-a25608fc68c3/17251.jpg/600x600bb.jpg",
        "release_date": date(2021, 6, 4),
        "user_score": 9.0, "critic_score": 8.9,
        "review_count": 3421, "discussion_count": 445, "list_appearances": 89,
        "album_type": "studio", "genres": ["Indie", "Pop"],
    },
    {
        "title": "Soft Sounds from Another Planet",
        "artist_name": "Japanese Breakfast",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/20/47/60/20476017-7ede-d198-3ddb-1c7ae8b48105/656605143361.jpg/600x600bb.jpg",
        "release_date": date(2017, 7, 14),
        "user_score": 8.5, "critic_score": 8.2,
        "review_count": 1876, "discussion_count": 243, "list_appearances": 34,
        "album_type": "studio", "genres": ["Indie", "Pop"],
    },
    # ── Floating Points ───────────────────────────────────────────────────────
    {
        "title": "Promises",
        "artist_name": "Floating Points",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/af/dc/6b/afdc6b88-b275-de4e-3098-63dff171dffb/680899009720.jpg/600x600bb.jpg",
        "release_date": date(2021, 3, 27),
        "user_score": 9.1, "critic_score": 9.0,
        "review_count": 2134, "discussion_count": 287, "list_appearances": 67,
        "album_type": "studio", "genres": ["Electronic", "Jazz"],
    },
    {
        "title": "Crush",
        "artist_name": "Floating Points",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/a6/17/99/a61799d7-ac93-031d-e58c-44d4674576cb/5054429138481.png/600x600bb.jpg",
        "release_date": date(2019, 10, 18),
        "user_score": 8.5, "critic_score": 8.3,
        "review_count": 1234, "discussion_count": 167, "list_appearances": 28,
        "album_type": "studio", "genres": ["Electronic"],
    },
    {
        "title": "Elaenia",
        "artist_name": "Floating Points",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/9a/94/32/9a9432f2-748a-4ce4-a3ed-a0a568d6994c/889845575757.jpg/600x600bb.jpg",
        "release_date": date(2015, 1, 26),
        "user_score": 8.7, "critic_score": 8.5,
        "review_count": 1543, "discussion_count": 198, "list_appearances": 45,
        "album_type": "studio", "genres": ["Electronic", "Jazz"],
    },
    # ── Bon Iver ──────────────────────────────────────────────────────────────
    {
        "title": "SABLE, fABLE",
        "artist_name": "Bon Iver",
        "cover_url": None,
        "release_date": date(2025, 4, 4),
        "user_score": 8.3, "critic_score": 8.0,
        "review_count": 876, "discussion_count": 123, "list_appearances": 12,
        "album_type": "studio", "genres": ["Indie", "Folk", "Electronic"],
    },
    {
        "title": "i,i",
        "artist_name": "Bon Iver",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/de/f0/bf/def0bfe3-6b57-34fa-3a40-bb67aa6284b2/656605235066.jpg/600x600bb.jpg",
        "release_date": date(2019, 8, 30),
        "user_score": 8.5, "critic_score": 8.3,
        "review_count": 2341, "discussion_count": 312, "list_appearances": 54,
        "album_type": "studio", "genres": ["Indie", "Folk", "Electronic"],
    },
    {
        "title": "22, A Million",
        "artist_name": "Bon Iver",
        "cover_url": None,  # iTunes returned i,i cover — omitted
        "release_date": date(2016, 9, 30),
        "user_score": 8.9, "critic_score": 8.7,
        "review_count": 3876, "discussion_count": 512, "list_appearances": 98,
        "album_type": "studio", "genres": ["Indie", "Folk", "Electronic"],
    },
    {
        "title": "Bon Iver, Bon Iver",
        "artist_name": "Bon Iver",
        "cover_url": None,  # iTunes returned i,i cover — omitted
        "release_date": date(2011, 6, 21),
        "user_score": 9.1, "critic_score": 9.0,
        "review_count": 5432, "discussion_count": 712, "list_appearances": 167,
        "album_type": "studio", "genres": ["Indie", "Folk"],
    },
    # ── Sufjan Stevens ────────────────────────────────────────────────────────
    {
        "title": "Javelin",
        "artist_name": "Sufjan Stevens",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/de/4b/c4/de4bc421-6827-29b0-c58f-86cffd3c5c18/823675368035_Cover.jpg/600x600bb.jpg",
        "release_date": date(2023, 10, 6),
        "user_score": 8.7, "critic_score": 9.0,
        "review_count": 1987, "discussion_count": 267, "list_appearances": 45,
        "album_type": "studio", "genres": ["Folk", "Indie"],
    },
    {
        "title": "The Ascension",
        "artist_name": "Sufjan Stevens",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/02/51/19/0251193c-7a00-253f-07df-ce14378a6886/729920164301.jpg/600x600bb.jpg",
        "release_date": date(2020, 9, 25),
        "user_score": 8.2, "critic_score": 8.1,
        "review_count": 1543, "discussion_count": 198, "list_appearances": 28,
        "album_type": "studio", "genres": ["Folk", "Electronic"],
    },
    {
        "title": "Carrie & Lowell",
        "artist_name": "Sufjan Stevens",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music91/v4/6b/20/6a/6b206ac1-e1b5-316d-334d-59df7b727fb6/656605613666.jpg/600x600bb.jpg",
        "release_date": date(2015, 3, 31),
        "user_score": 9.2, "critic_score": 9.0,
        "review_count": 5234, "discussion_count": 689, "list_appearances": 178,
        "album_type": "studio", "genres": ["Folk", "Indie"],
    },
    # ── Thundercat ────────────────────────────────────────────────────────────
    {
        "title": "It Is What It Is",
        "artist_name": "Thundercat",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fb/4d/0a/fb4d0a19-7f0d-d746-8976-72e7553b1991/25UM2IM03674.rgb.jpg/600x600bb.jpg",
        "release_date": date(2020, 4, 3),
        "user_score": 8.6, "critic_score": 8.6,
        "review_count": 2134, "discussion_count": 287, "list_appearances": 45,
        "album_type": "studio", "genres": ["R&B", "Jazz", "Electronic"],
    },
    {
        "title": "Drunk",
        "artist_name": "Thundercat",
        "cover_url": None,
        "release_date": date(2017, 2, 24),
        "user_score": 8.8, "critic_score": 8.7,
        "review_count": 2876, "discussion_count": 376, "list_appearances": 78,
        "album_type": "studio", "genres": ["R&B", "Jazz", "Electronic"],
    },
    {
        "title": "Apocalypse",
        "artist_name": "Thundercat",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/cf/cf/68/cfcf689a-da99-8989-de82-64f805a217b9/781484045021.png/600x600bb.jpg",
        "release_date": date(2013, 7, 9),
        "user_score": 8.4, "critic_score": 8.2,
        "review_count": 1543, "discussion_count": 198, "list_appearances": 34,
        "album_type": "studio", "genres": ["R&B", "Jazz"],
    },
    # ── Snail Mail ────────────────────────────────────────────────────────────
    {
        "title": "Valentine",
        "artist_name": "Snail Mail",
        "cover_url": None,
        "release_date": date(2021, 11, 5),
        "user_score": 8.5, "critic_score": 8.3,
        "review_count": 1876, "discussion_count": 243, "list_appearances": 38,
        "album_type": "studio", "genres": ["Indie"],
    },
    {
        "title": "Lush",
        "artist_name": "Snail Mail",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e3/f0/b8/e3f0b8b0-88c4-58df-a148-d4714d4fe7dc/744861117957.png/600x600bb.jpg",
        "release_date": date(2018, 6, 8),
        "user_score": 8.6, "critic_score": 8.5,
        "review_count": 2134, "discussion_count": 287, "list_appearances": 45,
        "album_type": "studio", "genres": ["Indie"],
    },
    # ── Denzel Curry ──────────────────────────────────────────────────────────
    {
        "title": "King of the Mischievous South Vol. 2",
        "artist_name": "Denzel Curry",
        "cover_url": None,
        "release_date": date(2023, 8, 25),
        "user_score": 7.8, "critic_score": 7.5,
        "review_count": 876, "discussion_count": 112, "list_appearances": 12,
        "album_type": "studio", "genres": ["Hip Hop"],
    },
    {
        "title": "Melt My Eyez See Your Future",
        "artist_name": "Denzel Curry",
        "cover_url": None,
        "release_date": date(2022, 3, 25),
        "user_score": 8.4, "critic_score": 8.3,
        "review_count": 1876, "discussion_count": 243, "list_appearances": 38,
        "album_type": "studio", "genres": ["Hip Hop"],
    },
    {
        "title": "TA1300",
        "artist_name": "Denzel Curry",
        "cover_url": None,
        "release_date": date(2018, 7, 27),
        "user_score": 8.6, "critic_score": 8.4,
        "review_count": 2341, "discussion_count": 312, "list_appearances": 56,
        "album_type": "studio", "genres": ["Hip Hop"],
    },
    # ── Sudan Archives ────────────────────────────────────────────────────────
    {
        "title": "Natural Brown Prom Queen",
        "artist_name": "Sudan Archives",
        "cover_url": None,
        "release_date": date(2022, 8, 26),
        "user_score": 8.4, "critic_score": 8.7,
        "review_count": 1234, "discussion_count": 167, "list_appearances": 34,
        "album_type": "studio", "genres": ["R&B", "Experimental"],
    },
    {
        "title": "Athena",
        "artist_name": "Sudan Archives",
        "cover_url": None,
        "release_date": date(2019, 10, 11),
        "user_score": 8.1, "critic_score": 7.9,
        "review_count": 743, "discussion_count": 98, "list_appearances": 15,
        "album_type": "studio", "genres": ["R&B", "Experimental"],
    },
    # ── Blood Orange ──────────────────────────────────────────────────────────
    {
        "title": "Negro Swan",
        "artist_name": "Blood Orange",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/07/fb/12/07fb1268-f4ea-3d84-a2c2-823f18010bdb/25UM2IM07517.rgb.jpg/600x600bb.jpg",
        "release_date": date(2018, 8, 24),
        "user_score": 8.5, "critic_score": 8.3,
        "review_count": 1543, "discussion_count": 198, "list_appearances": 34,
        "album_type": "studio", "genres": ["R&B", "Indie"],
    },
    {
        "title": "Freetown Sound",
        "artist_name": "Blood Orange",
        "cover_url": None,
        "release_date": date(2016, 6, 28),
        "user_score": 8.7, "critic_score": 8.5,
        "review_count": 1876, "discussion_count": 243, "list_appearances": 45,
        "album_type": "studio", "genres": ["R&B", "Indie"],
    },
    {
        "title": "Cupid Deluxe",
        "artist_name": "Blood Orange",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/52/ac/30/52ac30de-191a-7f46-b6cd-051f5be848ad/BloodOrangeCVRupdated.jpg/600x600bb.jpg",
        "release_date": date(2013, 11, 26),
        "user_score": 8.3, "critic_score": 8.1,
        "review_count": 1234, "discussion_count": 167, "list_appearances": 28,
        "album_type": "studio", "genres": ["R&B", "Indie"],
    },
    # ── Soccer Mommy ──────────────────────────────────────────────────────────
    {
        "title": "Everywhen",
        "artist_name": "Soccer Mommy",
        "cover_url": None,
        "release_date": date(2024, 3, 8),
        "user_score": 8.2, "critic_score": 8.0,
        "review_count": 876, "discussion_count": 112, "list_appearances": 12,
        "album_type": "studio", "genres": ["Indie"],
    },
    {
        "title": "Sometimes, Forever",
        "artist_name": "Soccer Mommy",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/72/d8/a3/72d8a3cf-634e-7edc-be9f-70df7383fe9c/21CRGIM30802.rgb.jpg/600x600bb.jpg",
        "release_date": date(2022, 6, 24),
        "user_score": 8.3, "critic_score": 8.4,
        "review_count": 1543, "discussion_count": 198, "list_appearances": 34,
        "album_type": "studio", "genres": ["Indie"],
    },
    {
        "title": "color theory",
        "artist_name": "Soccer Mommy",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/6e/07/04/6e070408-ddf1-2aa7-b005-cd66b0ba86e5/121167.jpg/600x600bb.jpg",
        "release_date": date(2020, 2, 28),
        "user_score": 8.7, "critic_score": 8.5,
        "review_count": 2134, "discussion_count": 287, "list_appearances": 45,
        "album_type": "studio", "genres": ["Indie"],
    },
    # ── JPEGmafia ─────────────────────────────────────────────────────────────
    {
        "title": "I Lay Down My Life for You",
        "artist_name": "JPEGmafia",
        "cover_url": None,
        "release_date": date(2024, 8, 23),
        "user_score": 8.2, "critic_score": 8.0,
        "review_count": 876, "discussion_count": 112, "list_appearances": 12,
        "album_type": "studio", "genres": ["Hip Hop", "Experimental"],
    },
    {
        "title": "LP!",
        "artist_name": "JPEGmafia",
        "cover_url": None,
        "release_date": date(2021, 10, 22),
        "user_score": 8.5, "critic_score": 7.8,
        "review_count": 1543, "discussion_count": 198, "list_appearances": 28,
        "album_type": "studio", "genres": ["Hip Hop", "Experimental"],
    },
    {
        "title": "All My Heroes Are Cornballs",
        "artist_name": "JPEGmafia",
        "cover_url": None,
        "release_date": date(2019, 9, 13),
        "user_score": 8.7, "critic_score": 8.0,
        "review_count": 1876, "discussion_count": 243, "list_appearances": 38,
        "album_type": "studio", "genres": ["Hip Hop", "Experimental"],
    },
    # ── James Blake ───────────────────────────────────────────────────────────
    {
        "title": "Playing Robots Into Heaven",
        "artist_name": "James Blake",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/ac/df/31/acdf31ba-ed8c-36c8-55fa-4fea81cf8395/23UMGIM73095.rgb.jpg/600x600bb.jpg",
        "release_date": date(2023, 9, 8),
        "user_score": 8.3, "critic_score": 8.2,
        "review_count": 1234, "discussion_count": 167, "list_appearances": 23,
        "album_type": "studio", "genres": ["Electronic", "R&B"],
    },
    {
        "title": "Friends That Break Your Heart",
        "artist_name": "James Blake",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/14/e9/20/14e9209b-2c90-507d-a06c-942d01b51692/21UMGIM64692.rgb.jpg/600x600bb.jpg",
        "release_date": date(2021, 10, 8),
        "user_score": 8.0, "critic_score": 7.9,
        "review_count": 1234, "discussion_count": 167, "list_appearances": 19,
        "album_type": "studio", "genres": ["Electronic", "R&B"],
    },
    {
        "title": "Assume Form",
        "artist_name": "James Blake",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/be/00/41/be00414f-e15d-a689-fe2b-89b156cc66e0/00602577391231.rgb.jpg/600x600bb.jpg",
        "release_date": date(2019, 1, 18),
        "user_score": 8.2, "critic_score": 8.0,
        "review_count": 1543, "discussion_count": 198, "list_appearances": 28,
        "album_type": "studio", "genres": ["Electronic", "R&B"],
    },
    # ── Four Tet ──────────────────────────────────────────────────────────────
    {
        "title": "Three",
        "artist_name": "Four Tet",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/09/5b/ad/095badfd-24fa-ac4f-6147-741d7ae666f6/3663729296894_cover.jpg/600x600bb.jpg",
        "release_date": date(2024, 3, 22),
        "user_score": 8.5, "critic_score": 8.3,
        "review_count": 1234, "discussion_count": 167, "list_appearances": 23,
        "album_type": "studio", "genres": ["Electronic"],
    },
    {
        "title": "Sixteen Oceans",
        "artist_name": "Four Tet",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/34/b0/7f/34b07f62-22a4-9906-e62c-17b77fb5f1ff/3663729105363_cover.jpg/600x600bb.jpg",
        "release_date": date(2020, 3, 6),
        "user_score": 8.4, "critic_score": 8.2,
        "review_count": 1543, "discussion_count": 198, "list_appearances": 28,
        "album_type": "studio", "genres": ["Electronic"],
    },
    {
        "title": "New Energy",
        "artist_name": "Four Tet",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/aa/99/b5/aa99b504-2656-85c4-965a-3bc80e52d0f2/666017319728_cover.jpg/600x600bb.jpg",
        "release_date": date(2017, 9, 29),
        "user_score": 8.6, "critic_score": 8.4,
        "review_count": 1876, "discussion_count": 243, "list_appearances": 38,
        "album_type": "studio", "genres": ["Electronic"],
    },
    # ── Wet Leg ───────────────────────────────────────────────────────────────
    {
        "title": "Moisturizer",
        "artist_name": "Wet Leg",
        "cover_url": None,  # iTunes returns a Korean Trot album cover — no correct match found
        "release_date": date(2025, 3, 28),
        "user_score": 8.0, "critic_score": 7.8,
        "review_count": 743, "discussion_count": 98, "list_appearances": 10,
        "album_type": "studio", "genres": ["Indie", "Alternative"],
    },
    {
        "title": "Wet Leg",
        "artist_name": "Wet Leg",
        "cover_url": None,
        "release_date": date(2022, 4, 8),
        "user_score": 8.4, "critic_score": 8.5,
        "review_count": 2341, "discussion_count": 312, "list_appearances": 54,
        "album_type": "studio", "genres": ["Indie", "Alternative"],
    },
    # ── Faye Webster ──────────────────────────────────────────────────────────
    {
        "title": "Underdressed at the Symphony",
        "artist_name": "Faye Webster",
        "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/b2/bb/eb/b2bbeb7b-5b42-e50d-821f-1e966237944f/43220.jpg/600x600bb.jpg",
        "release_date": date(2023, 6, 30),
        "user_score": 8.5, "critic_score": 8.3,
        "review_count": 1543, "discussion_count": 198, "list_appearances": 28,
        "album_type": "studio", "genres": ["Indie", "Pop"],
    },
    {
        "title": "I Know I'm Funny haha",
        "artist_name": "Faye Webster",
        "cover_url": None,
        "release_date": date(2021, 6, 25),
        "user_score": 8.7, "critic_score": 8.5,
        "review_count": 1876, "discussion_count": 243, "list_appearances": 38,
        "album_type": "studio", "genres": ["Indie", "Pop"],
    },
    {
        "title": "Atlanta Millionaires Club",
        "artist_name": "Faye Webster",
        "cover_url": None,
        "release_date": date(2019, 3, 22),
        "user_score": 8.2, "critic_score": 7.9,
        "review_count": 1234, "discussion_count": 167, "list_appearances": 19,
        "album_type": "studio", "genres": ["Indie", "Pop"],
    },
]


def _seed_albums():
    if Album.query.count() > 0:
        print("Albums already seeded, skipping.")
        return

    for data in ALBUMS_DATA:
        artist = Artist.query.filter_by(name=data["artist_name"]).first()
        if not artist:
            print(f"  Warning: artist '{data['artist_name']}' not found, skipping album '{data['title']}'")
            continue

        album = Album(
            title=data["title"],
            artist_id=artist.id,
            cover_url=data["cover_url"],
            release_date=data["release_date"],
            release_year=data["release_date"].year,
            user_score=data["user_score"],
            critic_score=data["critic_score"],
            review_count=data["review_count"],
            discussion_count=data["discussion_count"],
            list_appearances=data["list_appearances"],
            album_type=data["album_type"],
        )
        db.session.add(album)
        db.session.flush()

        for genre_name in data["genres"]:
            genre = Genre.query.filter_by(name=genre_name).first()
            if not genre:
                genre = Genre(name=genre_name)
                db.session.add(genre)
                db.session.flush()
            album.genres.append(genre)

    db.session.commit()
    print(f"Seeded {len(ALBUMS_DATA)} albums.")


def _seed_lists():
    if List.query.count() > 0:
        print("Lists already seeded, skipping.")
        return

    creator_map = {
        "MusicEnthusiast": User.query.filter_by(display_name="MusicEnthusiast").first(),
        "GenreHistorian": User.query.filter_by(display_name="GenreHistorian").first(),
        "CriticalEar": User.query.filter_by(display_name="CriticalEar").first(),
    }

    lists_data = [
        {
            "title": "Essential Hip Hop Albums",
            "description": (
                "The records that define what hip-hop can achieve — from Compton to Baltimore, "
                "spanning political fury, introspective beauty, and genre-defying experimentation."
            ),
            "creator": creator_map["MusicEnthusiast"],
            "like_count": 312,
            "filter": {"genre": "Hip Hop", "limit": 6},
        },
        {
            "title": "Essential Electronic Records",
            "description": (
                "From post-dubstep to jazz-inflected club music, these albums define what "
                "electronic music can achieve. A journey through synthesizers, samples, and studio craft."
            ),
            "creator": creator_map["GenreHistorian"],
            "like_count": 187,
            "filter": {"genre": "Electronic", "limit": 8},
        },
        {
            "title": "Indie Folk Essentials",
            "description": (
                "Devastating, luminous, and quietly radical — these are the indie and folk records "
                "that have mattered most over the past decade."
            ),
            "creator": creator_map["CriticalEar"],
            "like_count": 143,
            "filter": {"genre": "Indie", "limit": 8},
        },
    ]

    for ldata in lists_data:
        lst = List(
            title=ldata["title"],
            description=ldata["description"],
            creator_user_id=ldata["creator"].id if ldata["creator"] else None,
            like_count=ldata["like_count"],
        )
        db.session.add(lst)
        db.session.flush()

        f = ldata["filter"]
        query = Album.query
        if f.get("genre"):
            query = query.filter(Album.genres.any(Genre.name == f["genre"]))
        if f.get("year"):
            query = query.filter(Album.release_year == f["year"])
        query = query.order_by(Album.user_score.desc())
        for album in query.limit(f.get("limit", 10)).all():
            la = ListAlbum(list_id=lst.id, album_id=album.id)
            db.session.add(la)

    db.session.commit()
    print("Seeded 3 lists.")
