# Project-Manager

## AI Chat Configuration

Add these values to your `.env` file to enable real AI chat responses:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
AI_TIMEOUT_MS=30000
AI_MAX_RETRIES=2
CHAT_RATE_LIMIT_REQUESTS=20
CHAT_RATE_LIMIT_WINDOW_MINUTES=1
```

For Gemini (OpenAI-compatible endpoint), use:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key
GEMINI_CHAT_MODEL=gemini-2.0-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_TIMEOUT_MS=30000
AI_MAX_RETRIES=2
CHAT_RATE_LIMIT_REQUESTS=20
CHAT_RATE_LIMIT_WINDOW_MINUTES=1
```

Run database migrations after pulling changes:

```bash
npm run db:migrate
```
