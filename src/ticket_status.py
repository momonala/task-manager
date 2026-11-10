"""Ticket status values and the single place where a ticket's status changes."""

from enum import StrEnum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.database_orm import Ticket


class TicketStatus(StrEnum):
    PROPOSED = "proposed"
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    WONT_DO = "wont_do"


STATUS_ORDER = tuple(TicketStatus)
VALID_STATUSES = frozenset(TicketStatus)

STATUS_LABELS = {
    TicketStatus.PROPOSED: "Proposed",
    TicketStatus.TODO: "To Do",
    TicketStatus.IN_PROGRESS: "In Progress",
    TicketStatus.DONE: "Done",
    TicketStatus.WONT_DO: "Won't Do",
}


def parse_status(value: object) -> TicketStatus | None:
    """Return the matching status, or None when the value is not a known status."""
    if value not in VALID_STATUSES:
        return None
    return TicketStatus(value)


def change_status(ticket: "Ticket", new_status: TicketStatus) -> str:
    """Move a ticket to any status and return the status it had before."""
    old_status = ticket.status
    ticket.status = new_status
    return old_status
