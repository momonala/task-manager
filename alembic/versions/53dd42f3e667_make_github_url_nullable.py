"""make_github_url_nullable

Revision ID: 53dd42f3e667
Revises: 001
Create Date: 2026-01-06 15:21:13.823372
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "53dd42f3e667"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # SQLite doesn't support ALTER COLUMN, so we need to recreate the table
    # This is a simplified approach - in production with SQLite, consider using a more robust migration
    with op.batch_alter_table("projects", schema=None) as batch_op:
        batch_op.alter_column("github_url", nullable=True)


def downgrade() -> None:
    with op.batch_alter_table("projects", schema=None) as batch_op:
        batch_op.alter_column("github_url", nullable=False)
