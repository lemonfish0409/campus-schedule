from fastapi import APIRouter, HTTPException, Query
from database import get_db

router = APIRouter(prefix="/api", tags=["courses"])

TIME_SLOTS = [
    ["08:00", "09:40"],
    ["10:00", "11:40"],
    ["12:30", "14:10"],
    ["14:30", "16:10"],
    ["16:30", "18:10"],
    ["19:30", "21:10"],
]


def _week_matches(weeks_str: str, target_week: int) -> bool:
    """Parse '1,3,5,7-12' format and check if target_week is covered."""
    if not weeks_str or not weeks_str.strip():
        return False

    parts = [p.strip() for p in weeks_str.split(",")]
    for part in parts:
        if "-" in part:
            try:
                start_str, end_str = part.split("-", 1)
                start = int(start_str.strip())
                end = int(end_str.strip())
                if start <= target_week <= end:
                    return True
            except ValueError:
                continue
        else:
            try:
                if int(part) == target_week:
                    return True
            except ValueError:
                continue
    return False


@router.get("/courses")
def list_courses(
    week: int = Query(None),
    day_of_week: int = Query(None),
):
    conn = get_db()
    cursor = conn.execute("SELECT * FROM courses")
    rows = cursor.fetchall()
    conn.close()

    result = [dict(row) for row in rows]

    if week is not None:
        result = [c for c in result if _week_matches(c["weeks"], week)]

    if day_of_week is not None:
        result = [c for c in result if c["day_of_week"] == day_of_week]

    return result


@router.post("/courses", status_code=201)
def create_course(body: dict):
    name = body.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    day_of_week = body.get("day_of_week", 1)
    start_time = body.get("start_time", "")
    end_time = body.get("end_time", "")
    location = body.get("location", "")
    weeks = body.get("weeks", "")
    remark = body.get("remark", "")

    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO courses (name, day_of_week, start_time, end_time, location, weeks, remark) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (name, day_of_week, start_time, end_time, location, weeks, remark),
    )
    conn.commit()
    course_id = cursor.lastrowid

    row = conn.execute("SELECT * FROM courses WHERE id = ?", (course_id,)).fetchone()
    conn.close()
    return dict(row)


@router.put("/courses/{course_id}")
def update_course(course_id: int, body: dict):
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM courses WHERE id = ?", (course_id,)
    ).fetchone()
    if existing is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Course not found")

    name = body.get("name", existing["name"])
    if isinstance(name, str) and not name.strip():
        conn.close()
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    day_of_week = body.get("day_of_week", existing["day_of_week"])
    start_time = body.get("start_time", existing["start_time"])
    end_time = body.get("end_time", existing["end_time"])
    location = body.get("location", existing["location"])
    weeks = body.get("weeks", existing["weeks"])
    remark = body.get("remark", existing["remark"])

    conn.execute(
        "UPDATE courses SET name = ?, day_of_week = ?, start_time = ?, end_time = ?, "
        "location = ?, weeks = ?, remark = ? WHERE id = ?",
        (name, day_of_week, start_time, end_time, location, weeks, remark, course_id),
    )
    conn.commit()

    row = conn.execute("SELECT * FROM courses WHERE id = ?", (course_id,)).fetchone()
    conn.close()
    return dict(row)


@router.delete("/courses/{course_id}")
def delete_course(course_id: int):
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM courses WHERE id = ?", (course_id,)
    ).fetchone()
    if existing is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Course not found")

    conn.execute("DELETE FROM courses WHERE id = ?", (course_id,))
    conn.commit()
    conn.close()
    return {"message": "Course deleted"}


@router.get("/time-slots")
def get_time_slots():
    return TIME_SLOTS


@router.get("/config")
def get_config():
    conn = get_db()
    cursor = conn.execute("SELECT * FROM config")
    rows = cursor.fetchall()
    conn.close()
    return {row["key"]: row["value"] for row in rows}


@router.put("/config")
def update_config(body: dict):
    conn = get_db()
    for key, value in body.items():
        conn.execute(
            "INSERT INTO config (key, value) VALUES (?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, str(value)),
        )
    conn.commit()

    cursor = conn.execute("SELECT * FROM config")
    rows = cursor.fetchall()
    conn.close()
    return {row["key"]: row["value"] for row in rows}
