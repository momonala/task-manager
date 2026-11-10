"""Tests for dataclasses in datamodels.py."""

from src.datamodels import ProjectData
from src.datamodels import TicketData
from src.ticket_status import TicketStatus


def test_ticket_data():
    """Test TicketData dataclass creation."""
    ticket = TicketData(
        title="Test Ticket",
        project_id=1,
        description="Test description",
        status=TicketStatus.TODO,
    )
    assert ticket.title == "Test Ticket"
    assert ticket.project_id == 1
    assert ticket.status == TicketStatus.TODO


def test_ticket_data_defaults():
    """Test TicketData with default values."""
    ticket = TicketData(title="Test", project_id=1)
    assert ticket.description is None
    assert ticket.status == TicketStatus.TODO


def test_project_data():
    """Test ProjectData dataclass creation."""
    project = ProjectData(name="Test Project", description="Test description")
    assert project.name == "Test Project"
    assert project.description == "Test description"


def test_project_data_defaults():
    """Test ProjectData with default values."""
    project = ProjectData(name="Test", description="Desc")
    assert project.deprecated is False
