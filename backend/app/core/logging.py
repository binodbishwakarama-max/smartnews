import logging
import logging.config
import sys
from pathlib import Path

def setup_logging(log_level: str = "INFO", log_file: str = "logs/app.log"):
    """Setup logging configuration for the application."""

    # Try to create logs directory; fall back to console-only on failure
    # (Render free tier has ephemeral filesystem that may not support log files)
    use_file_handler = False
    try:
        log_path = Path(log_file)
        log_path.parent.mkdir(exist_ok=True)
        # Test that we can actually write to the file
        log_path.touch(exist_ok=True)
        use_file_handler = True
    except (OSError, PermissionError):
        pass

    handlers_list = ["console"]
    handlers_config = {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "stream": sys.stdout,
            "level": log_level
        },
    }

    if use_file_handler:
        handlers_list.append("file")
        handlers_config["file"] = {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "detailed",
            "filename": log_file,
            "maxBytes": 10 * 1024 * 1024,  # 10MB
            "backupCount": 5,
            "encoding": "utf-8",
            "level": log_level
        }

    # Logging configuration
    LOGGING_CONFIG = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "detailed": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            }
        },
        "handlers": handlers_config,
        "root": {
            "level": log_level,
            "handlers": handlers_list
        },
        "loggers": {
            "uvicorn": {
                "level": "INFO",
                "handlers": handlers_list,
                "propagate": False
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": handlers_list,
                "propagate": False
            },
            "sqlalchemy": {
                "level": "WARNING",  # Reduce SQLAlchemy noise
                "handlers": handlers_list,
                "propagate": False
            }
        }
    }

    logging.config.dictConfig(LOGGING_CONFIG)

    # Create logger for this module
    logger = logging.getLogger(__name__)
    logger.info("Logging system initialized")

    return logger