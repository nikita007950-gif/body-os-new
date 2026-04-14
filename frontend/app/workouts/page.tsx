"use client";

import { useEffect, useMemo, useState } from "react";
import { workoutTemplates } from "@/lib/body-data";

const API_URL = "/api";

type WorkoutType = keyof typeof workoutTemplates;

type ExerciseForm = {
  name: string;
  targetReps: string[];
  actualReps: string[];
  weights: string[];
  comment: string;
};

export default function WorkoutsPage() {
  const [type, setType] = useState<WorkoutType>("Push");
  const [workoutDate, setWorkoutDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [formExercises, setFormExercises] = useState<ExerciseForm[]>([]);

  const templateExercises = useMemo(() => workoutTemplates[type], [type]);

  useEffect(() => {
    const base = templateExercises.map((exercise) => ({
      name: exercise.name,
      targetReps: exercise.reps.split("/").map((x: string) => x.trim()),
      actualReps: exercise.reps.split("/").map((x: string) => x.trim()),
      weights: [...exercise.lastWeights],
      comment: exercise.note ?? "",
    }));

    setFormExercises(base);

    fetch(`${API_URL}/last-workout/${type}`)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) return;

        setFormExercises((prev) =>
          prev.map((exercise) => {
            const found = data.find(
              (item: { exercise: string; weights: string[] }) =>
                item.exercise === exercise.name
            );

            if (!found) return exercise;

            const cleanWeights = found.weights.filter(
              (x: string | null) => x !== null && x !== undefined && x !== ""
            );

            return {
              ...exercise,
              weights:
                cleanWeights.length > 0 ? cleanWeights : exercise.weights,
            };
          })
        );
      })
      .catch(() => {});
  }, [templateExercises, type]);

  const updateWeight = (
    exerciseIndex: number,
    weightIndex: number,
    value: string
  ) => {
    setFormExercises((prev) =>
      prev.map((exercise, i) => {
        if (i !== exerciseIndex) return exercise;
        const nextWeights = [...exercise.weights];
        nextWeights[weightIndex] = value;
        return { ...exercise, weights: nextWeights };
      })
    );
  };

  const updateActualRep = (
    exerciseIndex: number,
    repIndex: number,
    value: string
  ) => {
    setFormExercises((prev) =>
      prev.map((exercise, i) => {
        if (i !== exerciseIndex) return exercise;
        const nextReps = [...exercise.actualReps];
        nextReps[repIndex] = value;
        return { ...exercise, actualReps: nextReps };
      })
    );
  };

  const updateComment = (exerciseIndex: number, value: string) => {
    setFormExercises((prev) =>
      prev.map((exercise, i) =>
        i === exerciseIndex ? { ...exercise, comment: value } : exercise
      )
    );
  };

  const handleSave = async () => {
    const payload = formExercises.map((exercise) => ({
      date: workoutDate,
      workout_type: type,
      exercise: exercise.name,
      target_reps: exercise.targetReps,
      actual_reps: exercise.actualReps,
      weights: exercise.weights,
      comment: exercise.comment,
    }));

    await fetch(`${API_URL}/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    alert("Тренировка сохранена 🚀");
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
              Workouts
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Тренировки
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              План, факт и последние веса в одном месте.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["Push", "Pull", "Legs"] as WorkoutType[]).map((item) => (
              <button
                key={item}
                onClick={() => setType(item)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  type === item
                    ? "bg-cyan-400 text-slate-950"
                    : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 max-w-[220px]">
          <label className="mb-2 block text-sm text-slate-400">Дата</label>
          <input
            type="date"
            value={workoutDate}
            onChange={(e) => setWorkoutDate(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
          />
        </div>
      </section>

      <div className="space-y-3">
        {formExercises.map((exercise, index) => (
          <CompactExerciseCard
            key={exercise.name}
            index={index + 1}
            name={exercise.name}
            targetReps={exercise.targetReps}
            actualReps={exercise.actualReps}
            weights={exercise.weights}
            comment={exercise.comment}
            onWeightChange={(weightIndex, value) =>
              updateWeight(index, weightIndex, value)
            }
            onRepChange={(repIndex, value) =>
              updateActualRep(index, repIndex, value)
            }
            onCommentChange={(value) => updateComment(index, value)}
          />
        ))}
      </div>

      <button
        onClick={handleSave}
        className="w-full rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
      >
        Сохранить тренировку
      </button>
    </div>
  );
}

function CompactExerciseCard({
  index,
  name,
  targetReps,
  actualReps,
  weights,
  comment,
  onWeightChange,
  onRepChange,
  onCommentChange,
}: {
  index: number;
  name: string;
  targetReps: string[];
  actualReps: string[];
  weights: string[];
  comment: string;
  onWeightChange: (weightIndex: number, value: string) => void;
  onRepChange: (repIndex: number, value: string) => void;
  onCommentChange: (value: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">#{index}</span>
        <h2 className="text-base font-semibold text-white">{name}</h2>
      </div>

      <div className="mt-1 text-sm text-slate-400">
        План по повторам: {targetReps.join(" / ")}
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-medium text-slate-300">
            Факт: повторы
          </div>
          <div
            className={`grid gap-2 ${
              actualReps.length === 4 ? "grid-cols-4" : "grid-cols-3"
            }`}
          >
            {actualReps.map((value, idx) => (
              <input
                key={idx}
                value={value}
                onChange={(e) => onRepChange(idx, e.target.value)}
                placeholder={`Повт ${idx + 1}`}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
              />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-slate-300">
            Факт: веса
          </div>
          <div
            className={`grid gap-2 ${
              weights.length === 4 ? "grid-cols-4" : "grid-cols-3"
            }`}
          >
            {weights.map((value, idx) => (
              <input
                key={idx}
                value={value}
                onChange={(e) => onWeightChange(idx, e.target.value)}
                placeholder={`Вес ${idx + 1}`}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
              />
            ))}
          </div>
        </div>
      </div>

      <input
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder="Комментарий"
        className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
      />
    </section>
  );
}