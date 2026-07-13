# Smart News Aggregator

A production-grade news aggregation system with ML-powered classification, duplicate detection, clickbait filtering, and personalized recommendations.

## 🔗 Live Demo
- **Frontend App**: [smartnewsap.vercel.app](https://smartnewsap.vercel.app)
- **API Documentation**: [smartnews-api.onrender.com/docs](https://smartnews-api.onrender.com/docs)

## ✅ What's Implemented

### Backend (Python + FastAPI)
- ✅ **News Scraping**: Automated scraping from BBC, CNN, Times of India, The Verge, Hacker News
- ✅ **ML Classification**: Topic categorization (Tech, Business, Sports, Politics, Entertainment, Science, Health)
- ✅ **Duplicate Detection**: TF-IDF cosine similarity (threshold: 0.9)
- ✅ **Clickbait Filtering**: Binary classifier to filter clickbait headlines
- ✅ **Personalization Engine**: User-based recommendations using interaction history
- ✅ **Background Jobs**: Auto-scraping every 30 minutes
- ✅ **SQLite Database**: Articles, users, and interactions storage
- ✅ **REST API**: 7 endpoints for articles, categories, recommendations, trending, user data

### Machine Learning
- ✅ **Topic Classifier**: Logistic Regression with TF-IDF (trained on sample data)
- ✅ **Clickbait Detector**: Binary classifier (trained on sample data)
- ✅ **Recommendation System**: Category-based user profiling

### Frontend
- ✅ **Simple HTML Dashboard**: Tailwind CSS responsive UI
- ✅ **Live Feed**: Articles with categories and sources
- ✅ **Trending Section**: Non-clickbait trending articles
- ✅ **Recommendations**: Personalized suggestions

---

## 🚀 Quick Start

### 1. Install Dependencies

```powershell
# Activate virtual environment
.\.venv\Scripts\activate

# Install Python packages
pip install -r backend\requirements.txt
```

### 2. Train ML Models (Optional - sample models included)

```powershell
python backend\ml\train_classifier.py
python backend\ml\train_clickbait.py
```

### 3. Start the Backend Server

**Option A: Using batch file (recommended)**
```powershell
.\start_server.bat
```

**Option B: Manual start**
```powershell
.\.venv\Scripts\activate
cd backend
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

The server will:
- Create the SQLite database
- Start background scraping immediately
- Run scraper every 30 minutes
- Listen on `http://127.0.0.1:8000`

### 4. Open the Frontend

Open `frontend\index.html` in your browser or visit `http://127.0.0.1:8000/docs` for API documentation.

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/articles?limit=50` | GET | List scraped articles |
| `/categories` | GET | Get all article categories |
| `/recommendations?user_id=1` | GET | Personalized article recommendations |
| `/trending?limit=10` | GET | Trending non-clickbait articles |
| `/user/history?user_id=1` | GET | User interaction history |
| `/user/interests?user_id=1` | GET | User interest profile (category weights) |
| `/scrape` | POST | Trigger manual scraping (admin) |

### Example API Call

```powershell
# Get articles
Invoke-RestMethod -Uri http://127.0.0.1:8000/articles?limit=5

# Get categories
Invoke-RestMethod -Uri http://127.0.0.1:8000/categories

# Get recommendations for user 1
Invoke-RestMethod -Uri http://127.0.0.1:8000/recommendations?user_id=1
```

---

## 🗂️ Project Structure

```
d:\smartnews\
├── backend/
│   ├── app.py                    # FastAPI application
│   ├── database.py               # SQLAlchemy setup
│   ├── models.py                 # ORM models
│   ├── scraper.py                # News scraping logic
│   ├── jobs.py                   # Background tasks
│   ├── recommender.py            # Recommendation engine
│   ├── requirements.txt          # Python dependencies
│   ├── ml/
│   │   ├── train_classifier.py  # Topic classification training
│   │   ├── train_clickbait.py   # Clickbait detection training
│   │   ├── duplicate.py         # Duplicate detection
│   │   ├── predict.py           # ML inference
│   │   ├── data/
│   │   │   ├── sample_articles.csv
│   │   │   └── sample_clickbait.csv
│   │   └── models/              # Saved ML models (.joblib)
│   └── smartnews.db             # SQLite database (created on first run)
│
├── frontend/
│   └── index.html               # Simple web dashboard
│
├── .venv/                       # Virtual environment
├── test_api.py                  # API testing script
└── start_server.bat             # Windows startup script
```

---

## 🔧 Configuration

Create a `.env` file (optional):

```env
DATABASE_URL=sqlite:///./smartnews.db
SECRET_KEY=your-secret-key-here
SCRAPE_INTERVAL_MIN=30
TOPIC_MODEL_PATH=backend/ml/models/topic_model.joblib
CLICKBAIT_MODEL_PATH=backend/ml/models/clickbait_model.joblib
```

---

## 🧪 Testing

**Quick API check** (from repo root):
```powershell
python test_api.py
```

**Backend unit/integration tests** (pytest):
```powershell
cd backend
pip install -r requirements.txt
$env:DATABASE_URL = "sqlite:///:memory:"
$env:SECRET_KEY = "test-key"
python -m pytest tests/ -v --tb=short
```

See **PROJECT_COMPLETION.md** for full run instructions and CI details.

---

## 📊 How It Works

### 1. **Scraping Pipeline**
   - Every 30 minutes, scrapes top stories from 5 news sources
   - Extracts: title, content, image, author, date, URL
   - Uses `newspaper3k` for article extraction
   - Source-specific parsers for better accuracy

### 2. **Duplicate Detection**
   - Compares new article against existing ones using TF-IDF
   - Computes cosine similarity
   - Discards if similarity > 0.9

### 3. **ML Classification**
   - **Topic Classifier**: Predicts category from article content
   - **Clickbait Detector**: Analyzes headline patterns
   - Both use Logistic Regression + TF-IDF
   - Models saved as `.joblib` files

### 4. **Personalization**
   - Tracks user interactions (clicks, likes, read time)
   - Builds category preference vector
   - Ranks articles by user interest + recency
   - Filters out clickbait

### 5. **API Layer**
   - FastAPI with CORS enabled
   - Automatic validation with Pydantic
   - SQLAlchemy ORM for database
   - Background tasks with `asyncio`

---

## 🛠️ Tech Stack

**Backend:**
- Python 3.14
- FastAPI
- SQLAlchemy
- SQLite
- BeautifulSoup4
- Newspaper3k
- Scikit-learn
- Pandas
- Uvicorn

**Frontend:**
- HTML5
- Tailwind CSS
- Vanilla JavaScript (Fetch API)

---

## 🔥 Features Demonstrated

✅ Web scraping automation  
✅ Machine learning classification  
✅ Duplicate detection (TF-IDF)  
✅ Clickbait filtering  
✅ Personalized recommendations  
✅ Background job scheduling  
✅ REST API design  
✅ Database modeling  
✅ Full-stack integration  

---

## 📝 Notes

- **Sample Data**: The ML models are trained on minimal sample data. For production, use larger labeled datasets.
- **Scraping**: Some news sites may block scrapers. Add delays/headers as needed.
- **Database**: Uses SQLite by default. For production, use PostgreSQL.
- **Authentication**: User system is basic. Add JWT/OAuth for production.

---

## 🚀 Next Steps

To enhance the project:

1. **Add user authentication** (JWT tokens)
2. **Implement sentiment analysis**
3. **Add real-time notifications** (WebSockets)
4. **Deploy with Docker**
5. **Add more news sources**
6. **Improve ML models with more training data**
7. **Add caching (Redis)**
8. **Create React/Vue frontend**

---

## 📄 License

MIT

---

**Built with ❤️ using Python, FastAPI, and Machine Learning**
