"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Search, Loader2, X, ChevronDown } from "lucide-react";

const WEEKDAYS = [
  { v: "segunda", l: "Seg" }, { v: "terca", l: "Ter" }, { v: "quarta", l: "Qua" },
  { v: "quinta", l: "Qui" }, { v: "sexta", l: "Sex" }, { v: "sabado", l: "Sáb" }, { v: "domingo", l: "Dom" },
];
const LETTERS = ["A", "B", "C", "D", "E", "F"];

const METODOS = [
  { value: "normal", label: "Normal" },
  { value: "biset", label: "Bi-set" },
  { value: "triset", label: "Tri-set" },
  { value: "dropset", label: "Drop Set" },
  { value: "piramide", label: "Pirâmide" },
  { value: "superserie", label: "Supersérie" },
  { value: "amrap", label: "AMRAP" },
  { value: "isometrico", label: "Isométrico" },
  { value: "circuito", label: "Circuito" },
];

const TIPO_MEDIDA = [
  { value: "reps", label: "Reps" },
  { value: "tempo", label: "Tempo (s)" },
  { value: "distancia", label: "Distância (m)" },
];

type ExRow = {
  _id: string;
  exerciseId: string | null;
  exerciseName: string;
  muscleGroup: string;
  metodo: string;
  sets: string;
  tipoMedida: string;
  reps: string;
  loadKg: string;
  restSeconds: string;
  cadencia: string;
  techniqueNote: string;
  videoUrl: string;
};

type DayForm = {
  _id: string;
  dayLetter: string;
  name: string;
  weekdays: string[];
  dayNotes: string;
  exercises: ExRow[];
};

type PlanMeta = { name: string; goal: string; startsAt: string };

function uid() { return Math.random().toString(36).slice(2, 9); }

function newEx(): ExRow {
  return {
    _id: uid(), exerciseId: null, exerciseName: "", muscleGroup: "",
    metodo: "normal", sets: "3", tipoMedida: "reps", reps: "10-12",
    loadKg: "", restSeconds: "60", cadencia: "", techniqueNote: "", videoUrl: "",
  };
}

function newDay(letter: string): DayForm {
  return { _id: uid(), dayLetter: letter, name: "", weekdays: [], dayNotes: "", exercises: [newEx()] };
}

