from urllib.parse import urlparse

def normalize_source_domain(source_or_url: str) -> str:
    """
    Parses a URL or raw source string, extracts the host,
    lowercases it, and strips any leading 'www.'.
    """
    if not source_or_url:
        return "unknown"
        
    # If the source string does not look like a URL (e.g., "Reuters"),
    # we lowercase it and strip spaces/www.
    source_str = source_or_url.strip()
    
    # Check if it has a protocol or domain-like extension
    if "." not in source_str:
        # It's a clean name like "Reuters" or "Bloomberg"
        name = source_str.lower()
        if name.startswith("www."):
            name = name[4:]
        return name

    # Ensure urlparse can extract the host correctly
    parsed_url = source_str
    if not source_str.startswith(('http://', 'https://')):
        if source_str.startswith('//'):
            parsed_url = 'https:' + source_str
        else:
            parsed_url = 'https://' + source_str
            
    try:
        parsed = urlparse(parsed_url)
        hostname = parsed.hostname
        if not hostname:
            hostname = parsed.path.split('/')[0]
        
        hostname = hostname.lower()
        if hostname.startswith('www.'):
            hostname = hostname[4:]
        return hostname
    except Exception:
        # Fallback to simple split
        try:
            domain = source_str.split('/')
            idx = 2 if '//' in source_str else 0
            res = domain[idx].lower()
            if res.startswith('www.'):
                res = res[4:]
            return res
        except Exception:
            return source_str.lower()
