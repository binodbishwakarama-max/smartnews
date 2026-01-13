import sqlite3
import requests
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import base64

# Category color scheme
CATEGORY_COLORS = {
    'Technology': '#3B82F6',
    'AI & Startups': '#8B5CF6',
    'Business & Finance': '#10B981',
    'Science': '#06B6D4',
    'Health': '#EF4444',
    'Education': '#F59E0B',
    'Politics': '#DC2626',
    'World': '#6366F1',
    'Environment': '#059669',
    'Sports': '#F97316',
    'Culture': '#EC4899',
    'General': '#6B7280'
}

def generate_placeholder_image(category: str, title: str) -> str:
    """Generate a beautiful gradient placeholder image for articles without images"""
    # Create image
    width, height = 1200, 630
    img = Image.new('RGB', (width, height), color=CATEGORY_COLORS.get(category, '#6B7280'))
    draw = ImageDraw.Draw(img)
    
    # Add gradient effect (simple version - darker at bottom)
    for y in range(height):
        alpha = int(255 * (y / height) * 0.3)
        draw.rectangle([(0, y), (width, y+1)], fill=(0, 0, 0, alpha))
    
    # Add category label
    try:
        # Try to use a nice font, fallback to default
        font_large = ImageFont.truetype("arial.ttf", 60)
        font_small = ImageFont.truetype("arial.ttf", 30)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Draw category name
    category_text = category.upper()
    draw.text((60, 60), category_text, fill='white', font=font_small)
    
    # Draw truncated title
    title_truncated = title[:80] + "..." if len(title) > 80 else title
    draw.text((60, height - 120), title_truncated, fill='white', font=font_large)
    
    # Save to bytes
    buffered = BytesIO()
    img.save(buffered, format="JPEG", quality=85)
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/jpeg;base64,{img_str}"

# Update database with placeholder images
conn = sqlite3.connect('news.db')
cur = conn.cursor()

cur.execute("SELECT id, title, category FROM articles WHERE image_url IS NULL OR image_url = ''")
articles_without_images = cur.fetchall()

print(f"Found {len(articles_without_images)} articles without images")
print("Generating placeholders...")

updated = 0
for article_id, title, category in articles_without_images:
    try:
        placeholder_url = generate_placeholder_image(category or 'General', title)
        cur.execute("UPDATE articles SET image_url = ? WHERE id = ?", (placeholder_url, article_id))
        updated += 1
        if updated % 10 == 0:
            print(f"Updated {updated} articles...")
    except Exception as e:
        print(f"Error generating placeholder for article {article_id}: {e}")

conn.commit()
conn.close()

print(f"\n✅ Successfully updated {updated} articles with placeholder images!")