function ExercisePicker({ value, onChange, exercises }: {
  value: string;
  onChange: (name: string, id: string | null, group: string) => void;
  exercises: any[];
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQ(value); }, [value]);
  useEffect(() => {
    function onDown(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filtered = q.length > 0 ? exercises.filter(ex => ex.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : [];
  const hasExact = filtered.some(ex => ex.name.toLowerCase() === q.toLowerCase());

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); onChange(e.target.value, null, ""); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar ou digitar exercício..."
          style={{ paddingLeft: 28, width: "100%", fontSize: 13 }}
        />
      </div>
      {open && q.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 300,
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxHeight: 260, overflowY: "auto",
        }}>
          {filtered.map(ex => (
            <button key={ex.id} type="button"
              onClick={() => { onChange(ex.name, ex.id, (ex.muscle_groups || [])[0] || ""); setQ(ex.name); setOpen(false); }}
              style={{ width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--border-subtle)", padding: "9px 12px", cursor: "pointer" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
            >
              <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{ex.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{(ex.muscle_groups || []).join(" · ")}</div>
            </button>
          ))}
          {!hasExact && q.length > 1 && (
            <button type="button"
              onClick={() => { onChange(q, null, ""); setOpen(false); }}
              style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "9px 12px", cursor: "pointer", color: "var(--accent)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={13} /> Personalizado: &ldquo;{q}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Select({ value, onChange, options, style }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; style?: React.CSSProperties }) {
  return (
    <div style={{ position: "relative", ...style }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: "100%", appearance: "none", paddingRight: 24, fontSize: 12, cursor: "pointer" }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
    </div>
  );
}

export default function NovaFichaPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [meta, setMeta] = useState<PlanMeta>({ name: "", goal: "", startsAt: new Date().toISOString().slice(0, 10) });
  const [days, setDays] = useState<DayForm[]>([newDay("A")]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [init, setInit] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [sr, er] = await Promise.all([
        (supabase.from("profiles") as any).select("name, goal").eq("id", studentId).single(),
        (supabase.from("exercises") as any).select("id, name, muscle_groups").eq("is_public", true).order("name"),
      ]);
      setStudent(sr.data);
      setExercises(er.data || []);
      if (sr.data?.goal) {
        const month = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
        setMeta(m => ({ ...m, name: `${sr.data.goal} — ${month}`, goal: sr.data.goal }));
      }
      setInit(false);
    })();
  }, [studentId]);

  function addDay() {
    const l = LETTERS[days.length] || String.fromCharCode(65 + days.length);
    setDays(d => [...d, newDay(l)]);
  }
  function removeDay(id: string) {
    setDays(d => d.filter(x => x._id !== id).map((x, i) => ({ ...x, dayLetter: LETTERS[i] || String.fromCharCode(65 + i) })));
  }
  function setDay(id: string, patch: Partial<DayForm>) {
    setDays(d => d.map(x => x._id === id ? { ...x, ...patch } : x));
  }
  function toggleWd(dayId: string, wd: string) {
    setDays(d => d.map(x => {
      if (x._id !== dayId) return x;
      const has = x.weekdays.includes(wd);
      return { ...x, weekdays: has ? x.weekdays.filter(w => w !== wd) : [...x.weekdays, wd] };
    }));
  }
  function addEx(dayId: string) {
    setDays(d => d.map(x => x._id === dayId ? { ...x, exercises: [...x.exercises, newEx()] } : x));
  }
  function removeEx(dayId: string, exId: string) {
    setDays(d => d.map(x => x._id === dayId ? { ...x, exercises: x.exercises.filter(e => e._id !== exId) } : x));
  }
  function setEx(dayId: string, exId: string, patch: Partial<ExRow>) {
    setDays(d => d.map(x => x._id === dayId ? { ...x, exercises: x.exercises.map(e => e._id === exId ? { ...e, ...patch } : e) } : x));
  }

  async function handleSave() {
    if (!meta.name.trim()) { setError("Nome da ficha é obrigatório"); return; }
    if (days.some(d => !d.name.trim())) { setError("Todos os treinos precisam de um nome"); return; }
    setSaving(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      await (supabase.from("workout_plans") as any).update({ active: false }).eq("student_id", studentId).eq("active", true);

      const { data: plan, error: pe } = await (supabase.from("workout_plans") as any).insert({
        student_id: studentId, trainer_id: session.user.id,
        name: meta.name.trim(), goal: meta.goal.trim() || null,
        starts_at: meta.startsAt, active: true,
      }).select().single();
      if (pe) throw pe;

      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const { data: wd, error: de } = await (supabase.from("workout_days") as any).insert({
          plan_id: plan.id, day_letter: day.dayLetter, name: day.name.trim(),
          suggested_weekdays: day.weekdays.length > 0 ? day.weekdays : null,
          day_notes: day.dayNotes.trim() || null,
          order_index: i,
        }).select().single();
        if (de) throw de;

        const valid = day.exercises.filter(e => e.exerciseName.trim());
        if (valid.length > 0) {
          const { error: ee } = await (supabase.from("prescribed_exercises") as any).insert(
            valid.map((ex, j) => ({
              day_id: wd.id,
              exercise_id: ex.exerciseId || null,
              exercise_name: ex.exerciseName.trim(),
              muscle_group: ex.muscleGroup || null,
              method: ex.metodo,
              sets: ex.sets ? parseInt(ex.sets) : null,
              measure_type: ex.tipoMedida,
              reps: ex.reps.trim() || null,
              load_kg: ex.loadKg ? parseFloat(ex.loadKg) : null,
              rest_seconds: ex.restSeconds ? parseInt(ex.restSeconds) : null,
              cadence: ex.cadencia.trim() || null,
              technique_note: ex.techniqueNote.trim() || null,
              order_index: j,
            }))
          );
          if (ee) throw ee;
        }
      }

      router.push(`/dashboard/alunos/${studentId}`);
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar ficha");
    } finally {
      setSaving(false);
    }
  }

  if (init) return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
      <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <Link href={`/dashboard/alunos/${studentId}`} style={{ color: "var(--text-muted)", textDecoration: "none", display: "flex" }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>Nova Ficha de Treino</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>{student?.name}</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ fontSize: 13 }}>
          {saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
          {saving ? "Salvando..." : "Salvar Ficha"}
        </button>
      </div>

      {/* Plan meta */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 160px", gap: 16, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 500 }}>Nome da Ficha *</label>
            <input value={meta.name} onChange={e => setMeta(m => ({ ...m, name: e.target.value }))} placeholder="Ex: Hipertrofia — Julho 2026" style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 500 }}>Objetivo</label>
            <input value={meta.goal} onChange={e => setMeta(m => ({ ...m, goal: e.target.value }))} placeholder="Hipertrofia, emagrecimento..." style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 500 }}>Início</label>
            <input type="date" value={meta.startsAt} onChange={e => setMeta(m => ({ ...m, startsAt: e.target.value }))} style={{ width: "100%" }} />
          </div>
        </div>
      </div>

      {/* Training days */}
      {days.map((day) => (
        <div key={day._id} className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
          {/* Day header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: "rgba(61,189,212,0.15)", border: "1px solid rgba(61,189,212,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, fontWeight: 800, color: "var(--accent)",
            }}>
              {day.dayLetter}
            </div>
            <input
              value={day.name}
              onChange={e => setDay(day._id, { name: e.target.value })}
              placeholder={`Nome do Treino ${day.dayLetter} — ex: Peito e Tríceps`}
              style={{ flex: 1, fontWeight: 600, fontSize: 15 }}
            />
            {days.length > 1 && (
              <button type="button" onClick={() => removeDay(day._id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 6, flexShrink: 0 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--red)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Weekday toggles */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.8px", marginBottom: 8 }}>SUGESTÃO DE DIAS</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {WEEKDAYS.map(({ v, l }) => {
                const on = day.weekdays.includes(v);
                return (
                  <button key={v} type="button" onClick={() => toggleWd(day._id, v)} style={{
                    padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: on ? 700 : 400, cursor: "pointer", transition: "all 0.15s",
                    border: on ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: on ? "rgba(61,189,212,0.15)" : "var(--surface-2)",
                    color: on ? "var(--accent)" : "var(--text-secondary)",
                  }}>
                    {l}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day notes */}
          <div style={{ marginBottom: 16 }}>
            <input
              value={day.dayNotes}
              onChange={e => setDay(day._id, { dayNotes: e.target.value })}
              placeholder="Observações do treino (aquecimento, instrução geral...)"
              style={{ width: "100%", fontSize: 13 }}
            />
          </div>

          {/* Exercise cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {day.exercises.map((ex, idx) => (
              <div key={ex._id} style={{
                background: "var(--surface-2)", borderRadius: 12, padding: 14,
                border: "1px solid var(--border-subtle)", position: "relative",
              }}>
                {/* Exercise number + remove */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                    EXERCÍCIO {idx + 1}
                  </span>
                  <button type="button" onClick={() => removeEx(day._id, ex._id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, borderRadius: 4, display: "flex" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--red)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Row 1: Exercise name + Método */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10, marginBottom: 10 }}>
                  <ExercisePicker
                    value={ex.exerciseName}
                    exercises={exercises}
                    onChange={(name, id, group) => setEx(day._id, ex._id, { exerciseName: name, exerciseId: id, muscleGroup: group })}
                  />
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>MÉTODO</div>
                    <Select value={ex.metodo} onChange={v => setEx(day._id, ex._id, { metodo: v })} options={METODOS} />
                  </div>
                </div>

                {/* Row 2: Séries + Tipo + Reps + Carga + Descanso */}
                <div style={{ display: "grid", gridTemplateColumns: "60px 110px 1fr 100px 80px", gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>SÉRIES</div>
                    <input value={ex.sets} onChange={e => setEx(day._id, ex._id, { sets: e.target.value })} placeholder="3" style={{ textAlign: "center", width: "100%" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>TIPO</div>
                    <Select value={ex.tipoMedida} onChange={v => setEx(day._id, ex._id, { tipoMedida: v })} options={TIPO_MEDIDA} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>
                      {ex.tipoMedida === "reps" ? "REPETIÇÕES" : ex.tipoMedida === "tempo" ? "TEMPO (s)" : "DISTÂNCIA (m)"}
                    </div>
                    <input value={ex.reps} onChange={e => setEx(day._id, ex._id, { reps: e.target.value })}
                      placeholder={ex.tipoMedida === "reps" ? "10-12" : ex.tipoMedida === "tempo" ? "30" : "100"}
                      style={{ textAlign: "center", width: "100%" }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>CARGA (kg)</div>
                    <input value={ex.loadKg} onChange={e => setEx(day._id, ex._id, { loadKg: e.target.value })}
                      placeholder="—" type="number" step="0.5" min="0" style={{ textAlign: "center", width: "100%" }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>DESCANSO</div>
                    <input value={ex.restSeconds} onChange={e => setEx(day._id, ex._id, { restSeconds: e.target.value })}
                      placeholder="60s" style={{ textAlign: "center", width: "100%" }}
                    />
                  </div>
                </div>

                {/* Row 3: Cadência + Observações */}
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>CADÊNCIA</div>
                    <input value={ex.cadencia} onChange={e => setEx(day._id, ex._id, { cadencia: e.target.value })}
                      placeholder="2-1-2 ou livre" style={{ width: "100%", fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>OBSERVAÇÕES</div>
                    <input value={ex.techniqueNote} onChange={e => setEx(day._id, ex._id, { techniqueNote: e.target.value })}
                      placeholder="Ex: Descer controlado, cotovelo próximo ao corpo..." style={{ width: "100%", fontSize: 12 }}
                    />
                  </div>
                </div>

                {/* Método highlight */}
                {ex.metodo !== "normal" && (
                  <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(61,189,212,0.12)", border: "1px solid rgba(61,189,212,0.3)", borderRadius: 6, padding: "3px 8px" }}>
                    <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>
                      {METODOS.find(m => m.value === ex.metodo)?.label}
                    </span>
                    {ex.metodo === "biset" && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>— executar em sequência com próximo</span>}
                    {ex.metodo === "dropset" && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>— reduzir carga até a falha</span>}
                    {ex.metodo === "amrap" && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>— máximo de reps possíveis</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button type="button" onClick={() => addEx(day._id)}
            style={{
              display: "flex", alignItems: "center", gap: 6, background: "none",
              border: "1px dashed var(--border)", borderRadius: 8, padding: "8px 14px",
              color: "var(--text-muted)", fontSize: 13, cursor: "pointer", marginTop: 12, transition: "all 0.15s",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--accent)"; el.style.color = "var(--accent)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.color = "var(--text-muted)"; }}
          >
            <Plus size={14} /> Adicionar exercício
          </button>
        </div>
      ))}

      {/* Add day */}
      {days.length < 6 && (
        <button type="button" onClick={addDay}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "none", border: "2px dashed var(--border)", borderRadius: 12, padding: 18,
            color: "var(--text-secondary)", fontSize: 14, cursor: "pointer", marginBottom: 20, transition: "all 0.15s",
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--accent)"; el.style.color = "var(--accent)"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.color = "var(--text-secondary)"; }}
        >
          <Plus size={18} /> Adicionar Treino {LETTERS[days.length] || ""}
        </button>
      )}

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", color: "#ef4444", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 8, paddingBottom: 32 }}>
        <Link href={`/dashboard/alunos/${studentId}`} className="btn-ghost" style={{ textDecoration: "none" }}>Cancelar</Link>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
          {saving ? "Salvando..." : "Salvar Ficha de Treino"}
        </button>
      </div>
    </div>
  );
}
