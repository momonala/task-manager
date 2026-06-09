"""Data transfer objects for API requests and responses."""

from dataclasses import dataclass

from src import config


@dataclass
class TicketData:
    """Data transfer object for ticket creation/update."""

    title: str
    project_id: int
    description: str | None = None
    status: str = config.STATUS_TODO


@dataclass
class ProjectData:
    """Data transfer object for project creation/update."""

    name: str
    description: str
    deprecated: bool = False
