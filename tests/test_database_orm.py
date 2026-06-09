"""Tests for database ORM models."""

import uuid

import pytest
from sqlalchemy.exc import IntegrityError

from src.config import STATUS_TODO
from src.database_orm import Project
from src.database_orm import Ticket
from src.db import get_session


def _create_project(session, name="Test Project", description="Test"):
    """Helper to create a project."""
    project = Project(name=name, description=description)
    session.add(project)
    session.flush()
    return project


def _create_ticket(session, project_id, title="Test Ticket", **kwargs):
    """Helper to create a ticket."""
    kwargs.setdefault("ticket_id", str(uuid.uuid4())[:8])
    ticket = Ticket(title=title, project_id=project_id, **kwargs)
    session.add(ticket)
    session.flush()
    return ticket


# Project tests
def test_project_creation(temp_db):
    """Test creating a project."""
    with get_session() as session:
        project = _create_project(session)
        assert project.id is not None
        assert project.name == "Test Project"


def test_project_unique_name(temp_db):
    """Test that project names must be unique."""
    with get_session() as session:
        _create_project(session, name="Unique Project")

    with pytest.raises(IntegrityError):
        with get_session() as session:
            _create_project(session, name="Unique Project", description="Duplicate")


# Ticket tests
def test_ticket_creation(temp_db):
    """Test creating a ticket."""
    with get_session() as session:
        project = _create_project(session, name="Ticket Project")
        ticket = _create_ticket(session, project.id, description="A test ticket")
        assert ticket.id is not None
        assert ticket.title == "Test Ticket"
        assert ticket.status == STATUS_TODO
        assert ticket.project_id == project.id


def test_ticket_optional_fields(temp_db):
    """Test creating a ticket with optional fields."""
    with get_session() as session:
        project = _create_project(session)
        ticket = _create_ticket(session, project.id, description=None)
        assert ticket.description is None


def test_ticket_project_relationship(temp_db):
    """Test ticket-project relationship."""
    with get_session() as session:
        project = _create_project(session, name="Relationship Test")
        ticket1 = _create_ticket(session, project.id, title="Ticket 1")
        ticket2 = _create_ticket(session, project.id, title="Ticket 2")

        assert ticket1.project.name == "Relationship Test"
        assert ticket2.project.name == "Relationship Test"
        assert len(project.tickets) == 2
        assert {ticket1, ticket2} == set(project.tickets)


def test_ticket_cascade_delete(temp_db):
    """Test that deleting a project deletes its tickets."""
    with get_session() as session:
        project = _create_project(session, name="Cascade Test")
        ticket = _create_ticket(session, project.id, title="Cascade Ticket")
        ticket_id = ticket.id

        session.delete(project)
        session.flush()
        assert session.get(Ticket, ticket_id) is None


# Repr tests
@pytest.mark.parametrize(
    "model_class,args,expected_repr",
    [
        (Project, {"name": "Repr Test", "description": "Test"}, "<Project 'Repr Test'>"),
        (
            Ticket,
            {"ticket_id": "abcd1234", "title": "Repr Ticket", "status": "in_progress"},
            "<Ticket 'Repr Ticket' (in_progress)>",
        ),
    ],
)
def test_model_repr(temp_db, model_class, args, expected_repr):
    """Test model __repr__ methods."""
    with get_session() as session:
        if model_class == Ticket:
            project = _create_project(session)
            args["project_id"] = project.id
        instance = model_class(**args)
        session.add(instance)
        session.flush()
        assert repr(instance) == expected_repr
