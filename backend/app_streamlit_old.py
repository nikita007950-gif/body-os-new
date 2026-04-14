import sqlite3
from pathlib import Path
from datetime import date, datetime

import pandas as pd
import streamlit as st

st.set_page_config(
    page_title="Body OS",
    page_icon="💪",
    layout="wide",
    initial_sidebar_state="expanded",
)

# =========================
# AUTH
# =========================
def check_auth():
    if "auth" not in st.session_state:
        st.session_state.auth = False

    if not st.session_state.auth:
        st.markdown(
            """
            <div style="max-width:420px;margin:80px auto 0 auto;padding:28px;
                        border:1px solid #1f2937;border-radius:20px;background:#111827;">
                <h1 style="margin:0 0 8px 0;">🔐 Body OS</h1>
                <p style="color:#9ca3af;margin:0;">Вход в приложение</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        username = st.text_input("Логин")
        password = st.text_input("Пароль", type="password")

        if st.button("Войти", use_container_width=True):
            if username == "nikita" and password == "784326":
                st.session_state.auth = True
                st.rerun()
            else:
                st.error("Неверный логин или пароль")

        st.stop()


check_auth()

# =========================
# STYLES
# =========================
st.markdown(
    """
    <style>
    .stApp {
        background: #0b1020;
        color: #e5e7eb;
    }

    .block-container {
        max-width: 1200px;
        padding-top: 1.5rem;
        padding-bottom: 2rem;
    }

    section[data-testid="stSidebar"] {
        background: #0f172a;
        border-right: 1px solid #1e293b;
    }

    .hero {
        background: linear-gradient(135deg, #111827 0%, #172554 100%);
        border: 1px solid #1f2937;
        border-radius: 24px;
        padding: 28px;
        margin-bottom: 20px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.22);
    }

    .hero-title {
        font-size: 40px;
        font-weight: 800;
        margin-bottom: 6px;
    }

    .hero-subtitle {
        font-size: 15px;
        color: #cbd5e1;
        margin-bottom: 16px;
    }

    .pill {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        color: #dbeafe;
        background: rgba(59, 130, 246, 0.18);
        border: 1px solid rgba(96, 165, 250, 0.25);
        margin-right: 8px;
        margin-bottom: 8px;
    }

    .card {
        background: #111827;
        border: 1px solid #1f2937;
        border-radius: 20px;
        padding: 18px;
        margin-bottom: 16px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    }

    .card-soft {
        background: linear-gradient(135deg, #111827 0%, #1e293b 100%);
        border: 1px solid #334155;
        border-radius: 20px;
        padding: 18px;
        margin-bottom: 16px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    }

    .section-title {
        font-size: 20px;
        font-weight: 800;
        margin-bottom: 10px;
    }

    .muted {
        color: #94a3b8;
        font-size: 14px;
    }

    .note-box {
        background: rgba(37, 99, 235, 0.18);
        color: #dbeafe;
        border: 1px solid rgba(96, 165, 250, 0.28);
        padding: 12px 14px;
        border-radius: 14px;
        margin: 10px 0 14px 0;
        font-size: 14px;
    }

    .warn-box {
        background: rgba(245, 158, 11, 0.16);
        color: #fde68a;
        border: 1px solid rgba(251, 191, 36, 0.28);
        padding: 12px 14px;
        border-radius: 14px;
        margin: 10px 0 14px 0;
        font-size: 14px;
    }

    .meal-card {
        background: linear-gradient(135deg, #111827 0%, #1e293b 100%);
        border: 1px solid #334155;
        border-radius: 22px;
        padding: 20px;
        min-height: 220px;
        margin-bottom: 16px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    }

    .meal-title {
        font-size: 18px;
        font-weight: 800;
        margin-bottom: 12px;
    }

    .badge {
        display: inline-block;
        padding: 5px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        background: rgba(148, 163, 184, 0.16);
        color: #e2e8f0;
        border: 1px solid rgba(148, 163, 184, 0.18);
        margin-bottom: 12px;
    }

    .exercise-header {
        font-size: 20px;
        font-weight: 800;
        margin-bottom: 4px;
    }

    .exercise-sub {
        color: #94a3b8;
        font-size: 14px;
        margin-bottom: 12px;
    }

    .footer-tip {
        color: #94a3b8;
        font-size: 13px;
        margin-top: 8px;
    }

    div[data-testid="stMetric"] {
        background: #111827;
        border: 1px solid #1f2937;
        padding: 14px 16px;
        border-radius: 18px;
    }

    div[data-testid="stDataFrame"] {
        border-radius: 18px;
        overflow: hidden;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# =========================
# DATA
# =========================
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = str(DATA_DIR / "body_os.db")

MEAL_PLAN = [
    {
        "meal": "Прием 1",
        "items": [
            "2 цельных яйца",
            "60 г овсянки / рисовых хлопьев / кукурузных хлопьев",
            "30 г протеина",
            "0.5 авокадо",
        ],
    },
    {
        "meal": "Прием 2",
        "items": [
            "150 г индейки / курицы / белой рыбы",
            "80 г риса (жасмин / басмати) или макарон из твердых сортов",
            "10 г оливкового масла",
        ],
    },
    {
        "meal": "Прием 3",
        "items": [
            "220 г говядины",
            "60 г риса (жасмин / басмати) или макарон из твердых сортов",
            "150 г брокколи / готового шпината",
        ],
    },
    {
        "meal": "Прием 4",
        "items": [
            "40 г протеина",
            "16 г арахисовой / миндальной пасты",
        ],
    },
]

CARDIO_PLAN = "Кардио: 5 раз в неделю по 45 минут"

WORKOUT_TEMPLATES = {
    "Push": [
        {"exercise": "Сведение рук в тренажере бабочка", "reps": "15 / 15 / 12", "weights": [36.0, 41.0, 45.0], "note": ""},
        {"exercise": "Жим гантелей лежа 30°", "reps": "15 / 12 / 10", "weights": [16.0, 18.0, 20.0], "note": ""},
        {"exercise": "Жим в тренажере сидя на грудь", "reps": "15 / 12 / 10", "weights": [27.0, 32.0, 36.0], "note": ""},
        {"exercise": "Отведение гантелей в стороны", "reps": "15 / 15 / 12", "weights": [7.0, 8.0, 9.0], "note": ""},
        {"exercise": "Жим в тренажере хаммер на дельты", "reps": "15 / 12 / 10", "weights": [9.0, 14.0, 18.0], "note": "Начать чуть легче: в прошлый раз первый сет зашел тяжеловато."},
        {"exercise": "Разгибание V-образной рукояти в блоке", "reps": "15 / 15 / 12", "weights": [11.3, 13.5, 15.8], "note": ""},
        {"exercise": "Отжимания на брусьях в гравитроне", "reps": "12 / 12 / 10", "weights": [23.0, 18.0, 14.0], "note": "Вес помощи в гравитроне: меньше помощь = тяжелее."},
    ],
    "Pull": [
        {"exercise": "Тяга верхнего блока, хват чуть шире плеч", "reps": "15 / 15 / 12", "weights": [32.0, 39.0, 45.0], "note": ""},
        {"exercise": "Тяга верхнего блока с V-образной рукоятью", "reps": "15 / 12 / 10", "weights": [39.0, 45.0, 52.0], "note": ""},
        {"exercise": "Тяга горизонтального блока с V-образной рукоятью", "reps": "15 / 12 / 10", "weights": [39.0, 45.0, 52.0], "note": ""},
        {"exercise": "Разведение рук сидя в бабочке на заднюю дельту", "reps": "15 / 15 / 12", "weights": [23.0, 27.0, 29.2], "note": ""},
        {"exercise": "Сгибание рук сидя в тренажере Скота", "reps": "15 / 12 / 12", "weights": [14.0, 14.0, 14.0], "note": ""},
        {"exercise": "Сгибание рук стоя с Z-образным грифом", "reps": "12 / 12 / 10", "weights": [10.0, 10.0, 10.0], "note": ""},
    ],
    "Legs": [
        {"exercise": "Разгибания сидя в тренажере", "reps": "18 / 15 / 15 / 12", "weights": [35.3, 38.3, 43.3, 47.3], "note": ""},
        {"exercise": "Жим ногами", "reps": "15 / 12 / 10", "weights": [100.0, 120.0, 140.0], "note": ""},
        {"exercise": "Сгибание ног сидя", "reps": "15 / 15 / 12", "weights": [27.0, 32.0, 36.0], "note": "В прошлый раз было легко: можно взять тяжелее."},
        {"exercise": "Сгибание ног лежа", "reps": "15 / 12 / 12", "weights": [27.0, 32.0, 36.0], "note": ""},
        {"exercise": "Отведение гантелей в стороны", "reps": "15 / 15 / 12", "weights": [7.0, 8.0, 9.0], "note": ""},
        {"exercise": "Тяга штанги к груди", "reps": "15 / 12 / 12", "weights": [20.0, 25.0, 25.0], "note": ""},
    ],
}

# =========================
# DB
# =========================
def get_conn():
    return sqlite3.connect(DB_PATH, check_same_thread=False)


def init_db():
    conn = get_conn()
    c = conn.cursor()

    c.execute(
        """
        CREATE TABLE IF NOT EXISTS workouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            workout_type TEXT,
            exercise TEXT,
            target_reps TEXT,
            w1 REAL,
            w2 REAL,
            w3 REAL,
            w4 REAL,
            comment TEXT,
            created_at TEXT
        )
        """
    )

    c.execute(
        """
        CREATE TABLE IF NOT EXISTS exercise_notes (
            exercise TEXT PRIMARY KEY,
            note TEXT
        )
        """
    )

    conn.commit()

    for workout_type in WORKOUT_TEMPLATES:
        for ex in WORKOUT_TEMPLATES[workout_type]:
            c.execute(
                "INSERT OR IGNORE INTO exercise_notes (exercise, note) VALUES (?, ?)",
                (ex["exercise"], ex["note"]),
            )

    conn.commit()
    conn.close()


init_db()

# =========================
# HELPERS
# =========================
def get_note(exercise_name: str) -> str:
    conn = get_conn()
    df = pd.read_sql(
        "SELECT note FROM exercise_notes WHERE exercise = ?",
        conn,
        params=(exercise_name,),
    )
    conn.close()
    if df.empty:
        return ""
    return str(df.iloc[0]["note"])


def save_note(exercise_name: str, note: str):
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        """
        INSERT INTO exercise_notes (exercise, note)
        VALUES (?, ?)
        ON CONFLICT(exercise) DO UPDATE SET note = excluded.note
        """,
        (exercise_name, note),
    )
    conn.commit()
    conn.close()


def get_last_logs(limit=30):
    conn = get_conn()
    df = pd.read_sql(
        """
        SELECT date, workout_type, exercise, target_reps, w1, w2, w3, w4, comment
        FROM workouts
        ORDER BY date DESC, id DESC
        LIMIT ?
        """,
        conn,
        params=(limit,),
    )
    conn.close()
    return df


def get_last_exercise(exercise_name: str):
    conn = get_conn()
    df = pd.read_sql(
        """
        SELECT w1, w2, w3, w4, comment, date
        FROM workouts
        WHERE exercise = ?
        ORDER BY date DESC, id DESC
        LIMIT 1
        """,
        conn,
        params=(exercise_name,),
    )
    conn.close()

    if df.empty:
        return None
    return df.iloc[0]


def save_workout_rows(rows):
    conn = get_conn()
    c = conn.cursor()
    c.executemany(
        """
        INSERT INTO workouts (
            date, workout_type, exercise, target_reps,
            w1, w2, w3, w4, comment, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )
    conn.commit()
    conn.close()


def format_weight(value):
    if value is None or pd.isna(value):
        return "—"
    return str(value).replace(".", ",")


def count_total_exercises():
    return sum(len(v) for v in WORKOUT_TEMPLATES.values())


def count_meals():
    return len(MEAL_PLAN)


def last_workout_summary():
    history = get_last_logs(1)
    if history.empty:
        return "Нет записей"
    row = history.iloc[0]
    return f"{row['workout_type']} · {row['date']}"


def render_hero():
    st.markdown(
        f"""
        <div class="hero">
            <div class="hero-title">Body OS</div>
            <div class="hero-subtitle">
                Тренировки, питание и прогресс — в одном месте.
            </div>
            <span class="pill">PPL</span>
            <span class="pill">{CARDIO_PLAN}</span>
            <span class="pill">{count_meals()} приема пищи</span>
            <span class="pill">{count_total_exercises()} упражнений</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

# =========================
# SIDEBAR
# =========================
st.sidebar.markdown("## Body OS")
st.sidebar.caption("Личный фитнес-трекер")

page = st.sidebar.radio(
    "Навигация",
    ["📊 Дашборд", "🍽️ Meal Plan", "🏋️ Тренировки", "📜 История"],
)

if st.sidebar.button("Выйти", use_container_width=True):
    st.session_state.auth = False
    st.rerun()

st.sidebar.markdown("---")
st.sidebar.caption("Среда")
st.sidebar.write("Windows + GitHub + Yandex Cloud")

# =========================
# DASHBOARD
# =========================
if page == "📊 Дашборд":
    render_hero()

    c1, c2, c3 = st.columns(3)
    with c1:
        st.metric("Последняя тренировка", last_workout_summary())
    with c2:
        st.metric("Кардио", "5 × 45 мин")
    with c3:
        st.metric("Meal plan", f"{count_meals()} приема")

    left, right = st.columns([1.35, 1])

    with left:
        st.markdown('<div class="card-soft">', unsafe_allow_html=True)
        st.markdown('<div class="section-title">Последние записи</div>', unsafe_allow_html=True)
        history = get_last_logs(10)
        if history.empty:
            st.markdown('<div class="muted">Пока нет сохраненных тренировок.</div>', unsafe_allow_html=True)
        else:
            st.dataframe(history, use_container_width=True, hide_index=True)
        st.markdown("</div>", unsafe_allow_html=True)

    with right:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown('<div class="section-title">Фокус</div>', unsafe_allow_html=True)
        st.write("Тренировки по реальному PPL-сплиту")
        st.write("Meal plan вынесен в отдельный раздел")
        st.write("История весов сохраняется")
        st.markdown("</div>", unsafe_allow_html=True)

        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown('<div class="section-title">Напоминания</div>', unsafe_allow_html=True)
        st.markdown('<div class="note-box">Жим в хаммере на дельты — начать чуть легче.</div>', unsafe_allow_html=True)
        st.markdown('<div class="note-box">Сгибание ног сидя — можно брать тяжелее.</div>', unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

# =========================
# MEAL PLAN
# =========================
elif page == "🍽️ Meal Plan":
    render_hero()
    st.markdown("## Meal Plan")
    st.caption("Текущий фиксированный план питания")

    cols = st.columns(2)
    for i, meal in enumerate(MEAL_PLAN):
        items_html = "".join([f"<li>{item}</li>" for item in meal["items"]])
        with cols[i % 2]:
            st.markdown(
                f"""
                <div class="meal-card">
                    <div class="badge">{meal['meal']}</div>
                    <div class="meal-title">{meal['meal']}</div>
                    <ul>{items_html}</ul>
                </div>
                """,
                unsafe_allow_html=True,
            )

    st.markdown(f'<div class="warn-box">{CARDIO_PLAN}</div>', unsafe_allow_html=True)

# =========================
# WORKOUTS
# =========================
elif page == "🏋️ Тренировки":
    render_hero()
    st.markdown("## Тренировки")
    st.caption("Последние веса подставляются автоматически")

    top1, top2 = st.columns([1, 1])
    with top1:
        workout_type = st.selectbox("Тип тренировки", ["Push", "Pull", "Legs"])
    with top2:
        workout_date = st.date_input("Дата", value=date.today())

    exercises = WORKOUT_TEMPLATES[workout_type]
    rows_to_save = []

    with st.form(f"form_{workout_type}"):
        for idx, ex in enumerate(exercises, start=1):
            last = get_last_exercise(ex["exercise"])
            if last is not None:
                default_weights = [last["w1"], last["w2"], last["w3"], last["w4"]]
                last_comment = "" if pd.isna(last["comment"]) else str(last["comment"])
                last_date = str(last["date"])
            else:
                default_weights = ex["weights"] + [None] * (4 - len(ex["weights"]))
                last_comment = ""
                last_date = None

            note = get_note(ex["exercise"])

            st.markdown('<div class="card">', unsafe_allow_html=True)
            st.markdown(f'<div class="exercise-header">{idx}. {ex["exercise"]}</div>', unsafe_allow_html=True)
            st.markdown(f'<div class="exercise-sub">Целевые повторы: {ex["reps"]}</div>', unsafe_allow_html=True)

            if last_date:
                st.caption(
                    f"Последняя запись: {last_date} · "
                    f"{format_weight(default_weights[0])} / {format_weight(default_weights[1])} / "
                    f"{format_weight(default_weights[2])} / {format_weight(default_weights[3])}"
                )
            else:
                st.caption("Истории пока нет — используются стартовые веса из шаблона")

            if note:
                st.markdown(f'<div class="note-box">{note}</div>', unsafe_allow_html=True)

            cols = st.columns(4)
            w1 = cols[0].number_input("Вес 1", min_value=0.0, value=float(default_weights[0] or 0.0), step=0.5, key=f"{ex['exercise']}_w1")
            w2 = cols[1].number_input("Вес 2", min_value=0.0, value=float(default_weights[1] or 0.0), step=0.5, key=f"{ex['exercise']}_w2")
            w3 = cols[2].number_input("Вес 3", min_value=0.0, value=float(default_weights[2] or 0.0), step=0.5, key=f"{ex['exercise']}_w3")
            w4 = cols[3].number_input("Вес 4", min_value=0.0, value=float(default_weights[3] or 0.0), step=0.5, key=f"{ex['exercise']}_w4")

            comment_default = note if note else last_comment
            comment = st.text_input(
                "Комментарий",
                value=comment_default,
                placeholder="Комментарий на тренировку",
                key=f"{ex['exercise']}_comment",
            )

            rows_to_save.append(
                (
                    str(workout_date),
                    workout_type,
                    ex["exercise"],
                    ex["reps"],
                    w1 if w1 > 0 else None,
                    w2 if w2 > 0 else None,
                    w3 if w3 > 0 else None,
                    w4 if w4 > 0 else None,
                    comment,
                    datetime.now().isoformat(timespec="seconds"),
                )
            )

            st.markdown("</div>", unsafe_allow_html=True)

        submitted = st.form_submit_button("Сохранить тренировку", use_container_width=True)

    if submitted:
        save_workout_rows(rows_to_save)
        for ex, row in zip(exercises, rows_to_save):
            save_note(ex["exercise"], row[8] or "")
        st.success("Тренировка сохранена")

# =========================
# HISTORY
# =========================
else:
    render_hero()
    st.markdown("## История тренировок")
    st.caption("Все сохраненные записи и текущие рабочие веса")

    filter_col1, filter_col2 = st.columns([1, 2])
    with filter_col1:
        selected_type = st.selectbox("Фильтр", ["All", "Push", "Pull", "Legs"])
    with filter_col2:
        limit = st.slider("Сколько записей показать", min_value=10, max_value=200, value=50, step=10)

    history = get_last_logs(limit)

    if selected_type != "All" and not history.empty:
        history = history[history["workout_type"] == selected_type]

    st.markdown('<div class="card-soft">', unsafe_allow_html=True)
    st.markdown('<div class="section-title">История</div>', unsafe_allow_html=True)
    if history.empty:
        st.markdown('<div class="muted">Пока нет истории.</div>', unsafe_allow_html=True)
    else:
        st.dataframe(history, use_container_width=True, hide_index=True)
    st.markdown("</div>", unsafe_allow_html=True)

    st.markdown("### Текущие рабочие веса")

    for workout_type, exercises in WORKOUT_TEMPLATES.items():
        st.markdown(f"#### {workout_type}")
        rows = []
        for ex in exercises:
            last = get_last_exercise(ex["exercise"])
            if last is not None:
                weights = [last["w1"], last["w2"], last["w3"], last["w4"]]
            else:
                weights = ex["weights"] + [None] * (4 - len(ex["weights"]))

            rows.append(
                {
                    "Упражнение": ex["exercise"],
                    "Повторы": ex["reps"],
                    "Вес 1": format_weight(weights[0]),
                    "Вес 2": format_weight(weights[1]),
                    "Вес 3": format_weight(weights[2]),
                    "Вес 4": format_weight(weights[3]),
                    "Комментарий": get_note(ex["exercise"]),
                }
            )

        st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)
        st.markdown('<div class="footer-tip">Тут отображаются последние сохраненные веса по каждому упражнению.</div>', unsafe_allow_html=True)