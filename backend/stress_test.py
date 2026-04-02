import asyncio
import aiohttp
import time
import random
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "http://127.0.0.1:8000"
ENDPOINTS = [
    "/api/v1/articles",
    "/news/stats",
    "/news/technology",
    "/news/quick-feed"
]

CONCURRENT_REQUESTS = 50
TOTAL_REQUESTS = 200

async def attack_endpoint(session, endpoint):
    url = f"{BASE_URL}{endpoint}"
    try:
        # 1. Randomize Query Params to bypass cache
        params = {'limit': random.randint(1, 100), 'offset': random.randint(0, 500)}
        
        # 2. Occasional "Bad" Request
        if random.random() < 0.1:
            params['limit'] = "invalid_number_here" 
        
        start = time.time()
        async with session.get(url, params=params, timeout=5) as response:
            duration = time.time() - start
            status = response.status
            
            # We expect 200 or 422 (validation error). 500 is a FAIL.
            if status >= 500:
                logger.error(f"❌ CRASH detected on {endpoint}! Status: {status}")
                return "CRASH"
            elif status == 422:
                logger.info(f"✅ Handled bad input correctly on {endpoint}")
                return "HANDLED_BAD_INPUT"
            elif duration > 2.0:
                 logger.warning(f"⚠️ Slow response on {endpoint}: {duration:.2f}s")
                 return "SLOW"
            else:
                return "OK"

    except Exception as e:
        logger.error(f"❌ Connection Error on {endpoint}: {str(e)}")
        return "CONNECTION_FAIL"

async def run_stress_test():
    logger.info(f"🚀 Starting Stress Test: {TOTAL_REQUESTS} requests with {CONCURRENT_REQUESTS} concurrency")
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        for _ in range(TOTAL_REQUESTS):
            endpoint = random.choice(ENDPOINTS)
            tasks.append(attack_endpoint(session, endpoint))
            
            if len(tasks) >= CONCURRENT_REQUESTS:
                await asyncio.gather(*tasks)
                tasks = []
                
        if tasks:
            await asyncio.gather(*tasks)

    logger.info("✅ Stress Test Complete. Check logs for ❌ CRASH entries.")

if __name__ == "__main__":
    # Ensure aiohttp is installed: pip install aiohttp
    try:
        import aiohttp
        asyncio.run(run_stress_test())
    except ImportError:
        print("Please install aiohttp first: pip install aiohttp")
