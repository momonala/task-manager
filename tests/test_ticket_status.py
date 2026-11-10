"""Characterization tests for ticket status values and transitions."""

import itertools
import json
import logging
import uuid
from datetime import datetime

import pytest

from src.app import POPOUT_TICKET_STATUS_ORDER
from src.app import app
from src.database_orm import Project
from src.database_orm import Ticket
from src.db import get_session
from src.ticket_status import STATUS_LABELS
from src.ticket_status import STATUS_ORDER
from src.ticket_status import TicketStatus
from src.ticket_status import parse_status

ALL_MOVES = list(itertools.product(STATUS_ORDER, repeat=2))
SEEDED_LAST_MODIFIED = datetime(2000, 1, 1)


@pytest.fixture
def client(temp_db):
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def _create_ticket(status: str) -> tuple[int, int]:
    with get_session() as session:
        project = Project(name=f"Project {uuid.uuid4()}", description="d", last_modified=SEEDED_LAST_MODIFIED)
        session.add(project)
        session.flush()
        ticket = Ticket(ticket_id=str(uuid.uuid4())[:8], title="T", project_id=project.id, status=status)
        session.add(ticket)
        session.flush()
        return project.id, ticket.id


def _project_last_modified(project_id: int):
    with get_session() as session:
        return session.get(Project, project_id).last_modified


def _stored_status(ticket_id: int) -> str:
    with get_session() as session:
        return session.get(Ticket, ticket_id).status


def test_status_values_and_labels_are_unchanged():
    assert [str(s) for s in STATUS_ORDER] == ["proposed", "todo", "in_progress", "done", "wont_do"]
    assert {str(k): v for k, v in STATUS_LABELS.items()} == {
        "proposed": "Proposed",
        "todo": "To Do",
        "in_progress": "In Progress",
        "done": "Done",
        "wont_do": "Won't Do",
    }


def test_popout_status_order_is_unchanged():
    assert [str(s) for s in POPOUT_TICKET_STATUS_ORDER] == [
        "todo",
        "in_progress",
        "proposed",
        "done",
        "wont_do",
    ]


@pytest.mark.parametrize("value", ["proposed", "todo", "in_progress", "done", "wont_do"])
def test_parse_status_accepts_known_values(value):
    assert parse_status(value) == value
    assert isinstance(parse_status(value), TicketStatus)


@pytest.mark.parametrize("value", ["invalid", "Done", "", None, 1])
def test_parse_status_rejects_unknown_values(value):
    assert parse_status(value) is None


@pytest.mark.parametrize("old,new", ALL_MOVES)
def test_patch_status_stores_plain_string_and_leaves_project_untouched(client, caplog, old, new):
    project_id, ticket_id = _create_ticket(old)

    with caplog.at_level(logging.INFO, logger="src.app"):
        response = client.patch(
            f"/api/tickets/{ticket_id}/status",
            data=json.dumps({"status": str(new)}),
            content_type="application/json",
        )

    assert response.status_code == 200
    assert response.get_json() == {"status": "updated"}
    assert _stored_status(ticket_id) == str(new)
    assert type(_stored_status(ticket_id)) is str
    assert _project_last_modified(project_id) == SEEDED_LAST_MODIFIED
    assert f"Ticket T: {old} → {new}" in caplog.text
    assert client.get(f"/api/tickets/{ticket_id}").get_json()["status"] == str(new)


@pytest.mark.parametrize(
    "old,new",
    [
        (TicketStatus.TODO, TicketStatus.DONE),
        (TicketStatus.DONE, TicketStatus.DONE),
        (TicketStatus.DONE, TicketStatus.IN_PROGRESS),
        (TicketStatus.WONT_DO, TicketStatus.PROPOSED),
    ],
)
def test_put_status_stores_plain_string_and_leaves_project_untouched(client, old, new):
    project_id, ticket_id = _create_ticket(old)

    response = client.put(
        f"/api/tickets/{ticket_id}",
        data=json.dumps({"status": str(new)}),
        content_type="application/json",
    )

    assert response.status_code == 200
    assert _stored_status(ticket_id) == str(new)
    assert _project_last_modified(project_id) == SEEDED_LAST_MODIFIED


@pytest.mark.parametrize("method,path", [("patch", "/api/tickets/{id}/status"), ("put", "/api/tickets/{id}")])
def test_invalid_status_is_rejected_and_not_stored(client, method, path):
    _, ticket_id = _create_ticket(TicketStatus.DONE)

    response = getattr(client, method)(
        path.format(id=ticket_id),
        data=json.dumps({"status": "bogus"}),
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.get_json() == {"error": "Invalid status: bogus"}
    assert _stored_status(ticket_id) == "done"
