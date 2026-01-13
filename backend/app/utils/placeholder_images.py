"""
Utility to generate beautiful placeholder images for articles without images
"""
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import base64

# Category color scheme matching the frontend
CATEGORY_COLORS = {
    'Technology': '#3B82F6',
    'AI & Startups': '#8B5CF6',
    'Business & Finance': '#10B981',
    'Business': '#10B981',
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
    """
    Generate a beautiful gradient placeholder image for articles without images.
    Returns a data URI that can be stored directly in the database.
    """
    try:
        # Create image with category color
        width, height = 1200, 630
        base_color = CATEGORY_COLORS.get(category, '#6B7280')
        
        # Convert hex to RGB
        base_color = base_color.lstrip('#')
        r, g, b = tuple(int(base_color[i:i+2], 16) for i in (0, 2, 4))
        
        img = Image.new('RGB', (width, height), color=(r, g, b))
        draw = ImageDraw.Draw(img)
        
        # Add subtle gradient overlay (darker at bottom)
        for y in range(height):
            alpha = int(50 * (y / height))
            overlay_color = (max(0, r - alpha), max(0, g - alpha), max(0, b - alpha))
            draw.line([(0, y), (width, y)], fill=overlay_color)
        
        # Add text
        try:
            font_category = ImageFont.truetype("arial.ttf", 32)
            font_title = ImageFont.truetype("arialbd.ttf", 48)
        except:
            font_category = ImageFont.load_default()
            font_title = ImageFont.load_default()
        
        # Draw category badge
        category_text = category.upper()
        draw.text((50, 50), category_text, fill='rgba(255,255,255,0.9)', font=font_category)
        
        # Draw title (truncated)
        title_truncated = (title[:60] + "...") if len(title) > 60 else title
        
        # Multi-line title support
        words = title_truncated.split()
        lines = []
        current_line = []
        for word in words:
            test_line = ' '.join(current_line + [word])
            if len(test_line) > 40:
                lines.append(' '.join(current_line))
                current_line = [word]
            else:
                current_line.append(word)
        if current_line:
            lines.append(' '.join(current_line))
        
        # Draw title lines
        y_offset = height - 180
        for line in lines[:3]:  # Max 3 lines
            draw.text((50, y_offset), line, fill='white', font=font_title)
            y_offset += 60
        
        # Save to base64 data URI
        buffered = BytesIO()
        img.save(buffered, format="JPEG", quality=85)
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return f"data:image/jpeg;base64,{img_str}"
    
    except Exception as e:
        # Fallback to a simple colored rectangle
        return f"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'%3E%3Crect width='1200' height='630' fill='{CATEGORY_COLORS.get(category, '#6B7280')}'/%3E%3C/svg%3E"
