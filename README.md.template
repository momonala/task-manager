# {{PROJECT_NAME}}

{{SHORT_DESCRIPTION}}

## Tech Stack

- {{LANGUAGE_VERSION}} / {{FRAMEWORK}} backend
- {{DATABASE}} for data storage
- {{OTHER_TECH}}

## Architecture

```mermaid
flowchart LR
    subgraph External
        {{EXTERNAL_SERVICE}}[{{EXTERNAL_NAME}}]
    end
    subgraph Storage
        DB[({{DATABASE_FILE}})]
    end
    subgraph App
        Server[{{FRAMEWORK}} Server :{{PORT}}]
    end
    
    {{EXTERNAL_SERVICE}} -->|{{API_ACTION}}| Server
    Server --> DB
```

## Prerequisites

- {{LANGUAGE_VERSION}}+
- [uv](https://github.com/astral-sh/uv) for dependency management

## Installation

1. Clone the repository:
```bash
git clone https://github.com/{{GITHUB_USER}}/{{REPO_NAME}}.git
cd {{REPO_NAME}}
```

2. Install dependencies:
```bash
uv sync
```

## Running

```bash
uv run python app.py
```

Server runs at http://localhost:{{PORT}}

## Project Structure

```
{{REPO_NAME}}/
├── app.py                    # {{FRAMEWORK}} application & routes
├── datamodels.py             # Data models / dataclasses
├── db.py                     # Database connection utilities
├── pyproject.toml            # Dependencies & tool config
│
└── install/                  # Deployment scripts (optional)
    └── install.sh
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/status` | GET | Health check |
| `/{{MAIN_ENDPOINT}}` | {{HTTP_METHOD}} | {{ENDPOINT_DESCRIPTION}} |

### {{HTTP_METHOD}} /{{MAIN_ENDPOINT}}

```bash
curl -X {{HTTP_METHOD}} http://localhost:{{PORT}}/{{MAIN_ENDPOINT}} \
  -H "Content-Type: application/json" \
  -d '{{EXAMPLE_REQUEST_BODY}}'
```

Request body:
```json
{
  "{{FIELD_1}}": "{{FIELD_1_TYPE}} (required)",
  "{{FIELD_2}}": "{{FIELD_2_TYPE}} (optional)"
}
```

Response:
```json
{
  "status": "success",
  "data": {}
}
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| **{{CONCEPT_1}}** | {{CONCEPT_1_DESCRIPTION}} |
| **{{CONCEPT_2}}** | {{CONCEPT_2_DESCRIPTION}} |

## Data Models

```
{{MODEL_NAME}}
├── {{FIELD_1}}: {{FIELD_1_TYPE}}
├── {{FIELD_2}}: {{FIELD_2_TYPE}}
└── {{FIELD_3}}: {{FIELD_3_TYPE}}
```

## Storage

| File | Purpose |
|------|---------|
| `{{DATABASE_FILE}}` | {{DATABASE_DESCRIPTION}} |

## Deployment

{{DEPLOYMENT_INSTRUCTIONS}}

