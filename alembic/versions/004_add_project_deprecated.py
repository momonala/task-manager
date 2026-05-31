"""Add deprecated column to projects table.

Revision ID: 004
Revises: 85742b37b557
Create Date: 2026-05-31
"""

import sqlalchemy as sa

from alembic import op

revision = "004"
down_revision = "85742b37b557"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column("deprecated", sa.Boolean(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("projects", "deprecated")
