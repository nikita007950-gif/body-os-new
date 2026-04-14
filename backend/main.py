from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB = "body_os.db"


def get_conn():
    return sqlite3.connect(DB)


def ensure_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS workouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            workout_type TEXT,
            exercise TEXT,
            target_reps TEXT,
            r1 TEXT,
            r2 TEXT,
            r3 TEXT,
            r4 TEXT,
            w1 TEXT,
            w2 TEXT,
            w3 TEXT,
            w4 TEXT,
            comment TEXT
        )
    """)

    conn.commit()
    conn.close()


class WorkoutRow(BaseModel):
    date: str
    workout_type: str
    exercise: str
    target_reps: List[str]
    actual_reps: List[str]
    weights: List[str]
    comment: str


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health")
def health():
    ensure_db()
    return {"status": "ok"}


@app.post("/save")
def save_workout(data: List[WorkoutRow]):
    ensure_db()

    conn = get_conn()
    cur = conn.cursor()

    for item in data:
        reps = item.actual_reps + [""] * (4 - len(item.actual_reps))
        weights = item.weights + [""] * (4 - len(item.weights))

        cur.execute("""
            INSERT INTO workouts (
                date, workout_type, exercise, target_reps,
                r1, r2, r3, r4,
                w1, w2, w3, w4,
                comment
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item.date,
            item.workout_type,
            item.exercise,
            " / ".join(item.target_reps),
            reps[0],
            reps[1],
            reps[2],
            reps[3],
            weights[0],
            weights[1],
            weights[2],
            weights[3],
            item.comment,
        ))

    conn.commit()
    conn.close()

    return {"status": "saved"}


@app.get("/workouts")
def get_workouts():
    ensure_db()

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            date,
            workout_type,
            exercise,
            target_reps,
            r1, r2, r3, r4,
            w1, w2, w3, w4,
            comment
        FROM workouts
        ORDER BY date DESC, id DESC
        LIMIT 200
    """)

    rows = cur.fetchall()
    conn.close()

    result = []
    for row in rows:
        result.append({
            "id": row[0],
            "date": row[1],
            "type": row[2],
            "exercise": row[3],
            "target_reps": row[4],
            "actual_reps": [row[5], row[6], row[7], row[8]],
            "weights": [row[9], row[10], row[11], row[12]],
            "comment": row[13],
        })

    return result


@app.get("/last-workout/{workout_type}")
def get_last_workout(workout_type: str):
    ensure_db()

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            exercise,
            w1, w2, w3, w4
        FROM workouts
        WHERE workout_type = ?
          AND date = (
              SELECT MAX(date)
              FROM workouts
              WHERE workout_type = ?
          )
        ORDER BY id ASC
    """, (workout_type, workout_type))

    rows = cur.fetchall()
    conn.close()

    result = []
    for row in rows:
        result.append({
            "exercise": row[0],
            "weights": [row[1], row[2], row[3], row[4]],
        })

    return result


@app.get("/dashboard-summary")
def dashboard_summary():
    ensure_db()

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT date, workout_type
        FROM workouts
        ORDER BY date DESC, id DESC
        LIMIT 1
    """)
    last_row = cur.fetchone()

    if not last_row:
        conn.close()
        return {
            "last_workout_type": None,
            "last_workout_date": None,
            "exercise_count": 0,
        }

    last_date = last_row[0]
    last_type = last_row[1]

    cur.execute("""
        SELECT COUNT(*)
        FROM workouts
        WHERE date = ? AND workout_type = ?
    """, (last_date, last_type))

    exercise_count = cur.fetchone()[0]
    conn.close()

    return {
        "last_workout_type": last_type,
        "last_workout_date": last_date,
        "exercise_count": exercise_count,
    }


@app.delete("/workouts")
def delete_all_workouts():
    ensure_db()

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("DELETE FROM workouts")
    deleted = cur.rowcount

    conn.commit()
    conn.close()

    return {"status": "ok", "deleted": deleted}