from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from functools import lru_cache
import time

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Simple in-memory cache
class SimpleCache:
    def __init__(self, ttl: int = 300):
        self.cache = {}
        self.ttl = ttl
    
    def get(self, key: str):
        if key in self.cache:
            value, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return value
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, value):
        self.cache[key] = (value, time.time())
    
    def clear(self):
        self.cache.clear()

cache = SimpleCache(ttl=300)

def cache_response(key: str, ttl: int = 300):
    """Decorator to cache function responses"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            cached = cache.get(key)
            if cached is not None:
                return cached
            result = func(*args, **kwargs)
            cache.set(key, result)
            return result
        return wrapper
    return decorator
