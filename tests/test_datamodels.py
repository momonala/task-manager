"""Tests for dataclasses in datamodels.py."""

from src import config
from src.datamodels import ProjectData, TicketData


def test_ticket_data():
    """Test TicketData dataclass creation."""
    ticket = TicketData(
        title="Test Ticket",
        project_id=1,
        description="Test description",
        status=config.STATUS_TODO,
        acceptance_criteria="Test criteria",
        scope="Test scope",
        prompt="Test prompt",
    )
    assert ticket.title == "Test Ticket"
    assert ticket.project_id == 1
    assert ticket.status == config.STATUS_TODO


def test_ticket_data_defaults():
    """Test TicketData with default values."""
    ticket = TicketData(title="Test", project_id=1)
    assert ticket.description is None
    assert ticket.status == config.STATUS_TODO
    assert ticket.acceptance_criteria is None


def test_project_data():
    """Test ProjectData dataclass creation."""
    project = ProjectData(name="Test Project", description="Test description", local_path="/tmp/test")
    assert project.name == "Test Project"
    assert project.local_path == "/tmp/test"


def test_project_data_defaults():
    """Test ProjectData with default values."""
    project = ProjectData(name="Test", description="Desc")
    assert project.local_path is None
