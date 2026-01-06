"""Pytest configuration and shared fixtures."""

import tempfile
from pathlib import Path

import pytest

from src import config, db
from src.database_orm import Base


@pytest.fixture(scope="function")
def temp_db():
    """Create a temporary database file for each test."""
    # Create a temporary database file
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp_file:
        temp_db_path = Path(tmp_file.name)

    # Store original values
    original_db_url = config.DATABASE_URL
    original_engine = db.engine
    original_sessionmaker = db.SessionLocal

    # Update config to use temp database
    config.DATABASE_URL = f"sqlite:///{temp_db_path}"

    # Recreate engine and sessionmaker with new database
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    db.engine = create_engine(config.DATABASE_URL, echo=False)
    db.SessionLocal = sessionmaker(bind=db.engine)

    # Create all tables
    Base.metadata.create_all(db.engine)

    yield temp_db_path

    # Cleanup: restore original values
    db.engine.dispose()
    config.DATABASE_URL = original_db_url
    db.engine = original_engine
    db.SessionLocal = original_sessionmaker

    # Delete temp database file
    if temp_db_path.exists():
        temp_db_path.unlink()
