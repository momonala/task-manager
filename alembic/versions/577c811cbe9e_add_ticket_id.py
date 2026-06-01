"""add_ticket_id

Revision ID: 577c811cbe9e
Revises: 5faf4e4f5d6a
Create Date: 2026-06-01 20:56:10.896118
"""

import uuid

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "577c811cbe9e"
down_revision = "5faf4e4f5d6a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tickets", sa.Column("ticket_id", sa.String(length=8), nullable=True))

    # Backfill existing rows
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id FROM tickets")).fetchall()
    for (row_id,) in rows:
        conn.execute(
            sa.text("UPDATE tickets SET ticket_id = :tid WHERE id = :id"),
            {"tid": str(uuid.uuid4())[:8], "id": row_id},
        )

    # SQLite doesn't support ALTER COLUMN, so enforce NOT NULL via batch recreation
    with op.batch_alter_table("tickets") as batch_op:
        batch_op.alter_column("ticket_id", nullable=False)
        batch_op.create_unique_constraint("uq_tickets_ticket_id", ["ticket_id"])


def downgrade() -> None:
    with op.batch_alter_table("tickets") as batch_op:
        batch_op.drop_constraint("uq_tickets_ticket_id", type_="unique")
        batch_op.drop_column("ticket_id")
