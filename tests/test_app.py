"""Tests for Flask application routes and API endpoints."""

import json

import pytest

from app import app, get_project_color
from src.database_orm import Project, Ticket
from src.db import get_session

# Test constants
NON_EXISTENT_ID = 99999
HTTP_OK = 200
HTTP_CREATED = 201
HTTP_BAD_REQUEST = 400
HTTP_NOT_FOUND = 404
HTTP_CONFLICT = 409


@pytest.fixture
def client(temp_db):
    """Create a test client for the Flask app."""
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    with app.test_client() as client:
        yield client


@pytest.fixture
def sample_project(temp_db):
    """Create a sample project for testing."""
    with get_session() as session:
        project = Project(name="Test Project", description="A test project", local_path="/tmp/test")
        session.add(project)
        session.flush()
        return project.id


@pytest.fixture
def sample_ticket(sample_project):
    """Create a sample ticket for testing."""
    with get_session() as session:
        ticket = Ticket(title="Test Ticket", project_id=sample_project)
        session.add(ticket)
        session.flush()
        return ticket.id


def _create_resource(session, model, **kwargs):
    """Helper to create a resource in the database."""
    resource = model(**kwargs)
    session.add(resource)
    session.flush()
    return resource.id


# View routes
@pytest.mark.parametrize("route,expected_content", [("/", b"Task Board"), ("/projects", b"Projects")])
def test_view_routes(client, route, expected_content):
    """Test view routes render successfully."""
    response = client.get(route)
    assert response.status_code == HTTP_OK
    assert expected_content in response.data


# Project API
@pytest.mark.parametrize(
    "data,expected_status",
    [
        ({"name": "Project", "description": "Desc"}, HTTP_CREATED),
        ({"name": "Project", "description": "Desc", "local_path": "/tmp/path"}, HTTP_CREATED),
        ({"description": "Desc"}, HTTP_BAD_REQUEST),
        ({"name": "Project"}, HTTP_BAD_REQUEST),
        ({}, HTTP_BAD_REQUEST),
    ],
)
def test_create_project(client, data, expected_status):
    """Test creating projects with various inputs."""
    response = client.post("/api/projects", data=json.dumps(data), content_type="application/json")
    assert response.status_code == expected_status
    if expected_status == HTTP_CREATED:
        result = json.loads(response.data)
        with get_session() as session:
            project = session.get(Project, result["id"])
            assert project.name == data["name"]


@pytest.mark.parametrize("action", ["create", "update"])
def test_project_duplicate_name(client, sample_project, action):
    """Test creating/updating project with duplicate name fails."""
    if action == "update":
        with get_session() as session:
            project2_id = _create_resource(session, Project, name="Project 2", description="Second")
        endpoint = f"/api/projects/{project2_id}"
        method = client.put
    else:
        endpoint = "/api/projects"
        method = client.post

    data = {"name": "Test Project", "description": "Duplicate"}
    response = method(endpoint, data=json.dumps(data), content_type="application/json")
    assert response.status_code == HTTP_CONFLICT


def test_get_project(client, sample_project):
    """Test getting a single project."""
    response = client.get(f"/api/projects/{sample_project}")
    assert response.status_code == HTTP_OK
    result = json.loads(response.data)
    assert result["name"] == "Test Project"


