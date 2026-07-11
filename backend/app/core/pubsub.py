import asyncio
import logging
from typing import List

logger = logging.getLogger(__name__)

class PubSub:
    def __init__(self):
        self._listeners: List[asyncio.Queue] = []

    def subscribe(self) -> asyncio.Queue:
        queue = asyncio.Queue()
        self._listeners.append(queue)
        logger.info(f"New client subscribed to real-time feed. Total listeners: {len(self._listeners)}")
        return queue

    def unsubscribe(self, queue: asyncio.Queue):
        if queue in self._listeners:
            self._listeners.remove(queue)
            logger.info(f"Client unsubscribed from real-time feed. Total listeners: {len(self._listeners)}")

    def publish(self, article_data: dict):
        if not self._listeners:
            return
        
        logger.info(f"Publishing real-time event for article {article_data.get('id')} to {len(self._listeners)} listeners")
        
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        for queue in self._listeners:
            if loop and loop.is_running():
                # Thread-safe scheduling for asyncio Queue from thread pool worker
                loop.call_soon_threadsafe(queue.put_nowait, article_data)
            else:
                try:
                    queue.put_nowait(article_data)
                except Exception as e:
                    logger.warning(f"Failed to publish to a listener queue: {e}")

# Singleton instance
pubsub = PubSub()
