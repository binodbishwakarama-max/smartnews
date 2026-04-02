# 🚀 Deployment Guide: Smart News App

Your app is ready for the world. Follow these 3 steps to launch it.

## Step 1: Push to GitHub 🐙

1.  Log in to [GitHub.com](https://github.com) and create a **New Repository** named `smartnews`.
2.  **Do not** add a README or .gitignore (we already have them).
3.  Run these commands in your terminal (copy-paste them):

```bash
git remote add origin https://github.com/YOUR_USERNAME/smartnews.git
git branch -M main
git push -u origin main
```
*(Replace `YOUR_USERNAME` with your actual GitHub username)*

---

## Step 2: Deploy Backend (Render.com) 🐍

1.  Go to [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** -> **Web Service**.
3.  Connect your `smartnews` GitHub repo.
4.  **Settings**:
    *   **Name**: `smartnews-api`
    *   **Root Directory**: `backend`
    *   **Runtime**: `Python 3`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn run_local:app --host 0.0.0.0 --port $PORT`
    *   **Environment Variables**:
        *   `PYTHON_VERSION`: `3.9.0` (Recommended)
5.  Click **Deploy Web Service**.
6.  **Copy the URL** it gives you (e.g., `https://smartnews-api.onrender.com`).

---

## Step 3: Deploy Frontend (Vercel) ▲

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New...** -> **Project**.
3.  Import your `smartnews` GitHub repo.
4.  **Settings** (Vercel auto-detects most):
    *   **Framework Preset**: Next.js
    *   **Root Directory**: `frontend`
5.  **Environment Variables** (Crucial!):
    *   Name: `NEXT_PUBLIC_API_URL`
    *   Value: `https://smartnews-api.onrender.com` (The URL from Step 2 WITHOUT /api/v1)
    *   *Note: If your backend URL ends in slash, remove it. It should be just the domain.*
6.  Click **Deploy**.

---

## 🎉 Success!

Your app is now live.
- **Frontend**: `https://smartnews.vercel.app`
- **Backend**: `https://smartnews-api.onrender.com/docs`
