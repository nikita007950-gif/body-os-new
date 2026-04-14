"use client";

import {
  Dumbbell,
  Flame,
  History,
  Utensils,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cardioPlan, mealPlan } from "@/lib/body-data";

const API_URL = "/api";

type DashboardSummary = {
  last_workout_type: string | null;
  last_workout_date: string | null;
  exercise_count: number;
};

const reminders = [
  {
    title: "На следующую Push",
    text: "Жим в хаммере на дельты — начать чуть легче.",
  },
  {
    title: "На следующую Legs",
    text: "Сгибание ног сидя — можно брать тяжелее.",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/dashboard-summary`)
      .then((res) => res.json())
      .then((data: DashboardSummary) => setSummary(data))
      .catch(() => {
        setSummary({
          last_workout_type: null,
          last_workout_date: null,
          exercise_count: 0,
        });
      });
  }, []);

  const nextWorkout = useMemo(() => {
    const order = ["Push", "Pull", "Legs"];

    if (!summary?.last_workout_type) return "Push";

    const idx = order.indexOf(summary.last_workout_type);
    if (idx === -1) return "Push";

    return order[(idx + 1) % order.length];
  }, [summary]);

  const weeklyWorkouts = useMemo(() => {
    if (!summary?.last_workout_date) return "—";
    return "1";
  }, [summary]);

  const metrics = [
    {
      label: "Следующая тренировка",
      value: nextWorkout,
      hint:
        nextWorkout === "Push"
          ? "Грудь · плечи · трицепс"
          : nextWorkout === "Pull"
          ? "Спина · бицепс"
          : "Ноги · корпус",
      icon: Dumbbell,
    },
    {
      label: "Последняя тренировка",
      value:
        summary?.last_workout_type && summary?.last_workout_date
          ? `${summary.last_workout_type} · ${summary.last_workout_date}`
          : "Пока нет записей",
      hint:
        summary?.exercise_count && summary.exercise_count > 0
          ? `${summary.exercise_count} упражнений`
          : "Сохрани первую тренировку",
      icon: History,
    },
    {
      label: "Кардио",
      value: cardioPlan,
      hint: "Текущий план",
      icon: Flame,
    },
    {
      label: "Питание",
      value: `${mealPlan.length} приема`,
      hint: "Текущий план питания",
      icon: Utensils,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-slate-400">Дашборд</div>
          <div className="text-base font-medium text-slate-200">
            Сегодня · {new Date().toLocaleDateString("ru-RU")}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.push("/body")}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Добавить вес
          </button>
          <button
            onClick={() => router.push("/workouts")}
            className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Записать тренировку
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <MetricCard
            key={item.label}
            label={item.label}
            value={item.value}
            hint={item.hint}
            icon={item.icon}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Вес и состав тела" action="Открыть журнал">
          <div className="grid gap-4 md:grid-cols-2">
            <GraphPlaceholder
              title="Вес"
              value="Скоро"
              hint="Линейный график по датам"
              onClick={() => router.push("/body")}
            />
            <GraphPlaceholder
              title="% жира"
              value="Скоро"
              hint="Линейный график по датам"
              onClick={() => router.push("/body")}
            />
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Напоминания">
            <div className="space-y-3">
              {reminders.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4"
                >
                  <div className="mb-1 text-sm font-medium text-cyan-200">
                    {item.title}
                  </div>
                  <div className="text-sm leading-6 text-slate-300">
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Кратко">
            <div className="space-y-3">
              <CompactRow
                label="Следующая"
                value={nextWorkout}
              />
              <CompactRow
                label="Последняя"
                value={
                  summary?.last_workout_type && summary?.last_workout_date
                    ? `${summary.last_workout_type} · ${summary.last_workout_date}`
                    : "Нет данных"
                }
              />
              <CompactRow
                label="За неделю"
                value={`${weeklyWorkouts} трен.`}
              />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-black/10">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-400">{label}</div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2">
          <Icon className="h-4 w-4 text-cyan-300" />
        </div>
      </div>
      <div className="mb-1 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-sm text-slate-500">{hint}</div>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {action ? (
          <span className="text-sm text-slate-400">{action}</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function GraphPlaceholder({
  title,
  value,
  hint,
  onClick,
}: {
  title: string;
  value: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:bg-white/[0.05]"
    >
      <div className="mb-2 text-sm text-slate-400">{title}</div>
      <div className="mb-1 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-sm text-slate-500">{hint}</div>

      <div className="mt-5 h-32 rounded-xl border border-dashed border-cyan-400/20 bg-cyan-400/[0.03] flex items-center justify-center text-sm text-slate-500">
        Здесь будет график
      </div>
    </button>
  );
}

function CompactRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-100">{value}</span>
    </div>
  );
}