<div align="center">

# 📰 SmartNews — AI-Powered Real-Time Newsroom

  <p align="center">
    Next-generation news aggregator powered by <strong>FastAPI</strong>, <strong>Next.js 16</strong>, <strong>Dense Vector AI Deduplication</strong>, and <strong>Server-Sent Events (SSE)</strong>.
    <br />
    <a href="https://smartnewsap.vercel.app"><strong>🌐 Explore Live App »</strong></a>
    ·
    <a href="https://smartnews-ap.onrender.com/docs"><strong>📡 Explore API Docs »</strong></a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" alt="PyTorch" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  </p>
</div>

---

## 🚀 Overview

**SmartNews** is an engineering-first, real-time news aggregator designed to eliminate noise, clickbait, and duplicate reporting. It ingests content continuously across 16+ top global media outlets (BBC, CNN, Reuters, AP, The Verge, Hacker News, etc.), performs **semantic vector deduplication** using Transformer models, scores content quality algorithmically, and streams fresh stories directly to the client UI with zero polling.

### 🌟 Key Highlights
- **⚡ Real-Time Ingestion & Streaming**: Server-Sent Events (SSE) PubSub pipeline streams articles to the feed as they are scraped.
- **🧠 Dense Vector AI Deduplication**: `sentence-transformers` (`all-MiniLM-L6-v2`) cosine similarity clustering groups identical breaking stories into a single coverage card.
- **⚖️ Continuous Quality Engine (0–100 Ranking)**: Logarithmic word count scoring, Flesch Reading Ease Gaussian curves, and clickbait/ALL-CAPS headline penalties.
- **⌨️ X-Style Keyboard Navigation**: `J`/`K` navigation, `L` to bookmark, `S` to share, `Enter` to open Reader Mode, and `?` for shortcuts.
- **🛡️ High-Availability Architecture**: Exponential backoff client (`safeApiRequest`) with zero-downtime Offline Preview Fallback mode for cold-start mitigation.

---

## 🔗 Deployed Links

| Service | Environment | URL |
| :--- | :--- | :--- |
| **Frontend Dashboard** | Vercel | [https://smartnewsap.vercel.app](https://smartnewsap.vercel.app) |
| **Backend OpenAPI Docs** | Render | [https://smartnews-ap.onrender.com/docs](https://smartnews-ap.onrender.com/docs) |
| **API Health Status** | Render | [https://smartnews-ap.onrender.com/health](https://smartnews-ap.onrender.com/health) |

---

## 🏗️ System Architecture

```
                                 ┌────────────────────────┐
                                 │ 16+ Live News Sources  │
                                 └───────────┬────────────┘
                                             │
                                             ▼
                               ┌──────────────────────────┐
                               │ ScraperV2 Ingestion Loop │
                               └───────────┬──────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │ AI Deduplication & Clustering Engine         │
                    │ • Dense Vector (all-MiniLM-L6-v2)            │
                    │ • Jaccard Index Fallback                     │
                    └──────────────┬───────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────────────────────┐
                    │ Continuous Quality Engine (Score 0-100)      │
                    │ • Logarithmic Length & Readability           │
                    │ • Clickbait & ALL CAPS Penalization          │
                    └──────────────┬───────────────────────────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
       ┌──────────────────────────┐  ┌───────────────────────┐
       │ PostgreSQL / SQLite DB   │  │ SSE Real-Time PubSub  │
       └─────────────┬────────────┘  └───────────┬───────────┘
                     │                           │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │ Next.js 16 Web Application    │
                   │ • Resilient Exponential Client│
                   │ • Offline Preview Fallback    │
                   │ • Keyboard Navigation Engine  │
                   └───────────────────────────────┘
```

---

## 💻 Tech Stack

### Backend
- **Framework**: Python 3.14, FastAPI, Uvicorn, Gunicorn
- **Database & ORM**: SQLAlchemy 2.0, SQLite (Local Dev) / PostgreSQL (Production)
- **Machine Learning / NLP**: PyTorch, `sentence-transformers`, `nltk`, `textstat`, `ftfy`
- **Scraping & Parsing**: BeautifulSoup4, `newspaper3k`, `requests`, `feedparser`
- **Security & Rate Limiting**: SlowAPI, Custom Middleware (HSTS, CSP, CORS)

### Frontend
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language & Styling**: TypeScript, Tailwind CSS, Lucide Icons
- **Auth & State**: Clerk Authentication, Custom React Contexts (`ReaderContext`, `BookmarkContext`)
- **Resilience**: Custom exponential backoff client (`safeApiRequest`) with offline fallback state

---

## 📡 Core API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status & DB connectivity test |
| `GET` | `/api/v1/articles/` | List articles with pagination, category, and source filters |
| `GET` | `/api/v1/articles/search` | Search articles across title, content, summary, and author |
| `GET` | `/api/v1/articles/stream` | Server-Sent Events (SSE) real-time article stream |
| `GET` | `/api/v1/trending/` | Fetch top trending topics by volume |
| `GET` | `/news/stats` | Database article counts and live ingestion status |
| `POST` | `/api/v1/auth/signup` | User authentication registration |

---

## 🛠️ Local Development Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Clone the Repository
```bash
git clone https://github.com/binodbishwakarama-max/smartnews.git
cd smartnews
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Start backend server
cd backend
uvicorn app.main:app --reload --port 8000
```
The FastAPI backend will run on `http://127.0.0.1:8000`.

### 3. Frontend Setup
```bash
# Open a new terminal in project root
cd frontend

# Install dependencies
npm install

# Run Next.js development server
npm run dev
```
The Next.js app will run on `http://localhost:3000`.

---

## 🧪 Testing

Run backend unit and integration test suite:

```bash
cd backend
pytest tests/test_api.py -v
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ by Binod Bishwakarma</sub>
</div>
