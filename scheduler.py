"""Hourly backup scheduler for the task board database."""

import logging
import subprocess
from datetime import datetime
from pathlib import Path

import schedule
from src.config import DATABASE_PATH

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).parent
FILE_TO_COMMIT = DATABASE_PATH
BRANCH = "main"


def run_command(cmd: list[str]) -> str:
    """Execute a shell command and return stdout."""
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=PROJECT_ROOT)
    return result.stdout.strip()


def commit_if_changed() -> None:
    """Check if database has changed and commit if it has."""
    diff = run_command(["git", "diff", FILE_TO_COMMIT])
    if diff:
        run_command(["git", "add", FILE_TO_COMMIT])
        msg = f"Backup {FILE_TO_COMMIT}: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        run_command(["git", "commit", "-m", msg])
        run_command(["git", "push", "origin", BRANCH])
        logger.info(f"✅ [{datetime.now()}] Database backup committed and pushed.")
    else:
        logger.info(f"⏭️ [{datetime.now()}] No changes to database. Skipping backup.")


if __name__ == "__main__":
    schedule.every().hour.at(":00").do(commit_if_changed)
    logger.info("⏰ Database backup scheduler started!")
    logger.info(f"⏰ Scheduled jobs: {schedule.get_jobs()}")

    while True:
        schedule.run_pending()
        import time

        time.sleep(30)
