"""rename_github_url_to_local_path

Revision ID: 85742b37b557
Revises: 53dd42f3e667
Create Date: 2026-01-06 20:07:34.210030
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "85742b37b557"
down_revision = "53dd42f3e667"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("projects", schema=None) as batch_op:
        batch_op.alter_column("github_url", new_column_name="local_path")


def downgrade() -> None:
    with op.batch_alter_table("projects", schema=None) as batch_op:
        batch_op.alter_column("local_path", new_column_name="github_url")
