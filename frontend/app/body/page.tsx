"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = "/api";

type BodyMetric = {
  date: string;
  weight: number | null;
  body_fat: number | null;
  comment: string;
};

type FormState = {
  date: string;
  weight: string;
  body_fat: string;
  comment: string;
};

export default function BodyPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [form, setForm] = useState<FormState>({
    date: today,
    weight: "",
    body_fat: "",
    comment: "",
  });

  const [items, setItems] = useState<BodyMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

  async function loadMetrics() {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/body-metrics`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Не удалось загрузить метрики");
      }

      const data: BodyMetric[] = await res.json();
      setItems(data.reverse());
    } catch (error) {
      console.error(error);
      setMessage("Не удалось загрузить историю замеров");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!form.date) {
      setMessage("Укажи дату");
      return;
    }

    if (!form.weight.trim() && !form.body_fat.trim()) {
      setMessage("Заполни хотя бы вес или % жира");
      return;
    }

    const payload = {
      date: form.date,
      weight: form.weight.trim() ? Number(form.weight) : null,
      body_fat: form.body_fat.trim() ? Number(form.body_fat) : null,
      comment: form.comment.trim(),
    };

    if (
      (payload.weight !== null && Number.isNaN(payload.weight)) ||
      (payload.body_fat !== null && Number.isNaN(payload.body_fat))
    ) {
      setMessage("Вес и % жира должны быть числами");
      return;
    }

    try {
      setIsSaving(true);

      const res = await fetch(`${API_URL}/body-metrics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || "Не удалось сохранить запись");
      }

      setMessage("Запись сохранена");
      setForm({
        date: today,
        weight: "",
        body_fat: "",
        comment: "",
      });

      await loadMetrics();
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Ошибка сохранения");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
        <div className="text-sm text-slate-400">Состав тела</div>
        <div className="mt-1 text-xl font-semibold text-slate-100">
          Вес и процент жира
        </div>
        <div className="mt-2 text-sm text-slate-400">
          Вноси замеры по датам и отслеживай динамику.
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold tracking-tight">
              Добавить запись
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Можно заполнить только вес, только % жира или оба поля сразу.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Дата">
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/50"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Вес, кг">
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  placeholder="Например, 81.4"
                  value={form.weight}
                  onChange={(e) => updateField("weight", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
                />
              </Field>

              <Field label="% жира">
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  placeholder="Например, 17.8"
                  value={form.body_fat}
                  onChange={(e) => updateField("body_fat", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
                />
              </Field>
            </div>

            <Field label="Комментарий">
              <textarea
                rows={4}
                placeholder="Например: утром натощак, после тренировки, с водой и т.д."
                value={form.comment}
                onChange={(e) => updateField("comment", e.target.value)}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
              />
            </Field>

            {message ? (
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Сохраняю..." : "Сохранить запись"}
            </button>
          </form>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                История замеров
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Последние записи сверху.
              </p>
            </div>
            <div className="text-sm text-slate-500">
              Всего: {items.length}
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
              Загрузка...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
              Пока нет записей. Добавь первый замер.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={`${item.date}-${index}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-100">
                      {formatDate(item.date)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <MiniBadge>
                        Вес: {item.weight ?? "—"} кг
                      </MiniBadge>
                      <MiniBadge>
                        Жир: {item.body_fat ?? "—"}%
                      </MiniBadge>
                    </div>
                  </div>

                  {item.comment ? (
                    <div className="text-sm leading-6 text-slate-400">
                      {item.comment}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">
                      Без комментария
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <div className="text-sm text-slate-300">{label}</div>
      {children}
    </label>
  );
}

function MiniBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
      {children}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ru-RU");
}