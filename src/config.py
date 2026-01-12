import tomllib
from pathlib import Path

import typer

_config_file = Path(__file__).parent.parent / "pyproject.toml"
with _config_file.open("rb") as f:
    _config = tomllib.load(f)

_project_config = _config["project"]
_tool_config = _config["tool"]["config"]

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
DATABASE_PATH = DATA_DIR / _tool_config["database_filename"]
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"
FLASK_PORT = _tool_config["flask_port"]

STATUS_PROPOSED = "proposed"
STATUS_TODO = "todo"
STATUS_IN_PROGRESS = "in_progress"
STATUS_DONE = "done"
STATUS_WONT_DO = "wont_do"

VALID_STATUSES = frozenset({STATUS_PROPOSED, STATUS_TODO, STATUS_IN_PROGRESS, STATUS_DONE, STATUS_WONT_DO})

STATUS_LABELS = {
    STATUS_PROPOSED: "Proposed",
    STATUS_TODO: "To Do",
    STATUS_IN_PROGRESS: "In Progress",
    STATUS_DONE: "Done",
    STATUS_WONT_DO: "Won't Do",
}

DEBUG = True


# fmt: off
def config_cli(
    # Show all
    all: bool = typer.Option(False, "--all", help="Show all configuration values"),
    # Project keys
    project_name: bool = typer.Option(False, "--project-name", help=_project_config['name']),
    project_version: bool = typer.Option(False, "--project-version", help=_project_config['version']),
    # Application settings
    database_path: bool = typer.Option(False, "--database-path", help=str(DATABASE_PATH)),
    flask_port: bool = typer.Option(False, "--flask-port", help=str(FLASK_PORT)),
) -> None:
# fmt: on
    """Get configuration values from pyproject.toml."""
    # Show all configuration
    if all:
        typer.echo(f"project_name={_project_config['name']}")
        typer.echo(f"project_version={_project_config['version']}")
        typer.echo(f"database_path={DATABASE_PATH}")
        typer.echo(f"flask_port={FLASK_PORT}")
        return

    # Map parameters to their actual values
    param_map = {
        project_name: _project_config["name"],
        project_version: _project_config["version"],
        database_path: str(DATABASE_PATH),
        flask_port: FLASK_PORT,
    }

    for is_set, value in param_map.items():
        if is_set:
            typer.echo(value)
            return

    typer.secho(
        "Error: No config key specified. Use --help to see available options.",
        fg=typer.colors.RED,
        err=True,
    )
    raise typer.Exit(1)


def main():
    typer.run(config_cli)


if __name__ == "__main__":
    main()
