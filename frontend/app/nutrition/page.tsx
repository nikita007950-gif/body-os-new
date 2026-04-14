import { cardioPlan, mealPlan } from "@/lib/body-data";

export default function NutritionPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
              Nutrition
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Питание
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Текущий meal plan и кардио без лишнего визуального шума.
            </p>
          </div>

          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">
              Кардио
            </div>
            <div className="mt-1 text-sm font-medium text-slate-100">
              {cardioPlan}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {mealPlan.map((meal) => (
          <section
            key={meal.meal}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">{meal.meal}</h2>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-200">
                {meal.items.length} пункта
              </span>
            </div>

            <ul className="space-y-2">
              {meal.items.map((item) => (
                <li
                  key={item}
                  className="rounded-xl bg-black/20 px-3 py-2 text-sm text-slate-200"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}