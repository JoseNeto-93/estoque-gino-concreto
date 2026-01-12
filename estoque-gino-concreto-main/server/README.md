# GINO Server

Simple Express server to process report images/PDFs using Gemini (GenAI). This keeps the `GEN_AI_API_KEY` on the server and avoids exposing it in the browser.

Setup:

1. Copy `.env.example` to `.env` and set `GEN_AI_API_KEY`.
2. Install dependencies and start server:

```bash
cd server
npm install
npm start
```

By default the server listens on port `3001`. Configure the client by setting `VITE_API_URL` to `http://localhost:3001` in the frontend `.env`.
