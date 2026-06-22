"""add missing audit_log columns

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-19 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # Add created_at if missing
    has_created_at = conn.execute(sa.text(
        "SELECT 1 FROM information_schema.columns "
        "WHERE table_name='audit_logs' AND column_name='created_at'"
    )).fetchone()
    if not has_created_at:
        op.add_column(
            "audit_logs",
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        )

    # Add metadata if missing
    has_metadata = conn.execute(sa.text(
        "SELECT 1 FROM information_schema.columns "
        "WHERE table_name='audit_logs' AND column_name='metadata'"
    )).fetchone()
    if not has_metadata:
        op.add_column(
            "audit_logs",
            sa.Column("metadata", sa.Text, nullable=True),
        )


def downgrade() -> None:
    op.drop_column("audit_logs", "metadata")
    op.drop_column("audit_logs", "created_at")
