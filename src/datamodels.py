"""Data transfer objects for API requests and responses."""

from dataclasses import dataclass

from src.ticket_status import TicketStatus


@dataclass
class TicketData:
    """Data transfer object for ticket creation/update."""

    title: str
    project_id: int
    description: str | None = None
    status: str = TicketStatus.TODO


@dataclass
class ProjectData:
    """Data transfer object for project creation/update."""

    name: str
    description: str
    deprecated: bool = False
