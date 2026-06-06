"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Play, Pause, Check, ChevronDown, ChevronUp, Timer,
  Trophy, Plus, Minus, X, CheckCircle2, Dumbbell,
} from "lucide-react";

interface Exercise {
  id: string; name: string; muscle_groups?: string[]; equipment?: string;
}
interface DayExercise {
  id: string; exercise_id: string; sets: number; reps: string; rest_seconds: number;
  notes?: string; target_weight?: number; order_index: number;
  exercises: Exercise;
}
interface WorkoutDay {
  id: string; name: string; order_index: number;
  workout_day_exercises: DayExercise[];
}
interface Plan { id: string; name: string; workout_days: WorkoutDay[]; }
interface PR { exercise_id: string; weight?: number; reps?: number; }

interface SetLog { reps: number; weight: number; done: boolean; isPR: boolean; }
type ExerciseLogs = Record<string, SetLog[]>;

export default function ActiveWorkout({
  plan, studentId, prs,
}: {
  plan: Plan | null;
  studentId: string;
  prs: PR[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [logs, setLogs] = useState<ExerciseLogs>({});
  const [expandedEx, setExpandedEx] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newPRs, setNewPRs] = useState<string[]>([]);

  const days = plan?.workout_days?.sort((a, b) => a.order_index - b.order_index) || [];
  const currentDay = days[selectedDayIndex];
  const exercises = currentDay?.workout_day_exercises?.sort((a, b) => a.order_index - b.order_index) || [];

  // Initialize logs when day changes
  useEffect(() => {
    if (!currentDay) return;
    const initial: ExerciseLogs = {};
    for (const de of exercises) {
      initial[de.id] = Array.from({ length: de.sets }, () => ({
        reps: parseInt(de.reps) || 10,
        weight: de.target_weight || 0,
        done: false,
        isPR: false,
      }));
    }
    setLogs(initial);
    setExpandedEx(exercises[0]?.id || null);
  }, [selectedDayIndex, currentDay]);

  // Workout timer
  useEffect(() => {
    if (!started || finished) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [started, finished]);

  // Rest timer
  useEffect(() => {
    if (restTimer === null || restTimer <= 0) return;
    const timeout = setTimeout(() => setRestTimer((t) => (t !== null ? t - 1 : null)), 1000);
    return () => clearTimeout(timeout);
  }, [restTimer]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  async function startWorkout() {
    const { data } = await (supabase.from("workout_sessions") as any).insert({
      student_id: studentId,
      plan_id: plan?.id,
      day_id: currentDay?.id,
      status: "in_progress",
    }).select().single();
    if (data) setSessionId(data.id);
    setStarted(true);
    setElapsed(0);
  }

  function toggleSet(deId: string, setIdx: number) {
    setLogs((prev) => {
      const sets = [...(prev[deId] || [])];
      const set = { ...sets[setIdx] };
      set.done = !set.done;

      if (set.done) {
        // Check PR
        const de = exercises.find((e) => e.id === deId);
        if (de) {
          const pr = prs.find((p) => p.exercise_id === de.exercise_id);
          const prWeight = pr?.weight || 0;
          if (set.weight > prWeight && set.weight > 0) {
            set.isPR = true;
            setNewPRs((n) => [...n, de.exercises.name]);
            setTimeout(() => setNewPRs((n) => n.filter((x) => x !== de.exercises.name)), 3000);
          }
        }

        // Start rest timer
        const restSec = exercises.find((e) => e.id === deId)?.rest_seconds || 60;
        setRestTimer(restSec);

        // Auto-advance to next exercise if all sets done
        const allDone = sets.every((s, i) => i === setIdx ? true : s.done);
        if (allDone) {
          const currentIdx = exercises.findIndex((e) => e.id === deId);
          const nextEx = exercises[currentIdx + 1];
          if (nextEx) setTimeout(() => setExpandedEx(nextEx.id), 600);
        }
      }

      sets[setIdx] = set;
      return { ...prev, [deId]: sets };
    });
  }

  function updateSet(deId: string, setIdx: number, field: "reps" | "weight", delta: number) {
    setLogs((prev) => {
      const sets = [...(prev[deId] || [])];
      const set = { ...sets[setIdx] };
      if (field === "reps") set.reps = Math.max(1, set.reps + delta);
      else set.weight = Math.max(0, Math.round((set.weight + delta) * 10) / 10);
      sets[setIdx] = set;
      return { ...prev, [deId]: sets };
    });
  }

  function addSet(deId: string) {
    setLogs((prev) => {
      const sets = [...(prev[deId] || [])];
      const last = sets[sets.length - 1];
      sets.push({ reps: last?.reps || 10, weight: last?.weight || 0, done: false, isPR: false });
      return { ...prev, [deId]: sets };
    });
  }

  const totalSets = Object.values(logs).flat().length;
  const doneSets = Object.values(logs).flat().filter((s) => s.done).length;
  const progress = totalSets > 0 ? (doneSets / totalSets) * 100 : 0;

  async function finishWorkout() {
    if (!sessionId) return;
    setSaving(true);
    try {
      const setsToInsert = [];
      for (const de of exercises) {
        const sets = logs[de.id] || [];
        for (let i = 0; i < sets.length; i++) {
          const s = sets[i];
          if (s.done) {
            setsToInsert.push({
              session_id: sessionId,
              exercise_id: de.exercise_id,
              set_number: i + 1,
              reps: s.reps,
              weight: s.weight,
              is_pr: s.isPR,
            });
            if (s.isPR && s.weight > 0) {
              const oneRepMax = s.weight * (1 + s.reps / 30);
              await (supabase.from("personal_records") as any).upsert({
                student_id: studentId,
                exercise_id: de.exercise_id,
                weight: s.weight,
                reps: s.reps,
                one_rep_max: Math.round(oneRepMax * 10) / 10,
                achieved_at: new Date().toISOString(),
                session_id: sessionId,
              }, { onConflict: "student_id,exercise_id" });
            }
          }
        }
      }
      if (setsToInsert.length > 0) {
        await (supabase.from("session_sets") as any).insert(setsToInsert);
      }
      await (supabase.from("workout_sessions") as any).update({
        status: "completed",
        finished_at: new Date().toISOString(),
        duration_minutes: Math.floor(elapsed / 60),
      }).eq("id", sessionId);

      setFinished(true);
    } finally {
      setSaving(false);
    }
  }

  if (!plan || days.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", paddingTop: 60 }}>
        <Dumbbell size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          Nenhum treino disponível
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Aguardando seu personal trainer criar sua ficha de treino.
        </p>
      </div>
    );
  }

  if (finished) {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center", paddingTop: 48 }} className="animate-slide-up">
        <div style={{
          width: 96, height: 96, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--green), #059669)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: "0 0 40px var(--green-glow)",
        }}>
          <CheckCircle2 size={48} color="white" />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
          Treino Concluído! 🎉
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 4 }}>
          {formatTime(elapsed)} de treino
        </p>
        <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>
          {doneSets} séries completadas
        </p>
        {newPRs.length > 0 && (
          <div style={{
            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 12, padding: "16px", marginBottom: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 8 }}>
              <Trophy size={20} color="var(--orange)" />
              <span style={{ fontWeight: 700, color: "var(--orange)" }}>Novos Recordes!</span>
            </div>
            {newPRs.map((name) => (
              <div key={name} style={{ fontSize: 13, color: "var(--text-secondary)" }}>{name}</div>
            ))}
          </div>
        )}
        <button onClick={() => router.push("/dashboard")} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            {started ? currentDay?.name : plan.name}
          </h1>
          {started && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--surface-2)", borderRadius: 20, padding: "6px 14px",
              border: "1px solid var(--border)",
            }}>
              <Timer size={14} color="var(--accent-light)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-light)", fontVariantNumeric: "tabular-nums" }}>
                {formatTime(elapsed)}
              </span>
            </div>
          )}
        </div>

        {/* Day selector (only before start) */}
        {!started && days.length > 1 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {days.map((day, i) => (
              <button
                key={day.id}
                onClick={() => setSelectedDayIndex(i)}
                style={{
                  padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                  border: `1.5px solid ${i === selectedDayIndex ? "var(--accent)" : "var(--border)"}`,
                  background: i === selectedDayIndex ? "rgba(124,58,237,0.15)" : "var(--surface-2)",
                  color: i === selectedDayIndex ? "var(--accent-light)" : "var(--text-secondary)",
                  cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
                }}
              >
                {day.name}
              </button>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {started && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{doneSets} / {totalSets} séries</span>
              <span style={{ fontSize: 12, color: "var(--accent-light)" }}>{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Rest timer toast */}
      {restTimer !== null && restTimer > 0 && (
        <div style={{
          position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 50, padding: "12px 24px", zIndex: 100,
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          <Timer size={16} color="var(--blue)" />
          <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 16, fontVariantNumeric: "tabular-nums" }}>
            Descanso: {formatTime(restTimer)}
          </span>
          <button onClick={() => setRestTimer(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", marginLeft: 4 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* New PR toast */}
      {newPRs.length > 0 && (
        <div style={{
          position: "fixed", top: 80, right: 20, zIndex: 101,
          background: "linear-gradient(135deg, #f59e0b, #ef4444)",
          borderRadius: 12, padding: "12px 20px",
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 8px 32px rgba(245,158,11,0.4)",
        }} className="animate-slide-up">
          <Trophy size={18} color="white" />
          <span style={{ fontWeight: 700, color: "white" }}>🏆 Novo PR: {newPRs[newPRs.length - 1]}</span>
        </div>
      )}

      {/* Exercises */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {exercises.map((de) => {
          const sets = logs[de.id] || [];
          const doneSetsCount = sets.filter((s) => s.done).length;
          const isExpanded = expandedEx === de.id;
          const allDone = sets.length > 0 && sets.every((s) => s.done);

          return (
            <div key={de.id} className="glass-card" style={{
              overflow: "hidden",
              border: allDone ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--border-subtle)",
              transition: "border-color 0.2s",
            }}>
              {/* Exercise header */}
              <button
                onClick={() => setExpandedEx(isExpanded ? null : de.id)}
                style={{
                  width: "100%", padding: "16px 20px", background: "none", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: allDone ? "rgba(16,185,129,0.15)" : "rgba(124,58,237,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  transition: "background 0.2s",
                }}>
                  {allDone
                    ? <Check size={18} color="var(--green)" />
                    : <Dumbbell size={18} color="var(--accent-light)" />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: allDone ? "var(--green)" : "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {de.exercises.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {sets.length} séries × {de.reps} reps
                    {de.rest_seconds ? ` · ${de.rest_seconds}s descanso` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: allDone ? "var(--green)" : "var(--text-muted)" }}>
                    {doneSetsCount}/{sets.length}
                  </span>
                  {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>
              </button>

              {/* Sets */}
              {isExpanded && (
                <div style={{ padding: "0 20px 16px", borderTop: "1px solid var(--border-subtle)" }}>
                  {/* Header */}
                  <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr auto", gap: 8, padding: "10px 0 8px", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>SET</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textAlign: "center" }}>KG</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textAlign: "center" }}>REPS</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textAlign: "center" }}>OK</span>
                  </div>

                  {sets.map((set, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid", gridTemplateColumns: "32px 1fr 1fr auto",
                        gap: 8, marginBottom: 8, alignItems: "center",
                        padding: "8px 10px", borderRadius: 10,
                        background: set.done ? "rgba(16,185,129,0.08)" : "var(--surface-2)",
                        border: `1px solid ${set.done ? "rgba(16,185,129,0.2)" : "transparent"}`,
                        transition: "all 0.2s",
                      }}
                      className={set.isPR ? "animate-pr-flash" : ""}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
                          {idx + 1}
                        </span>
                        {set.isPR && <span className="pr-badge">PR</span>}
                      </div>

                      {/* Weight */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                        <button onClick={() => updateSet(de.id, idx, "weight", -2.5)} disabled={!started} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", minWidth: 44, textAlign: "center" }}>
                          {set.weight}
                        </span>
                        <button onClick={() => updateSet(de.id, idx, "weight", 2.5)} disabled={!started} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Reps */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                        <button onClick={() => updateSet(de.id, idx, "reps", -1)} disabled={!started} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", minWidth: 32, textAlign: "center" }}>
                          {set.reps}
                        </span>
                        <button onClick={() => updateSet(de.id, idx, "reps", 1)} disabled={!started} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Done */}
                      <button
                        onClick={() => started && toggleSet(de.id, idx)}
                        disabled={!started}
                        style={{
                          width: 36, height: 36, borderRadius: "50%", border: "none", cursor: started ? "pointer" : "default",
                          background: set.done ? "var(--green)" : "var(--border)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "background 0.2s, transform 0.1s",
                          transform: set.done ? "scale(1.1)" : "scale(1)",
                        }}
                      >
                        <Check size={16} color="white" />
                      </button>
                    </div>
                  ))}

                  {started && (
                    <button onClick={() => addSet(de.id)} style={{
                      background: "none", border: "1px dashed var(--border)", borderRadius: 8,
                      padding: "8px", width: "100%", color: "var(--text-muted)", fontSize: 12,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      marginTop: 4, transition: "border-color 0.15s, color 0.15s",
                    }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.color = "var(--accent-light)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                    >
                      <Plus size={12} /> Adicionar série
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      {!started ? (
        <button onClick={startWorkout} className="btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: 16, padding: "16px" }}>
          <Play size={18} fill="white" /> Iniciar Treino
        </button>
      ) : (
        <button
          onClick={finishWorkout}
          disabled={saving}
          className="btn-primary"
          style={{
            width: "100%", justifyContent: "center", fontSize: 16, padding: "16px",
            background: progress === 100 ? "linear-gradient(135deg, var(--green), #059669)" : "linear-gradient(135deg, var(--accent), #6366f1)",
          }}
        >
          <CheckCircle2 size={18} />
          {saving ? "Salvando..." : progress === 100 ? "Finalizar Treino 🎉" : `Finalizar (${Math.round(progress)}%)`}
        </button>
      )}
    </div>
  );
}
