"""Flask application entry point for the task management board."""

import logging
import re
import uuid
from datetime import datetime
from pathlib import Path

from flask import Flask
from flask import jsonify
from flask import render_template
from flask import request

from src import config
from src.database_orm import Project
from src.database_orm import Ticket
from src.db import get_session

logging.basicConfig(level=logging.INFO)
logging.getLogger("werkzeug").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# Get the project root directory (parent of src/)
PROJECT_ROOT = Path(__file__).parent.parent

app = Flask(
    __name__,
    template_folder=str(PROJECT_ROOT / "templates"),
    static_folder=str(PROJECT_ROOT / "static"),
)


def get_project_color(project_id: int) -> str:
    """Generate a consistent color for a project based on its ID."""
    # Color palette for projects (dark mode friendly)
    colors = [
        "#0a84ff",  # blue
        "#30d158",  # green
        "#ff9f0a",  # orange
        "#ff453a",  # red
        "#bf5af2",  # purple
        "#5e5ce6",  # indigo
        "#ff375f",  # pink
        "#64d2ff",  # cyan
        "#ffd60a",  # yellow
        "#32d74b",  # mint
    ]
    return colors[project_id % len(colors)]


POPOUT_TICKET_STATUS_ORDER = (
    config.STATUS_TODO,
    config.STATUS_IN_PROGRESS,
    config.STATUS_PROPOSED,
    config.STATUS_DONE,
    config.STATUS_WONT_DO,
)
_POPOUT_STATUS_RANK = {status: index for index, status in enumerate(POPOUT_TICKET_STATUS_ORDER)}


def _project_name_sort_key(project: Project) -> str:
    """Sort key for alphabetizing projects, ignoring any leading emoji."""
    return re.sub(r"^[^\w]+", "", project.name).lower()


def _popout_ticket_sort_key(ticket: Ticket) -> tuple[int, float]:
    """Sort popout tickets by workflow status, then most recently updated."""
    status_rank = _POPOUT_STATUS_RANK.get(ticket.status, len(POPOUT_TICKET_STATUS_ORDER))
    return (status_rank, -ticket.updated_at.timestamp())


def serialize_projects_ticket_data(projects: list[Project]) -> dict[str, dict]:
    """Serialize per-project ticket lists for the projects page popout."""
    return {
        str(project.id): {
            "tickets": [
                {
                    "id": ticket.id,
                    "ticket_id": ticket.ticket_id,
                    "title": ticket.title,
                    "status": ticket.status,
                }
                for ticket in sorted(project.tickets, key=_popout_ticket_sort_key)
            ],
        }
        for project in projects
    }


# --- Views ---


@app.route("/")
def index():
    """Render the main Kanban board."""
    with get_session() as session:
        projects = session.query(Project).all()
        projects.sort(key=_project_name_sort_key)
        tickets = session.query(Ticket).order_by(Ticket.created_at.desc()).all()

        # Generate color map for projects
        project_colors = {project.id: get_project_color(project.id) for project in projects}
        deprecated_project_ids = {project.id for project in projects if project.deprecated}

        # Group tickets by status
        columns = {
            config.STATUS_PROPOSED: [],
            config.STATUS_TODO: [],
            config.STATUS_IN_PROGRESS: [],
            config.STATUS_DONE: [],
            config.STATUS_WONT_DO: [],
        }
        for ticket in tickets:
            columns[ticket.status].append(ticket)

        return render_template(
            "index.html",
            projects=projects,
            columns=columns,
            status_labels=config.STATUS_LABELS,
            statuses=config.STATUS_ORDER,
            project_colors=project_colors,
            deprecated_project_ids=deprecated_project_ids,
        )


@app.route("/projects")
def projects_list():
    """Render the projects management page."""
    with get_session() as session:
        projects = session.query(Project).all()

        def last_activity(project: Project):
            dates = [project.last_modified] if project.last_modified else []
            dates.extend(t.updated_at for t in project.tickets if t.updated_at)
            return max(dates) if dates else datetime.min

        projects.sort(key=lambda p: (p.deprecated, -last_activity(p).timestamp()))

        return render_template(
            "projects.html",
            projects=projects,
            project_tickets=serialize_projects_ticket_data(projects),
        )


