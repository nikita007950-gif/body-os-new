"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = "/api";

type HistoryRow = {
  id: number;
  date: string;
  type: string;
  exercise: string;
  target_reps: string;
  actual_reps: string[];
  weights: string[];
  comment: string;
};

type WorkoutGroup = {
  key: string;
  date: string;
  type: string;
  rows: HistoryRow[];
};

function cleanJoin(values: any[]) {
  return values
    .map((x) => String(x ?? "").trim())
    .filter((x) => x !== "")
    .join(" / ");
}

export default function HistoryPage() {
  const [data, setData] = useState<HistoryRow[]>([]);
  const [filter, setFilter] = useState<"All" | "Push" | "Pull" | "Legs">("All");

  useEffect(() => {
    console.log("API_URL =", API_URL);

    fetch(`${API_URL}/workouts`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((rows: HistoryRow[]) => setData(rows))
      .catch((err) => {
        console.error("History fetch error:", err);
        setData([]);
      });
  }, []);

  const filteredData = useMemo(() => {
    if (filter === "All") return data;
    return data.filter((row) => row.type === filter);
  }, [data, filter]);

  const groupedData = useMemo(() => {
    const groups = new Map<string, WorkoutGroup>();

    filteredData.forEach((row) => {
      const key = `${row.date}__${row.type}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          date: row.date,
          type: row.type,
          rows: [],
        });
      }

      groups.get(key)!.rows.push(row);
    });

    return Array.from(groups.values());
  }, [filteredData]);

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

      <div className="space-y-5">
        {groupedData.map((group) => (
          <section
            key={group.key}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            <div className="flex flex-col gap-2 border-b border-white/10 bg-white/[0.04] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-semibold text-white">
                  {group.type}
                </div>
                <div className="text-sm text-slate-400">{group.date}</div>
              </div>

              <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                {group.rows.length} упражнений
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
                      <td className="px-4 py-3">{row.exercise}</td>
                      <td className="px-4 py-3">{row.target_reps}</td>
                      <td className="px-4 py-3">{cleanJoin(row.actual_reps)}</td>
                      <td className="px-4 py-3">{cleanJoin(row.weights)}</td>
                      <td className="px-4 py-3">{row.comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {groupedData.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center text-slate-400">
            Записей по выбранному фильтру пока нет.
          </div>
        )}
      </div>
    </div>
  );
}