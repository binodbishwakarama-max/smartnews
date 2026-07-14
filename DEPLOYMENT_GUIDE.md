# 🚀 Deployment Guide: Smart News App (100% Free Stack)

Follow these steps to deploy your production-ready Smart News Aggregator for free using **Supabase** (PostgreSQL database), **Render** (FastAPI backend), and **Vercel** (Next.js frontend).

---

## 🛠️ Step 1: Create a Free PostgreSQL Database (Supabase)

1. Go to [Supabase.com](https://supabase.com) and sign up for a free account.
2. Click **New Project** and name it `smartnews`. Set a secure **Database Password** (save it somewhere safe!).
3. Choose the region closest to your target audience.
4. Once the project is provisioned (takes ~1 minute), go to **Project Settings** (gear icon) -> **Database**.
5. Scroll down to **Connection String** and choose **URI**.
6. Copy the connection URI. It will look like this:
   ```text
   postgresql://postgres.[YOUR_PROJECT_ID]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
   *(Make sure to replace `[YOUR_PASSWORD]` with your actual database password!)*

---

## 🐙 Step 2: Push Your Code to GitHub

If you haven't already pushed your committed changes to GitHub:
1. Log in to [GitHub.com](https://github.com) and create a new **Public** or **Private** repository named `smartnews`.
2. Do **not** initialize it with a README or .gitignore.
3. Run the following commands in your local project terminal:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/smartnews.git
   git branch -M main
   git push -u origin main
   ```

---

## 🐍 Step 3: Deploy the FastAPI Backend (Render.com)

1. Go to [Render Dashboard](https://dashboard.render.com) and sign in.
2. Click **New +** -> **Web Service**.
3. Connect your `smartnews` GitHub repository.
4. Configure the following settings:
   * **Name**: `smartnews-api`
   * **Root Directory**: `backend`
   * **Runtime**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt && python -c "import nltk; nltk.download('punkt_tab', quiet=True); nltk.download('punkt', quiet=True)"`
   * **Start Command**: `gunicorn app.main:app -w 1 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 300`
5. Click **Advanced** and add the following **Environment Variables**:
   * `DATABASE_URL`: *Paste the Supabase Connection URI copied in Step 1*
   * `SECRET_KEY`: *Generate a random key (e.g. run `openssl rand -hex 32`)*
   * `DEBUG`: `False`
   * `ENABLE_INLINE_SCRAPER_LOOP`: `True`
6. Click **Deploy Web Service**.
7. Once deployed, copy your Render URL (e.g., `https://smartnews-api.onrender.com`).

---

## ▲ Step 4: Deploy the Next.js Frontend (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your `smartnews` GitHub repository.
4. Configure the settings (Vercel auto-detects Next.js):
   * **Framework Preset**: Next.js
   * **Root Directory**: `frontend`
5. Under **Environment Variables**, add:
   * **Name**: `NEXT_PUBLIC_API_URL`
   * **Value**: `https://smartnews-api.onrender.com` *(Use your actual Render URL from Step 3 without `/api/v1` or trailing slash)*
6. Click **Deploy**.

---

## 🎉 Live URLs
* **Frontend**: `https://smartnewsap.vercel.app`
* **API Documentation**: `https://smartnews-api.onrender.com/docs`
