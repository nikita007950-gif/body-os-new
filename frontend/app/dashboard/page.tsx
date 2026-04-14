"use client";

import {
  Dumbbell,
  Flame,
  History,
  Utensils,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cardioPlan, mealPlan } from "@/lib/body-data";

const API_URL = "/api";

type DashboardSummary = {
  last_workout_type: string | null;
  last_workout_date: string | null;
  exercise_count: number;
};

type BodyMetric = {
  date: string;
  weight: number | null;
  body_fat: number | null;
  comment: string;
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
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/dashboard-summary`)
      .then((res) => res.json())
      .then(setSummary)
      .catch(() => {
        setSummary({
          last_workout_type: null,
          last_workout_date: null,
          exercise_count: 0,
        });
      });

    fetch(`${API_URL}/body-metrics`)
      .then((res) => res.json())
      .then(setBodyMetrics)
      .catch(() => setBodyMetrics([]));
  }, []);

  const nextWorkout = useMemo(() => {
    const order = ["Push", "Pull", "Legs"];
    if (!summary?.last_workout_type) return "Push";
    const idx = order.indexOf(summary.last_workout_type);
    return order[(idx + 1) % order.length];
  }, [summary]);

  const chartData = useMemo(() => {
    return bodyMetrics.map((item) => ({
      date: formatShortDate(item.date),
      weight: item.weight,
      body_fat: item.body_fat,
    }));
  }, [bodyMetrics]);

  const lastWeight =
    [...bodyMetrics].reverse().find((x) => x.weight !== null)?.weight ?? null;

  const lastBodyFat =
    [...bodyMetrics].reverse().find((x) => x.body_fat !== null)?.body_fat ?? null;

  return (
    <div className="space-y-6">
      <Header router={router} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Следующая" value={nextWorkout} icon={Dumbbell} />
        <MetricCard
          label="Последняя"
          value={
            summary?.last_workout_type
              ? `${summary.last_workout_type} · ${summary.last_workout_date}`
              : "Нет данных"
          }
          icon={History}
        />
        <MetricCard
          label="Вес"
          value={lastWeight ? `${lastWeight} кг` : "—"}
          icon={Flame}
        />
        <MetricCard
          label="Жир"
          value={lastBodyFat ? `${lastBodyFat}%` : "—"}
          icon={Utensils}
        />
      </div>

      <Panel title="Вес и состав тела">
        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard title="Вес">
            <MetricChart data={chartData} dataKey="weight" unit="кг" />
          </ChartCard>

          <ChartCard title="% жира">
            <MetricChart data={chartData} dataKey="body_fat" unit="%" />
          </ChartCard>
        </div>
      </Panel>

      <Panel title="Напоминания">
        <div className="space-y-3">
          {reminders.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4"
            >
              <div className="text-sm font-medium text-cyan-200">
                {item.title}
              </div>
              <div className="text-sm text-slate-300">{item.text}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Header({ router }: { router: any }) {
  return (
    <div className="flex justify-between">
      <div>
        <div className="text-sm text-slate-400">Дашборд</div>
        <div className="text-base text-slate-200">
          Сегодня · {new Date().toLocaleDateString("ru-RU")}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => router.push("/body")}
          className="px-4 py-2 border border-white/10 rounded-xl"
        >
          Добавить вес
        </button>
        <button
          onClick={() => router.push("/workouts")}
          className="px-4 py-2 bg-cyan-400 rounded-xl text-black"
        >
          Записать тренировку
        </button>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: any) {
  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/5">
      <div className="flex justify-between">
        <span className="text-slate-400 text-sm">{label}</span>
        <Icon className="w-4 h-4 text-cyan-300" />
      </div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function Panel({ title, children }: any) {
  return (
    <div className="p-5 border border-white/10 rounded-2xl">
      <h2 className="mb-4">{title}</h2>
      {children}
    </div>
  );
}

function ChartCard({ title, children }: any) {
  return (
    <div className="p-4 border border-white/10 rounded-xl">
      <div className="mb-2 text-sm text-slate-400">{title}</div>
      <div className="h-40">{children}</div>
    </div>
  );
}

function MetricChart({ data, dataKey, unit }: any) {
  const valid = data.filter((x: any) => x[dataKey] !== null);

  if (!valid.length) {
    return <div className="text-slate-500 text-sm">Нет данных</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={valid}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip
          formatter={(value: any) => [String(value) + " " + unit, "Значение"]}
        />
        <Line dataKey={dataKey} stroke="#22d3ee" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function formatShortDate(value: string) {
  const d = new Date(value);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}