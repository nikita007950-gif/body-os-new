"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = "/api";

type HistoryRow = {
  id: number;
  date: string;
  type: string;
  exercise: string;
  target_reps: string;
  actual_reps: Array<string | number | null>;
  weights: Array<string | number | null>;
  comment: string | null;
};

type WorkoutGroup = {
  key: string;
  date: string;
  type: string;
  rows: HistoryRow[];
};

function cleanJoin(values: Array<string | number | null | undefined>) {
  return (values || [])
    .map((x) => String(x ?? "").trim())
    .filter((x) => x !== "")
    .join(" / ");
}

function safeText(value: string | number | null | undefined) {
  return String(value ?? "").trim();
}

export default function HistoryPage() {
  const [data, setData] = useState<HistoryRow[]>([]);
  const [filter, setFilter] = useState<"All" | "Push" | "Pull" | "Legs">("All");
  const [error, setError] = useState("");
  const [deletingKey, setDeletingKey] = useState("");

  async function loadHistory() {
    try {
      const res = await fetch(`${API_URL}/workouts`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const rows: HistoryRow[] = await res.json();
      setData(Array.isArray(rows) ? rows : []);
      setError("");
    } catch (err) {
      console.error("History fetch error:", err);
      setData([]);
      setError("Не удалось загрузить историю тренировок");
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredData = useMemo(() => {
    if (filter === "All") return data;
    return data.filter((row) => row.type === filter);
  }, [data, filter]);

  const groupedData = useMemo(() => {
    const groups = new Map<string, WorkoutGroup>();

    filteredData.forEach((row) => {
      const key = `${safeText(row.date)}__${safeText(row.type)}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          date: safeText(row.date),
          type: safeText(row.type),
          rows: [],
        });
      }

      groups.get(key)!.rows.push(row);
    });

    return Array.from(groups.values());
  }, [filteredData]);

  async function handleDeleteGroup(group: WorkoutGroup) {
    const ok = window.confirm(
      `Удалить тренировку ${group.type} от ${group.date}?`
    );

    if (!ok) return;

    try {
      setDeletingKey(group.key);

      const params = new URLSearchParams({
        date: group.date,
        workout_type: group.type,
      });

      const res = await fetch(`${API_URL}/workouts/by-group?${params.toString()}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setData((prev) =>
        prev.filter(
          (row) => !(safeText(row.date) === group.date && safeText(row.type) === group.type)
        )
      );
    } catch (err) {
      console.error("Delete workout error:", err);
      alert("Не удалось удалить тренировку");
    } finally {
      setDeletingKey("");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
          History
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          История тренировок
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Журнал по тренировкам, сгруппированный по дате и типу.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["All", "Push", "Pull", "Legs"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                filter === item
                  ? "bg-cyan-400 text-slate-950"
                  : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="space-y-5">
        {groupedData.map((group) => (
          <section
            key={group.key}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            <div className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.04] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-semibold text-white">
                  {safeText(group.type)}
                </div>
                <div className="text-sm text-slate-400">{safeText(group.date)}</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                  {group.rows.length} упражнений
                </div>

                <button
                  onClick={() => handleDeleteGroup(group)}
                  disabled={deletingKey === group.key}
                  className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingKey === group.key ? "Удаляю..." : "Удалить тренировку"}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Упражнение</th>
                    <th className="px-4 py-3 text-left font-medium">План</th>
                    <th className="px-4 py-3 text-left font-medium">Факт: повторы</th>
                    <th className="px-4 py-3 text-left font-medium">Факт: вес</th>
                    <th className="px-4 py-3 text-left font-medium">Комментарий</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-white/10 text-slate-200"
                    >
                      <td className="px-4 py-3">{safeText(row.exercise)}</td>
                      <td className="px-4 py-3">{safeText(row.target_reps)}</td>
                      <td className="px-4 py-3">{cleanJoin(row.actual_reps)}</td>
                      <td className="px-4 py-3">{cleanJoin(row.weights)}</td>
                      <td className="px-4 py-3">{safeText(row.comment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {!error && groupedData.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center text-slate-400">
            Записей по выбранному фильтру пока нет.
          </div>
        )}
      </div>
    </div>
  );
}