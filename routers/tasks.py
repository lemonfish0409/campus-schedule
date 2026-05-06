from fastapi import APIRouter, HTTPException, Query
from database import get_db

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("")
def list_tasks(
    date: str = Query(None),
    priority: int = Query(None),
):
    conn = get_db()
    query = "SELECT * FROM tasks WHERE 1=1"
    params = []

    if date is not None:
        query += " AND date = ?"
        params.append(date)

    if priority is not None:
        query += " AND priority = ?"
        params.append(priority)

    query += " ORDER BY is_completed ASC, priority ASC"

    cursor = conn.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


@router.post("", status_code=201)
def create_task(body: dict):
    title = body.get("title", "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Title cannot be empty")

    priority = body.get("priority", 2)
    date = body.get("date", "")

    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO tasks (title, priority, date) VALUES (?, ?, ?)",
        (title, priority, date),
    )
    conn.commit()
    task_id = cursor.lastrowid

    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    conn.close()
    return dict(row)


@router.put("/{task_id}")
def update_task(task_id: int, body: dict):
    conn = get_db()
    existing = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if existing is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")

    title = body.get("title", existing["title"])
    if isinstance(title, str) and not title.strip():
        conn.close()
        raise HTTPException(status_code=400, detail="Title cannot be empty")

    priority = body.get("priority", existing["priority"])
    date = body.get("date", existing["date"])
    is_completed = body.get("is_completed", existing["is_completed"])

    conn.execute(
        "UPDATE tasks SET title = ?, priority = ?, date = ?, is_completed = ? WHERE id = ?",
        (title, priority, date, is_completed, task_id),
    )
    conn.commit()

    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    conn.close()
    return dict(row)


@router.patch("/{task_id}/toggle")
def toggle_task(task_id: int):
    conn = get_db()
    existing = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if existing is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")

    new_status = 1 if existing["is_completed"] == 0 else 0
    conn.execute(
        "UPDATE tasks SET is_completed = ? WHERE id = ?",
        (new_status, task_id),
    )
    conn.commit()

    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    conn.close()
    return dict(row)


@router.delete("/{task_id}")
def delete_task(task_id: int):
    conn = get_db()
    existing = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if existing is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")

    conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return {"message": "Task deleted"}
