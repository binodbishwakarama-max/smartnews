"""
Utility to generate lightweight SVG placeholder images for articles without images.
No external dependencies required (no Pillow needed).
"""
import urllib.parse

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

# Category icons (simple unicode glyphs for SVG text)
CATEGORY_ICONS = {
    'Technology': '⚙',
    'AI & Startups': '🤖',
    'Business & Finance': '📈',
    'Business': '📈',
    'Science': '🔬',
    'Health': '❤',
    'Education': '📚',
    'Politics': '🏛',
    'World': '🌍',
    'Environment': '🌱',
    'Sports': '⚽',
    'Culture': '🎭',
    'General': '📰'
}


def _escape_xml(text: str) -> str:
    """Escape text for safe SVG embedding."""
    return (text
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace("'", '&apos;'))


def generate_placeholder_image(category: str, title: str) -> str:
    """
    Generate a lightweight SVG placeholder image for articles without images.
    Returns a data URI that can be stored directly in the database.
    No external dependencies needed.
    """
    base_color = CATEGORY_COLORS.get(category, '#6B7280')
    icon = CATEGORY_ICONS.get(category, '📰')
    category_label = _escape_xml(category.upper())

    # Truncate and escape title
    title_clean = _escape_xml(title[:60] + '...' if len(title) > 60 else title)

    # Create a visually appealing gradient SVG
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{base_color};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:{base_color};stop-opacity:0.7"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="450" width="1200" height="180" fill="rgba(0,0,0,0.3)"/>
  <text x="60" y="100" font-family="system-ui,sans-serif" font-size="28" font-weight="700"
        fill="rgba(255,255,255,0.8)" letter-spacing="4">{category_label}</text>
  <text x="600" y="300" font-family="system-ui,sans-serif" font-size="80"
        fill="rgba(255,255,255,0.15)" text-anchor="middle" dominant-baseline="middle">{icon}</text>
  <text x="60" y="540" font-family="Georgia,serif" font-size="32" font-weight="700"
        fill="white">{title_clean}</text>
</svg>'''

    encoded = urllib.parse.quote(svg)
    return f"data:image/svg+xml,{encoded}"
