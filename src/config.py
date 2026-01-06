"""Application configuration constants."""

from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent  # Project root (parent of src/)
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)  # Ensure data directory exists
DATABASE_PATH = DATA_DIR / "taskboard.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Ticket statuses
STATUS_PROPOSED = "proposed"
STATUS_TODO = "todo"
STATUS_IN_PROGRESS = "in_progress"
STATUS_DONE = "done"
STATUS_WONT_DO = "wont_do"

VALID_STATUSES = frozenset({STATUS_PROPOSED, STATUS_TODO, STATUS_IN_PROGRESS, STATUS_DONE, STATUS_WONT_DO})

# Display labels for statuses
STATUS_LABELS = {
    STATUS_PROPOSED: "Proposed",
    STATUS_TODO: "To Do",
    STATUS_IN_PROGRESS: "In Progress",
    STATUS_DONE: "Done",
    STATUS_WONT_DO: "Won't Do",
}

# Flask config
DEBUG = True
SECRET_KEY = "dev-secret-key-change-in-production"
