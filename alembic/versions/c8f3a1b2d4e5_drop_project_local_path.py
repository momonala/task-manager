"""drop_project_local_path

Revision ID: c8f3a1b2d4e5
Revises: 577c811cbe9e
Create Date: 2026-06-09 12:00:00.000000
"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "c8f3a1b2d4e5"
down_revision = "577c811cbe9e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("projects", "local_path")


def downgrade() -> None:
    op.add_column("projects", sa.Column("local_path", sa.String(length=500), nullable=True))
