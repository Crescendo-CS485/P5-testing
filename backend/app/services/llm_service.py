import anthropic
from flask import current_app


class LLMServiceAPI:
    def generate_comment(
        self,
        artist_name: str,
        discussion_title: str,
        recent_posts: list[str],
        persona_style: str,
    ) -> str:
        api_key = current_app.config.get("ANTHROPIC_API_KEY", "")
        client = anthropic.Anthropic(api_key=api_key)

        context = ""
        if recent_posts:
            context = "\n\nRecent comments in the discussion:\n" + "\n".join(
                f"- {p}" for p in recent_posts
            )

        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            system=f"You are {persona_style}. Keep your response to 1-3 sentences.",
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Write a short comment for a music discussion about the artist "
                        f"'{artist_name}'. The discussion topic is: '{discussion_title}'.{context}"
                    ),
                }
            ],
        )
        return message.content[0].text