def test_update_project(client, sample_project):
    """Test updating a project."""
    data = {"name": "Updated", "description": "Updated desc", "local_path": "/tmp/updated"}
    response = client.put(
        f"/api/projects/{sample_project}", data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == HTTP_OK
    with get_session() as session:
        assert session.get(Project, sample_project).name == "Updated"


def test_delete_project(client, sample_project):
    """Test deleting a project."""
    response = client.delete(f"/api/projects/{sample_project}")
    assert response.status_code == HTTP_OK
    with get_session() as session:
        assert session.get(Project, sample_project) is None


# Ticket API
@pytest.mark.parametrize(
    "data_template,expected_status",
    [
        ({"title": "Ticket", "project_id": None}, HTTP_CREATED),
        ({"title": "Ticket", "project_id": None, "description": "Desc"}, HTTP_CREATED),
        ({"project_id": None}, HTTP_BAD_REQUEST),
        ({"title": "Ticket"}, HTTP_BAD_REQUEST),
        ({}, HTTP_BAD_REQUEST),
    ],
)
def test_create_ticket(client, sample_project, data_template, expected_status):
    """Test creating tickets with various inputs."""
    data = data_template.copy()
    if "project_id" in data and data["project_id"] is None:
        data["project_id"] = sample_project
    response = client.post("/api/tickets", data=json.dumps(data), content_type="application/json")
    assert response.status_code == expected_status
    if expected_status == HTTP_CREATED:
        result = json.loads(response.data)
        with get_session() as session:
            ticket = session.get(Ticket, result["id"])
            assert ticket.title == data["title"]
            assert ticket.status == "todo"


def test_create_ticket_project_not_found(client):
    """Test creating ticket with non-existent project."""
    data = {"title": "Test", "project_id": NON_EXISTENT_ID}
    response = client.post("/api/tickets", data=json.dumps(data), content_type="application/json")
    assert response.status_code == HTTP_NOT_FOUND


def test_get_ticket(client, sample_ticket):
    """Test getting a single ticket."""
    response = client.get(f"/api/tickets/{sample_ticket}")
    assert response.status_code == HTTP_OK
    result = json.loads(response.data)
    assert result["title"] == "Test Ticket"


def test_update_ticket(client, sample_ticket):
    """Test updating a ticket."""
    data = {"title": "Updated", "status": "in_progress", "acceptance_criteria": "Test"}
    response = client.put(
        f"/api/tickets/{sample_ticket}", data=json.dumps(data), content_type="application/json"
    )
    assert response.status_code == HTTP_OK
    with get_session() as session:
        ticket = session.get(Ticket, sample_ticket)
        assert ticket.title == "Updated"
        assert ticket.status == "in_progress"


@pytest.mark.parametrize(
    "status,valid", [("todo", True), ("in_progress", True), ("done", True), ("invalid", False)]
)
def test_update_ticket_status(client, sample_project, status, valid):
    """Test updating ticket status."""
    with get_session() as session:
        ticket_id = _create_resource(session, Ticket, title="Status Test", project_id=sample_project)

    response = client.patch(
        f"/api/tickets/{ticket_id}/status",
        data=json.dumps({"status": status}),
        content_type="application/json",
    )
    expected_status = HTTP_OK if valid else HTTP_BAD_REQUEST
    assert response.status_code == expected_status
    if valid:
        with get_session() as session:
            assert session.get(Ticket, ticket_id).status == status


def test_update_ticket_invalid_project(client, sample_project):
    """Test updating ticket with invalid project_id."""
    with get_session() as session:
        ticket_id = _create_resource(session, Ticket, title="Test", project_id=sample_project)

    data = {"project_id": NON_EXISTENT_ID}
    response = client.put(f"/api/tickets/{ticket_id}", data=json.dumps(data), content_type="application/json")
    assert response.status_code == HTTP_NOT_FOUND


def test_delete_ticket(client, sample_ticket):
    """Test deleting a ticket."""
    response = client.delete(f"/api/tickets/{sample_ticket}")
    assert response.status_code == HTTP_OK
    with get_session() as session:
        assert session.get(Ticket, sample_ticket) is None


# Error handling
@pytest.mark.parametrize(
    "endpoint",
    [f"/api/projects/{NON_EXISTENT_ID}", f"/api/tickets/{NON_EXISTENT_ID}"],
)
def test_get_not_found(client, endpoint):
    """Test getting non-existent resources returns 404."""
    assert client.get(endpoint).status_code == HTTP_NOT_FOUND


@pytest.mark.parametrize(
    "endpoint,method,data",
    [
        (f"/api/projects/{NON_EXISTENT_ID}", "put", {"name": "Test"}),
        (f"/api/projects/{NON_EXISTENT_ID}", "delete", None),
        (f"/api/tickets/{NON_EXISTENT_ID}", "put", {"title": "Test"}),
        (f"/api/tickets/{NON_EXISTENT_ID}", "delete", None),
        (f"/api/tickets/{NON_EXISTENT_ID}/status", "patch", {"status": "todo"}),
    ],
)
def test_update_delete_not_found(client, endpoint, method, data):
    """Test updating/deleting non-existent resources returns 404."""
    method_func = getattr(client, method)
    kwargs = {} if method == "delete" else {"data": json.dumps(data), "content_type": "application/json"}
    assert method_func(endpoint, **kwargs).status_code == HTTP_NOT_FOUND


@pytest.mark.parametrize(
    "endpoint_template,method",
    [
        ("/api/projects/{id}", "put"),
        ("/api/tickets/{id}", "put"),
        ("/api/tickets/{id}/status", "patch"),
    ],
)
def test_update_no_data(client, sample_project, endpoint_template, method):
    """Test updating resources with no data returns 400."""
    with get_session() as session:
        if "tickets" in endpoint_template:
            resource_id = _create_resource(session, Ticket, title="Test", project_id=sample_project)
        else:
            resource_id = sample_project

    endpoint = endpoint_template.format(id=resource_id)
    method_func = getattr(client, method)
    response = method_func(endpoint, data=json.dumps({}), content_type="application/json")
    assert response.status_code == HTTP_BAD_REQUEST


# Helper functions
def test_get_project_color():
    """Test get_project_color returns consistent colors."""
    color = get_project_color(1)
    assert color == get_project_color(1)
    assert color.startswith("#") and len(color) == 7
