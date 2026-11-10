"""Tests for the config CLI that install/install.sh reads."""

import pytest
import typer
from typer.testing import CliRunner

from src.config import config_cli

app = typer.Typer()
app.command()(config_cli)

runner = CliRunner()


@pytest.mark.parametrize(
    "flag,expected_output", [("--project-name", "task-manager"), ("--flask-port", "5010")]
)
def test_config_returns_single_value(flag: str, expected_output: str):
    result = runner.invoke(app, [flag])

    assert result.exit_code == 0
    assert result.stdout.strip() == expected_output


def test_config_all_prints_key_value_lines():
    result = runner.invoke(app, ["--all"])

    assert result.exit_code == 0
    assert "project_name=task-manager" in result.stdout
    assert "flask_port=5010" in result.stdout
