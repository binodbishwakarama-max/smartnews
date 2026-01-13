from PIL import Image
import requests
from io import BytesIO
import logging

logger = logging.getLogger(__name__)

class ImageProcessor:
    def process_image(self, image_url: str) -> str | None:
        """
        Validates, Crops, and Optimizes images.
        Returns the ORIGINAL url if valid (we don't have S3 to store the processed one in this demo).
        In a real app, we would upload the processed bytes to S3/CDN and return that URL.
        """
        if not image_url: return None
        
        try:
            # 1. Fetch
            response = requests.get(image_url, timeout=5, stream=True)
            if response.status_code != 200: return None
            
            # Check size without downloading full body if possible (Content-Length)
            # but usually safely just read it for analysis
            img = Image.open(BytesIO(response.content))
            
            # 2. Validation
            width, height = img.size
            if width < 600 or height < 400:
                logger.warning(f"Image too small: {width}x{height} - {image_url}")
                return None
            
            # 3. Ratio Check (Avoid extreme banners or skylines)
            ratio = width / height
            if ratio > 2.5 or ratio < 0.5:
                 logger.warning(f"Image extreme ratio: {ratio} - {image_url}")
                 return None

            # 4. Success - In prod, we'd crop to 16:9 here and save as WebP
            return image_url

        except Exception as e:
            logger.error(f"Image error: {e}")
            return None

image_processor = ImageProcessor()
