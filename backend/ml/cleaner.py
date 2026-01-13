import re

def clean_text(text):
    """
    Cleans the article text content.
    - Removes excessive whitespace
    - Removes common ad patterns (placeholder)
    """
    if not text:
        return ""
    
    # Collaspe multiple newlines
    text = re.sub(r'\n\s*\n', '\n\n', text)
    
    # Strip whitespace
    text = text.strip()
    
    return text

def clean_title(title):
    if not title:
        return ""
    return title.strip()