# --- API Endpoints ---


@app.route("/api/tickets", methods=["POST"])
def create_ticket():
    """Create a new ticket."""
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    title = data.get("title", "").strip()
    project_id = data.get("project_id")

    if not title:
        return jsonify({"error": "Title is required"}), 400
    if not project_id:
        return jsonify({"error": "Project is required"}), 400

    with get_session() as session:
        project = session.get(Project, project_id)
        if not project:
            return jsonify({"error": "Project not found"}), 404

        ticket = Ticket(
            ticket_id=str(uuid.uuid4())[:8],
            title=title,
            project_id=project_id,
            description=data.get("description") or None,
        )
        session.add(ticket)
        session.flush()

        logger.info("✅ Created ticket: %s", ticket.title)
        return jsonify({"id": ticket.id, "status": "created"}), 201


@app.route("/api/tickets/<int:ticket_id>", methods=["GET"])
def get_ticket(ticket_id: int):
    """Get a single ticket's details."""
    with get_session() as session:
        ticket = session.get(Ticket, ticket_id)
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404

        return jsonify(
            {
                "id": ticket.id,
                "ticket_id": ticket.ticket_id,
                "title": ticket.title,
                "description": ticket.description,
                "project_id": ticket.project_id,
                "project_name": ticket.project.name,
                "status": ticket.status,
                "created_at": ticket.created_at.isoformat(),
                "updated_at": ticket.updated_at.isoformat(),
            }
        )


@app.route("/api/tickets/<int:ticket_id>", methods=["PUT"])
def update_ticket(ticket_id: int):
    """Update an existing ticket."""
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    with get_session() as session:
        ticket = session.get(Ticket, ticket_id)
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404

        # Update fields if provided
        if "title" in data:
            ticket.title = data["title"].strip()
        if "description" in data:
            ticket.description = data["description"] or None
        if "project_id" in data:
            project = session.get(Project, data["project_id"])
            if not project:
                return jsonify({"error": "Project not found"}), 404
            ticket.project_id = data["project_id"]
        if "status" in data:
            new_status = data["status"]
            if new_status not in config.VALID_STATUSES:
                return jsonify({"error": f"Invalid status: {new_status}"}), 400
            ticket.status = new_status
        logger.info("📝 Updated ticket: %s", ticket.title)
        return jsonify({"status": "updated"})


@app.route("/api/tickets/<int:ticket_id>/status", methods=["PATCH"])
def update_ticket_status(ticket_id: int):
    """Update only a ticket's status (for drag-and-drop)."""
    data = request.json
    if not data or "status" not in data:
        return jsonify({"error": "Status is required"}), 400

    new_status = data["status"]
    if new_status not in config.VALID_STATUSES:
        return jsonify({"error": f"Invalid status: {new_status}"}), 400

    with get_session() as session:
        ticket = session.get(Ticket, ticket_id)
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404

        old_status = ticket.status
        ticket.status = new_status

        # Update project's last_modified if ticket is marked done
        if new_status == config.STATUS_DONE and old_status != config.STATUS_DONE:
            # The onupdate trigger on project.last_modified will handle this
            # when we access it, but we can also explicitly touch the project
            pass

        logger.info("🔄 Ticket %s: %s → %s", ticket.title, old_status, new_status)
        return jsonify({"status": "updated"})


@app.route("/api/tickets/<int:ticket_id>", methods=["DELETE"])
def delete_ticket(ticket_id: int):
    """Delete a ticket."""
    with get_session() as session:
        ticket = session.get(Ticket, ticket_id)
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404

        title = ticket.title
        session.delete(ticket)
        logger.info("🗑️ Deleted ticket: %s", title)
        return jsonify({"status": "deleted"})


# --- Ticket API (by ticket_id) ---


