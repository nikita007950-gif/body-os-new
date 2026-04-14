import os
import sqlite3
import logging
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = "/app/data"
os.makedirs(DATA_DIR, exist_ok=True)
DB = os.path.join(DATA_DIR, "body_os.db")


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

    cur.execute("""
        CREATE TABLE IF NOT EXISTS body_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            weight REAL,
            body_fat REAL,
            comment TEXT DEFAULT ''
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
    comment: str = ""


class BodyMetricRow(BaseModel):
    date: str
    weight: Optional[float] = None
    body_fat: Optional[float] = None
    comment: Optional[str] = ""


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health")
def health():
    ensure_db()
    return {"status": "ok"}


@app.post("/save")
def save_workout(data: List[WorkoutRow]):
    if not data:
        logger.warning("Save workout called with empty payload")
        raise HTTPException(status_code=400, detail="Empty workout payload")

    ensure_db()

    conn = None
    saved_rows = 0

    try:
        conn = get_conn()
        cur = conn.cursor()

        for item in data:
            if not item.date:
                raise HTTPException(status_code=400, detail="Field 'date' is required")
            if not item.workout_type:
                raise HTTPException(status_code=400, detail="Field 'workout_type' is required")
            if not item.exercise:
                raise HTTPException(status_code=400, detail="Field 'exercise' is required")

            reps_src = item.actual_reps or []
            weights_src = item.weights or []

            reps = reps_src[:4] + [""] * (4 - len(reps_src[:4]))
            weights = weights_src[:4] + [""] * (4 - len(weights_src[:4]))

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
                " / ".join(item.target_reps or []),
                reps[0],
                reps[1],
                reps[2],
                reps[3],
                weights[0],
                weights[1],
                weights[2],
                weights[3],
                item.comment or "",
            ))
            saved_rows += 1

        conn.commit()
        logger.info(
            "Workout saved successfully: rows=%s workout_type=%s date=%s",
            saved_rows,
            data[0].workout_type,
            data[0].date,
        )

        return {
            "status": "success",
            "message": "Workout saved",
            "saved_rows": saved_rows,
        }

    except HTTPException:
        if conn:
            conn.rollback()
        raise

    except Exception as e:
        if conn:
            conn.rollback()
        logger.exception("Failed to save workout: %s", e)
        raise HTTPException(status_code=500, detail="Failed to save workout")

    finally:
        if conn:
            conn.close()


@app.get("/workouts")
def get_workouts():
    ensure_db()

    conn = None

    try:
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

    except Exception as e:
        logger.exception("Failed to load workouts: %s", e)
        raise HTTPException(status_code=500, detail="Failed to load workouts")

    finally:
        if conn:
            conn.close()


@app.get("/last-workout/{workout_type}")
def get_last_workout(workout_type: str):
    ensure_db()

    conn = None

    try:
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

        result = []
        for row in rows:
            result.append({
                "exercise": row[0],
                "weights": [row[1], row[2], row[3], row[4]],
            })

        return result

    except Exception as e:
        logger.exception("Failed to load last workout: %s", e)
        raise HTTPException(status_code=500, detail="Failed to load last workout")

    finally:
        if conn:
            conn.close()


@app.get("/dashboard-summary")
def dashboard_summary():
    ensure_db()

    conn = None

    try:
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

        return {
            "last_workout_type": last_type,
            "last_workout_date": last_date,
            "exercise_count": exercise_count,
        }

    except Exception as e:
        logger.exception("Failed to load dashboard summary: %s", e)
        raise HTTPException(status_code=500, detail="Failed to load dashboard summary")

    finally:
        if conn:
            conn.close()


@app.post("/body-metrics")
def save_body_metric(data: BodyMetricRow):
    ensure_db()

    if not data.date:
        raise HTTPException(status_code=400, detail="Field 'date' is required")

    if data.weight is None and data.body_fat is None:
        raise HTTPException(
            status_code=400,
            detail="At least one of 'weight' or 'body_fat' is required",
        )

    conn = None

    try:
        conn = get_conn()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO body_metrics (date, weight, body_fat, comment)
            VALUES (?, ?, ?, ?)
        """, (
            data.date,
            data.weight,
            data.body_fat,
            data.comment or "",
        ))

        conn.commit()
        logger.info(
            "Body metric saved successfully: date=%s weight=%s body_fat=%s",
            data.date,
            data.weight,
            data.body_fat,
        )

        return {
            "status": "success",
            "message": "Body metric saved",
        }

    except HTTPException:
        if conn:
            conn.rollback()
        raise

    except Exception as e:
        if conn:
            conn.rollback()
        logger.exception("Failed to save body metric: %s", e)
        raise HTTPException(status_code=500, detail="Failed to save body metric")

    finally:
        if conn:
            conn.close()


@app.post("/body-metrics")
def save_body_metric(data: BodyMetricRow):
    ensure_db()

    if not data.date:
        raise HTTPException(status_code=400, detail="Field 'date' is required")

    if data.weight is None and data.body_fat is None:
        raise HTTPException(
            status_code=400,
            detail="At least one of 'weight' or 'body_fat' is required",
        )

    conn = None

    try:
        conn = get_conn()
        cur = conn.cursor()

        cur.execute("""
            SELECT id
            FROM body_metrics
            WHERE date = ?
            ORDER BY id DESC
            LIMIT 1
        """, (data.date,))
        existing = cur.fetchone()

        if existing:
            cur.execute("""
                UPDATE body_metrics
                SET weight = ?, body_fat = ?, comment = ?
                WHERE id = ?
            """, (
                data.weight,
                data.body_fat,
                data.comment or "",
                existing[0],
            ))
            action = "updated"
        else:
            cur.execute("""
                INSERT INTO body_metrics (date, weight, body_fat, comment)
                VALUES (?, ?, ?, ?)
            """, (
                data.date,
                data.weight,
                data.body_fat,
                data.comment or "",
            ))
            action = "created"

        conn.commit()
        logger.info(
            "Body metric %s successfully: date=%s weight=%s body_fat=%s",
            action,
            data.date,
            data.weight,
            data.body_fat,
        )

        return {
            "status": "success",
            "message": f"Body metric {action}",
            "action": action,
        }

    except HTTPException:
        if conn:
            conn.rollback()
        raise

    except Exception as e:
        if conn:
            conn.rollback()
        logger.exception("Failed to save body metric: %s", e)
        raise HTTPException(status_code=500, detail="Failed to save body metric")

    finally:
        if conn:
            conn.close()


@app.delete("/workouts")
def delete_all_workouts():
    ensure_db()

    conn = None

    try:
        conn = get_conn()
        cur = conn.cursor()

        cur.execute("DELETE FROM workouts")
        deleted = cur.rowcount

        conn.commit()

        return {"status": "ok", "deleted": deleted}

    except Exception as e:
        if conn:
            conn.rollback()
        logger.exception("Failed to delete workouts: %s", e)
        raise HTTPException(status_code=500, detail="Failed to delete workouts")

    finally:
        if conn:
            conn.close()