# Deployment Guide - Campus Connect

This document details how to deploy the **Campus Connect** full-stack application (Express Node.js server + React SPA frontend).

---

## 1. Deploying to Render (Recommended - Free Tier Node Service)

Render natively runs Node.js applications with persistent servers and Express backends.

### Steps:
1. Push your repository to GitHub or GitLab.
2. Sign in to [Render.com](https://render.com).
3. Click **New +** -> **Web Service**.
4. Connect your repository.
5. Configure the following settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
   - `TOKEN_SECRET`: *(Any secure random secret string)*
7. Click **Create Web Service**.

---

## 2. Deploying with Docker (Fly.io / Railway / Cloud Run / AWS / Azure)

A pre-configured [`Dockerfile`](./Dockerfile) and [`.dockerignore`](./.dockerignore) are included.

### Local Docker Build & Test:
```bash
docker build -t campus-connect .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_api_key_here campus-connect
```

### Deploy to Fly.io:
```bash
fly launch
fly secrets set GEMINI_API_KEY=your_key TOKEN_SECRET=your_secret
fly deploy
```

### Deploy to Railway:
1. Create a project on [Railway.app](https://railway.app).
2. Connect your GitHub repository. Railway automatically detects the `Dockerfile` or `package.json`.
3. Add `GEMINI_API_KEY` and `TOKEN_SECRET` variables in Railway dashboard.

---

## 3. Deploying Frontend to Vercel

If you deploy the static frontend to Vercel:
1. Import the repository in [Vercel](https://vercel.com).
2. Set Framework Preset: **Vite**.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variables:
   - `GEMINI_API_KEY`: *(Your key)*

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `PORT` | Optional | Port for server (default: `3000`) |
| `HOST` | Optional | Host address (default: `0.0.0.0`) |
| `NODE_ENV` | Recommended | Set to `production` for production builds |
| `GEMINI_API_KEY` | Optional | Gemini API key for server-side AI features |
| `TOKEN_SECRET` | Recommended | Secret key used for signing session JWT tokens |