@app.route("/api/tickets/tid/<ticket_id>", methods=["GET"])
def get_ticket_by_tid(ticket_id: str):
    """Get a ticket by its human-readable ticket_id."""
    with get_session() as session:
        ticket = session.query(Ticket).filter_by(ticket_id=ticket_id).first()
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404

        return jsonify(
            {
                "id": ticket.id,
                "ticket_id": ticket.ticket_id,
                "title": ticket.title,
                "description": ticket.description,
                "project_id": ticket.project_id,
                "project_name": ticket.project.name,
                "status": ticket.status,
                "created_at": ticket.created_at.isoformat(),
                "updated_at": ticket.updated_at.isoformat(),
            }
        )


@app.route("/api/tickets/tid/<ticket_id>", methods=["PUT"])
def update_ticket_by_tid(ticket_id: str):
    """Update a ticket's title, project, and description by its ticket_id."""
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    with get_session() as session:
        ticket = session.query(Ticket).filter_by(ticket_id=ticket_id).first()
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404

        if "title" in data:
            ticket.title = data["title"].strip()
        if "description" in data:
            ticket.description = data["description"] or None
        if "project_id" in data:
            project = session.get(Project, data["project_id"])
            if not project:
                return jsonify({"error": "Project not found"}), 404
            ticket.project_id = data["project_id"]

        logger.info("📝 Updated ticket: %s", ticket.title)
        return jsonify({"status": "updated"})


@app.route("/api/tickets/tid/<ticket_id>", methods=["DELETE"])
def delete_ticket_by_tid(ticket_id: str):
    """Delete a ticket by its ticket_id."""
    with get_session() as session:
        ticket = session.query(Ticket).filter_by(ticket_id=ticket_id).first()
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404

        title = ticket.title
        session.delete(ticket)
        logger.info("🗑️ Deleted ticket: %s", title)
        return jsonify({"status": "deleted"})


# --- Project API ---


@app.route("/api/projects", methods=["POST"])
def create_project():
    """Create a new project."""
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    name = data.get("name", "").strip()
    description = data.get("description", "").strip()

    if not name or not description:
        return jsonify({"error": "Name and description are required"}), 400

    with get_session() as session:
        existing = session.query(Project).filter_by(name=name).first()
        if existing:
            return jsonify({"error": "Project name already exists"}), 409

        project = Project(name=name, description=description)
        session.add(project)
        session.flush()

        logger.info("✅ Created project: %s", project.name)
        return jsonify({"id": project.id, "status": "created"}), 201


@app.route("/api/projects/<int:project_id>", methods=["GET"])
def get_project(project_id: int):
    """Get a single project's details."""
    with get_session() as session:
        project = session.get(Project, project_id)
        if not project:
            return jsonify({"error": "Project not found"}), 404

        return jsonify(
            {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "deprecated": project.deprecated,
                "last_modified": project.last_modified.isoformat() if project.last_modified else None,
            }
        )


@app.route("/api/projects/<int:project_id>", methods=["PUT"])
def update_project(project_id: int):
    """Update an existing project."""
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    with get_session() as session:
        project = session.get(Project, project_id)
        if not project:
            return jsonify({"error": "Project not found"}), 404

        if "name" in data:
            new_name = data["name"].strip()
            if new_name != project.name:
                existing = session.query(Project).filter_by(name=new_name).first()
                if existing:
                    return jsonify({"error": "Project name already exists"}), 409
            project.name = new_name
        if "description" in data:
            project.description = data["description"].strip()
        if "deprecated" in data:
            project.deprecated = bool(data["deprecated"])

        logger.info("📝 Updated project: %s", project.name)
        return jsonify({"status": "updated"})


@app.route("/api/projects/<int:project_id>", methods=["DELETE"])
def delete_project(project_id: int):
    """Delete a project and all its tickets."""
    with get_session() as session:
        project = session.get(Project, project_id)
        if not project:
            return jsonify({"error": "Project not found"}), 404

        name = project.name
        session.delete(project)
        logger.info("🗑️ Deleted project: %s", name)
        return jsonify({"status": "deleted"})


def main():
    logger.info("Starting Task Board on http://localhost:5010")
    app.run(debug=config.DEBUG, port=5010)


if __name__ == "__main__":
    main()
