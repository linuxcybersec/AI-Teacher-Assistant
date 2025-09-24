AI Teacher Assistant - Server

Setup

1. Create a `.env` file in `server/` with:

PORT=8080
GOOGLE_CLIENT_ID=718464818408-vcbdh0q971cq9k8ead2b4fsditq5s3ek.apps.googleusercontent.com
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

2. Install and run:

cd server
npm i
npm run dev

Endpoints

- POST /api/auth/verify { credential } → verifies Google ID token and returns { teacher }.
- POST /api/analyze { essayText, rubric, explain, model? } → calls OpenAI and returns { grammar, clarity, score, raw }.

Notes

- Do not expose secrets in the frontend. Keep `OPENAI_API_KEY` and any future secrets only in this server.


