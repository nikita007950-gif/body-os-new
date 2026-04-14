"use client";

import { Dumbbell, Flame, History, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load body metrics");
        }
        return res.json();
      })
      .then(setBodyMetrics)
      .catch(() => setBodyMetrics([]));
  }, []);

  const nextWorkout = useMemo(() => {
    const order = ["Push", "Pull", "Legs"];
    if (!summary?.last_workout_type) return "Push";

    const idx = order.indexOf(summary.last_workout_type);
    if (idx === -1) return "Push";

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
          value={lastWeight !== null ? `${lastWeight} кг` : "—"}
          icon={Flame}
        />
        <MetricCard
          label="Жир"
          value={lastBodyFat !== null ? `${lastBodyFat}%` : "—"}
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
              className="rounded-3xl border border-pink-100 bg-pink-50 p-4"
            >
              <div className="text-sm font-semibold text-pink-700">
                {item.title}
              </div>
              <div className="mt-1 text-sm text-gray-600">{item.text}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Header({ router }: { router: any }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm text-gray-500">Дашборд</div>
        <div className="text-lg font-semibold text-gray-900">
          Сегодня · {new Date().toLocaleDateString("ru-RU")}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => router.push("/body")}
          className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-pink-50 hover:text-pink-600"
        >
          Добавить вес
        </button>
        <button
          onClick={() => router.push("/workouts")}
          className="rounded-2xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-400"
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
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        <Icon className="h-4 w-4 text-pink-500" />
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-gray-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-[#fcfcfe] p-4">
      <div className="mb-3 text-sm font-medium text-gray-600">{title}</div>
      <div className="h-44">{children}</div>
    </div>
  );
}

function MetricChart({
  data,
  dataKey,
  unit,
}: {
  data: Array<{
    date: string;
    weight: number | null;
    body_fat: number | null;
  }>;
  dataKey: "weight" | "body_fat";
  unit: string;
}) {
  const valid = data.filter((x) => x[dataKey] !== null);

  if (!valid.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Нет данных
      </div>
    );
  }

  const values = valid
    .map((x) => Number(x[dataKey]))
    .filter((x) => !Number.isNaN(x));

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const range = maxValue - minValue;
  const padding = range === 0 ? Math.max(minValue * 0.02, 1) : range * 0.2;

  const yMin = Math.floor((minValue - padding) * 10) / 10;
  const yMax = Math.ceil((maxValue + padding) * 10) / 10;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={valid} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #f1f5f9",
            borderRadius: "16px",
            color: "#111827",
            boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
          }}
          formatter={(value) => [String(value) + " " + unit, "Значение"]}
          labelFormatter={(label) => `Дата: ${label}`}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="#ec4899"
          strokeWidth={3}
          dot={{ r: 4, fill: "#ffffff", stroke: "#ec4899", strokeWidth: 2 }}
          activeDot={{ r: 6, fill: "#ec4899" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function formatShortDate(value: string) {
  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return value;
  }

  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  });
}