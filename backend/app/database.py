import sqlite3
import json
from datetime import datetime
from typing import Optional, List
from pathlib import Path

DB_PATH = Path("deployments.db")


def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS deployments (
            id TEXT PRIMARY KEY,
            ticket_id TEXT NOT NULL,
            sales_engineer TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            infrastructure TEXT NOT NULL,
            environment TEXT NOT NULL,
            template_used TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            terraform_workspace TEXT NOT NULL,
            outputs TEXT,
            error_message TEXT
        )
        """
    )
    try:
        conn.execute("ALTER TABLE deployments ADD COLUMN terraform_logs TEXT")
        conn.commit()
    except sqlite3.OperationalError:
        pass
    conn.commit()
    conn.close()


def save_deployment(record: dict):
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO deployments (
            id, ticket_id, sales_engineer, customer_name,
            infrastructure, environment, template_used, status,
            created_at, updated_at, terraform_workspace, outputs, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            record["id"],
            record["ticket_id"],
            record["sales_engineer"],
            record["customer_name"],
            record["infrastructure"],
            record["environment"],
            record["template_used"],
            record["status"],
            record["created_at"],
            record["updated_at"],
            record["terraform_workspace"],
            json.dumps(record.get("outputs")) if record.get("outputs") else None,
            record.get("error_message"),
        ),
    )
    conn.commit()
    conn.close()


def get_deployment(deployment_id: str) -> Optional[dict]:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM deployments WHERE id = ?", (deployment_id,)
    ).fetchone()
    conn.close()
    if row is None:
        return None
    result = dict(row)
    if result.get("outputs"):
        result["outputs"] = json.loads(result["outputs"])
    return result


def list_deployments(sales_engineer: Optional[str] = None) -> List[dict]:
    conn = get_connection()
    if sales_engineer:
        rows = conn.execute(
            "SELECT * FROM deployments WHERE sales_engineer = ? ORDER BY created_at DESC",
            (sales_engineer,),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM deployments ORDER BY created_at DESC"
        ).fetchall()
    conn.close()
    results = []
    for row in rows:
        record = dict(row)
        if record.get("outputs"):
            record["outputs"] = json.loads(record["outputs"])
        results.append(record)
    return results


def update_status(deployment_id: str, status: str, error_message: Optional[str] = None):
    conn = get_connection()
    conn.execute(
        "UPDATE deployments SET status = ?, updated_at = ?, error_message = ? WHERE id = ?",
        (status, datetime.utcnow().isoformat(), error_message, deployment_id),
    )
    conn.commit()
    conn.close()


def update_deployment(deployment_id: str, updates: dict):
    if not updates:
        return
    set_clauses = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values())
    if "outputs" in updates and isinstance(updates["outputs"], dict):
        idx = list(updates.keys()).index("outputs")
        values[idx] = json.dumps(updates["outputs"])
    conn = get_connection()
    conn.execute(
        f"UPDATE deployments SET {set_clauses}, updated_at = ? WHERE id = ?",
        values + [datetime.utcnow().isoformat(), deployment_id],
    )
    conn.commit()
    conn.close()


def append_terraform_log(deployment_id: str, phase: str, stream: str, text: str):
    conn = get_connection()
    row = conn.execute(
        "SELECT terraform_logs FROM deployments WHERE id = ?", (deployment_id,)
    ).fetchone()
    if row is None:
        conn.close()
        return
    existing = json.loads(row["terraform_logs"]) if row["terraform_logs"] else []
    entry = {
        "phase": phase,
        "stream": stream,
        "text": text,
        "timestamp": datetime.utcnow().isoformat(),
    }
    existing.append(entry)
    conn.execute(
        "UPDATE deployments SET terraform_logs = ? WHERE id = ?",
        (json.dumps(existing), deployment_id),
    )
    conn.commit()
    conn.close()


def get_terraform_logs(deployment_id: str) -> list:
    conn = get_connection()
    row = conn.execute(
        "SELECT terraform_logs FROM deployments WHERE id = ?", (deployment_id,)
    ).fetchone()
    conn.close()
    if row is None or not row["terraform_logs"]:
        return []
    return json.loads(row["terraform_logs"])
