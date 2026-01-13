from pydantic import BaseModel
from typing import List, Optional

class SourceConfig(BaseModel):
    name: str
    url: str
    category: str
    priority: int = 1 # 1 (High/Breaking) to 3 (Low/Blog)
    type: str = "general" # general, specific, search
    region: str = "Global" # Global, US, Europe, Asia, India, etc.
    selectors: Optional[dict] = None

# Massive List of 50+ Sources
SOURCES = [
    # --- Global News (Priority 1) ---
    SourceConfig(name="BBC News", url="https://www.bbc.com/news", category="World", priority=1, region="Global"),
    SourceConfig(name="CNN", url="https://edition.cnn.com", category="World", priority=1, region="US"),
    SourceConfig(name="Reuters", url="https://www.reuters.com", category="Business", priority=1, region="Global"),
    SourceConfig(name="Al Jazeera", url="https://www.aljazeera.com", category="World", priority=2, region="MiddleEast"),
    SourceConfig(name="The Guardian", url="https://www.theguardian.com/international", category="World", priority=2, region="Europe"),
    SourceConfig(name="Associated Press", url="https://apnews.com", category="World", priority=1, region="Global"),
    SourceConfig(name="The New York Times", url="https://www.nytimes.com", category="World", priority=1, region="US"),

    # --- Business & Finance ---
    SourceConfig(name="Bloomberg", url="https://www.bloomberg.com", category="Business", priority=2, region="Global"),
    SourceConfig(name="Financial Times", url="https://www.ft.com", category="Business", priority=2, region="Europe"),
    SourceConfig(name="CNBC", url="https://www.cnbc.com", category="Business", priority=2, region="US"),
    SourceConfig(name="Business Insider", url="https://www.businessinsider.com", category="Business", priority=2, region="US"),
    SourceConfig(name="Economic Times", url="https://economictimes.indiatimes.com", category="Business", priority=2, region="India"),
    SourceConfig(name="Fortune", url="https://fortune.com", category="Business", priority=2),
    
    # --- Technology ---
    SourceConfig(name="The Verge", url="https://www.theverge.com", category="Technology", priority=2),
    SourceConfig(name="TechCrunch", url="https://techcrunch.com", category="Technology", priority=2),
    SourceConfig(name="Wired", url="https://www.wired.com", category="Technology", priority=2),
    SourceConfig(name="MIT Tech Review", url="https://www.technologyreview.com", category="Technology", priority=2),
    SourceConfig(name="Ars Technica", url="https://arstechnica.com", category="Technology", priority=3),

    # --- Science ---
    SourceConfig(name="Nature", url="https://www.nature.com/news", category="Science", priority=2),
    SourceConfig(name="Scientific American", url="https://www.scientificamerican.com", category="Science", priority=3),
    SourceConfig(name="New Scientist", url="https://www.newscientist.com", category="Science", priority=3),
    SourceConfig(name="Space.com", url="https://www.space.com", category="Science", priority=3),

    # --- Culture & Lifestyle ---
    SourceConfig(name="Vogue", url="https://www.vogue.com", category="Culture", priority=3),
    SourceConfig(name="Rolling Stone", url="https://www.rollingstone.com", category="Culture", priority=2),
    SourceConfig(name="The New Yorker", url="https://www.newyorker.com", category="Culture", priority=2),
    SourceConfig(name="Variety", url="https://variety.com", category="Culture", priority=2),
    SourceConfig(name="BBC Culture", url="https://www.bbc.com/culture", category="Culture", priority=3),

    # --- Health ---
    SourceConfig(name="Stat News", url="https://www.statnews.com", category="Health", priority=2),
    SourceConfig(name="Healthline", url="https://www.healthline.com", category="Health", priority=3),
    SourceConfig(name="Medical News Today", url="https://www.medicalnewstoday.com", category="Health", priority=3),

    # --- Education ---
    SourceConfig(name="EdSurge", url="https://www.edsurge.com", category="Education", priority=3),
    SourceConfig(name="Inside Higher Ed", url="https://www.insidehighered.com", category="Education", priority=3),
    
    # --- India ---
    SourceConfig(name="Times of India", url="https://timesofindia.indiatimes.com", category="World", priority=2, region="India"),
    SourceConfig(name="The Hindu", url="https://www.thehindu.com", category="World", priority=2, region="India"),
    SourceConfig(name="NDTV", url="https://www.ndtv.com", category="World", priority=2, region="India"),
]

# Keywords for Searching/Topic Crawling
TOPIC_KEYWORDS = [
    "Artificial Intelligence", "Climate Change", "Global Economy", 
    "Health Science", "Space Exploration", "Cultural Trends"
]
