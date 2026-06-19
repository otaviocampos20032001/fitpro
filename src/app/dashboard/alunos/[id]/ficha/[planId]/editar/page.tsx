"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Save, Trash2, Edit2, GripVertical,
  ChevronDown, ChevronUp, X, Loader, Check, Dumbbell, Search,
} from "lucide-react";

/* ─── types ─── */
type LibraryEx = { id: string; name: string; muscle_groups?: string[]; video_url?: string };
type PrescribedEx = {
  id: string; exercise_id?: string | null; exercise_name: string; muscle_group?: string;
  method?: string; sets?: number; measure_type?: string; reps?: string;
  load_kg?: number; rest_seconds?: number; cadence?: string;
  technique_note?: string; order_index: number;
};
type Day = {
  id: string; day_letter: string; name: string;
  suggested_weekdays: string[] | null; day_notes?: string;
  order_index: number; prescribed_exercises: PrescribedEx[];
};
type Plan = { id: string; name: string; goal?: string; student_id: string };

/* ─── constants ─── */
const WEEKDAYS = [
  { key: "segunda", label: "Seg" }, { key: "terca",   label: "Ter" },
  { key: "quarta",  label: "Qua" }, { key: "quinta",  label: "Qui" },
  { key: "sexta",   label: "Sex" }, { key: "sabado",  label: "Sáb" },
  { key: "domingo", label: "Dom" },
];
const METHODS = [
  { value: "normal",      label: "Normal" },
  { value: "biset",       label: "Bi-set" },
  { value: "triset",      label: "Tri-set" },
  { value: "dropset",     label: "Drop Set" },
  { value: "piramide",    label: "Pirâmide" },
  { value: "superserie",  label: "Supersérie" },
  { value: "amrap",       label: "AMRAP" },
  { value: "isometrico",  label: "Isométrico" },
  { value: "circuito",    label: "Circuito" },
];
const MEASURE_TYPES = [
  { value: "reps",      label: "Repetições" },
  { value: "tempo",     label: "Tempo (s)" },
  { value: "distancia", label: "Distância (m)" },
];

const emptyEx = (): Omit<PrescribedEx, "id" | "order_index"> => ({
  exercise_id: null, exercise_name: "", muscle_group: "", method: "normal",
  sets: undefined, measure_type: "reps", reps: "",
  load_kg: undefined, rest_seconds: undefined, cadence: "", technique_note: "",
});
const emptyDay = () => ({
  day_letter: "", name: "", suggested_weekdays: [] as string[], day_notes: "",
});

/* ── ExercisePicker ── */
function ExercisePicker({ value, exercises, onChange, inputStyle }: {
  value: string;
  exercises: LibraryEx[];
  onChange: (name: string, id: string | null, group: string) => void;
  inputStyle: React.CSSProperties;
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
  const filtered = q.length > 0 ? exercises.filter(ex => ex.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : exercises.slice(0, 8);
  const hasExact = filtered.some(ex => ex.name.toLowerCase() === q.toLowerCase());
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input value={q} onChange={e => { setQ(e.target.value); setOpen(true); onChange(e.target.value, null, ""); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar ou digitar exercício..."
          style={{ ...inputStyle, paddingLeft: 30, width: "100%" }} />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 300, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxHeight: 240, overflowY: "auto" }}>
          {filtered.map(ex => (
            <button key={ex.id} type="button"
              onClick={() => { onChange(ex.name, ex.id, (ex.muscle_groups || [])[0] || ""); setQ(ex.name); setOpen(false); }}
              style={{ width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--border-subtle)", padding: "9px 12px", cursor: "pointer" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}>
              <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                {ex.name}
                {ex.video_url && <span style={{ fontSize: 10, color: "var(--accent)", background: "rgba(61,189,212,0.12)", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>▶ VÍD</span>}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{(ex.muscle_groups || []).join(" · ")}</div>
            </button>
          ))}
          {!hasExact && q.length > 1 && (
            <button type="button" onClick={() => { onChange(q, null, ""); setOpen(false); }}
              style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "9px 12px", cursor: "pointer", color: "var(--accent)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={13} /> Personalizado: &ldquo;{q}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════ */
export default function EditarFichaPage() {
  const params  = useParams();
  const router  = useRouter();
  const studentId = params.id as string;
  const planId    = params.planId as string;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [libraryExs, setLibraryExs] = useState<LibraryEx[]>([]);

  /* plan meta editing */
  const [planName, setPlanName] = useState("");
  const [planGoal, setPlanGoal] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaSaved, setMetaSaved] = useState(false);

  /* day modal */
  const [dayModal, setDayModal] = useState<{ mode: "add" | "edit"; day?: Day } | null>(null);
  const [dayForm, setDayForm] = useState(emptyDay());
  const [savingDay, setSavingDay] = useState(false);
  const [deletingDay, setDeletingDay] = useState<string | null>(null);

  /* exercise modal */
  const [exModal, setExModal] = useState<{ mode: "add" | "edit"; dayId: string; ex?: PrescribedEx } | null>(null);
  const [exForm, setExForm] = useState(emptyEx());
  const [savingEx, setSavingEx] = useState(false);
  const [deletingEx, setDeletingEx] = useState<string | null>(null);

  /* ── load ── */
  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;

    const [planRes, daysRes, exRes] = await Promise.all([
      (supabase.from("workout_plans") as any)
        .select("id, name, goal, student_id").eq("id", planId).single(),
      (supabase.from("workout_days") as any)
        .select("*, prescribed_exercises(*)")
        .eq("plan_id", planId).order("order_index", { ascending: true }),
      (supabase.from("exercises") as any)
        .select("id, name, muscle_groups, video_url")
        .or(userId ? `is_public.eq.true,created_by.eq.${userId}` : "is_public.eq.true")
        .order("name"),
    ]);
    if (!planRes.data) { router.push(`/dashboard/alunos/${studentId}`); return; }
    setPlan(planRes.data);
    setPlanName(planRes.data.name);
    setPlanGoal(planRes.data.goal || "");
    setDays(daysRes.data || []);
    setLibraryExs(exRes.data || []);
    setLoading(false);
  }, [planId, studentId, router]);

  useEffect(() => { load(); }, [load]);

  /* ── helpers ── */
  function toggleDay(id: string) {
    setExpandedDays(prev => {
      const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
    });
  }

  /* ── save plan meta ── */
  async function saveMeta() {
    if (!planName.trim()) return;
    setSavingMeta(true);
    const supabase = createClient();
    await (supabase.from("workout_plans") as any)
      .update({ name: planName.trim(), goal: planGoal.trim() || null })
      .eq("id", planId);
    setSavingMeta(false);
    setMetaSaved(true);
    setTimeout(() => setMetaSaved(false), 2000);
    setPlan(p => p ? { ...p, name: planName.trim(), goal: planGoal.trim() || undefined } : p);
  }

  /* ── open day modal ── */
  function openAddDay() {
    setDayForm(emptyDay());
    setDayModal({ mode: "add" });
  }
  function openEditDay(day: Day) {
    setDayForm({
      day_letter: day.day_letter,
      name: day.name,
      suggested_weekdays: day.suggested_weekdays || [],
      day_notes: day.day_notes || "",
    });
    setDayModal({ mode: "edit", day });
  }

  /* ── save day ── */
  async function saveDay() {
    if (!dayForm.name.trim() || !dayForm.day_letter.trim()) return;
    setSavingDay(true);
    const supabase = createClient();
    try {
      if (dayModal?.mode === "add") {
        const maxOrder = days.reduce((m, d) => Math.max(m, d.order_index), -1);
        await (supabase.from("workout_days") as any).insert({
          plan_id: planId,
          day_letter: dayForm.day_letter.trim().toUpperCase(),
          name: dayForm.name.trim(),
          suggested_weekdays: dayForm.suggested_weekdays.length ? dayForm.suggested_weekdays : null,
          day_notes: dayForm.day_notes.trim() || null,
          order_index: maxOrder + 1,
        });
      } else if (dayModal?.day) {
        await (supabase.from("workout_days") as any)
          .update({
            day_letter: dayForm.day_letter.trim().toUpperCase(),
            name: dayForm.name.trim(),
            suggested_weekdays: dayForm.suggested_weekdays.length ? dayForm.suggested_weekdays : null,
            day_notes: dayForm.day_notes.trim() || null,
          })
          .eq("id", dayModal.day.id);
      }
      await load();
      setDayModal(null);
    } finally {
      setSavingDay(false);
    }
  }

  /* ── delete day ── */
  async function deleteDay(dayId: string) {
    if (!confirm("Deletar este dia e todos os seus exercícios?")) return;
    setDeletingDay(dayId);
    const supabase = createClient();
    await (supabase.from("workout_days") as any).delete().eq("id", dayId);
    setDays(prev => prev.filter(d => d.id !== dayId));
    setDeletingDay(null);
  }

  /* ── toggle weekday ── */
  function toggleWeekday(key: string) {
    setDayForm(prev => ({
      ...prev,
      suggested_weekdays: prev.suggested_weekdays.includes(key)
        ? prev.suggested_weekdays.filter(k => k !== key)
        : [...prev.suggested_weekdays, key],
    }));
  }

  /* ── open exercise modal ── */
  function openAddEx(dayId: string) {
    setExForm(emptyEx());
    setExModal({ mode: "add", dayId });
  }
  function openEditEx(dayId: string, ex: PrescribedEx) {
    setExForm({
      exercise_id: ex.exercise_id || null,
      exercise_name: ex.exercise_name,
      muscle_group: ex.muscle_group || "",
      method: ex.method || "normal",
      sets: ex.sets,
      measure_type: ex.measure_type || "reps",
      reps: ex.reps || "",
      load_kg: ex.load_kg,
      rest_seconds: ex.rest_seconds,
      cadence: ex.cadence || "",
      technique_note: ex.technique_note || "",
    });
    setExModal({ mode: "edit", dayId, ex });
  }

  /* ── save exercise ── */
  async function saveEx() {
    if (!exForm.exercise_name.trim() || !exModal) return;
    setSavingEx(true);
    const supabase = createClient();
    try {
      const payload = {
        exercise_id: exForm.exercise_id || null,
        exercise_name: exForm.exercise_name.trim(),
        muscle_group: exForm.muscle_group?.trim() || null,
        method: exForm.method || "normal",
        sets: exForm.sets || null,
        measure_type: exForm.measure_type || "reps",
        reps: exForm.reps?.trim() || null,
        load_kg: exForm.load_kg || null,
        rest_seconds: exForm.rest_seconds || null,
        cadence: exForm.cadence?.trim() || null,
        technique_note: exForm.technique_note?.trim() || null,
      };
      if (exModal.mode === "add") {
        const day = days.find(d => d.id === exModal.dayId);
        const maxOrder = (day?.prescribed_exercises || []).reduce((m, e) => Math.max(m, e.order_index), -1);
        await (supabase.from("prescribed_exercises") as any).insert({
          ...payload, day_id: exModal.dayId, order_index: maxOrder + 1,
        });
      } else if (exModal.ex) {
        await (supabase.from("prescribed_exercises") as any)
          .update(payload).eq("id", exModal.ex.id);
      }
      await load();
      setExModal(null);
    } finally {
      setSavingEx(false);
    }
  }

  /* ── delete exercise ── */
  async function deleteEx(exId: string) {
    if (!confirm("Remover este exercício?")) return;
    setDeletingEx(exId);
    const supabase = createClient();
    await (supabase.from("prescribed_exercises") as any).delete().eq("id", exId);
    setDays(prev => prev.map(d => ({
      ...d,
      prescribed_exercises: d.prescribed_exercises.filter(e => e.id !== exId),
    })));
    setDeletingEx(null);
  }

  /* ─────────────────────────────────────────── */
  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
      <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  const sortedDays = [...days].sort((a, b) => a.order_index - b.order_index);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 60 }} className="animate-fade-in">

      {/* ── Modal: Dia de Treino ── */}
      {dayModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={() => !savingDay && setDayModal(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)" }} />
          <div style={{ position: "relative", width: "100%", maxWidth: 480, background: "var(--surface)", border: "1px solid var(--border-accent)", borderRadius: 20, padding: 28, zIndex: 1, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                {dayModal.mode === "add" ? "Novo Dia de Treino" : "Editar Dia"}
              </h3>
              <button onClick={() => setDayModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12, marginBottom: 16 }}>
              <label>
                <div style={labelStyle}>LETRA</div>
                <input maxLength={2} value={dayForm.day_letter}
                  onChange={e => setDayForm(p => ({ ...p, day_letter: e.target.value }))}
                  placeholder="A"
                  style={{ ...inputStyle, textAlign: "center", fontSize: 18, fontWeight: 800, textTransform: "uppercase" }} />
              </label>
              <label>
                <div style={labelStyle}>NOME DO TREINO</div>
                <input value={dayForm.name}
                  onChange={e => setDayForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Treino A — Peito e Ombro"
                  style={inputStyle} />
              </label>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={labelStyle}>DIAS DA SEMANA (sugeridos)</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {WEEKDAYS.map(wd => (
                  <button key={wd.key} onClick={() => toggleWeekday(wd.key)}
                    style={{
                      padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                      cursor: "pointer", border: "1px solid",
                      background: dayForm.suggested_weekdays.includes(wd.key) ? "rgba(61,189,212,0.15)" : "var(--surface-2)",
                      borderColor: dayForm.suggested_weekdays.includes(wd.key) ? "rgba(61,189,212,0.4)" : "var(--border)",
                      color: dayForm.suggested_weekdays.includes(wd.key) ? "var(--accent)" : "var(--text-muted)",
                      transition: "all 0.15s",
                    }}>
                    {wd.label}
                  </button>
                ))}
              </div>
            </div>

            <label style={{ display: "block", marginBottom: 22 }}>
              <div style={labelStyle}>OBSERVAÇÕES DO DIA (opcional)</div>
              <textarea value={dayForm.day_notes}
                onChange={e => setDayForm(p => ({ ...p, day_notes: e.target.value }))}
                placeholder="Ex: Foco em contração muscular, descanso de 90s..."
                rows={3}
                style={{ ...inputStyle, width: "100%", resize: "vertical" }} />
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDayModal(null)}
                style={{ flex: 1, ...cancelBtnStyle }}>Cancelar</button>
              <button onClick={saveDay} disabled={savingDay || !dayForm.name.trim() || !dayForm.day_letter.trim()}
                style={{ flex: 2, ...primaryBtnStyle(!!dayForm.name.trim() && !!dayForm.day_letter.trim()) }}>
                {savingDay ? <Loader size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <Save size={14} />}
                {savingDay ? "Salvando..." : dayModal.mode === "add" ? "Adicionar Dia" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Exercício ── */}
      {exModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={() => !savingEx && setExModal(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)" }} />
          <div style={{ position: "relative", width: "100%", maxWidth: 540, background: "var(--surface)", border: "1px solid var(--border-accent)", borderRadius: 20, padding: 28, zIndex: 1, maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                {exModal.mode === "add" ? "Adicionar Exercício" : "Editar Exercício"}
              </h3>
              <button onClick={() => setExModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                <X size={18} />
              </button>
            </div>

            {/* Nome + Grupo muscular */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={labelStyle}>NOME DO EXERCÍCIO *</div>
                <ExercisePicker
                  value={exForm.exercise_name}
                  exercises={libraryExs}
                  onChange={(name, id, group) => setExForm(p => ({
                    ...p,
                    exercise_name: name,
                    exercise_id: id,
                    muscle_group: p.muscle_group || group,
                  }))}
                  inputStyle={inputStyle}
                />
              </div>
              <label>
                <div style={labelStyle}>GRUPO MUSCULAR</div>
                <input value={exForm.muscle_group || ""}
                  onChange={e => setExForm(p => ({ ...p, muscle_group: e.target.value }))}
                  placeholder="Ex: Peito"
                  style={{ ...inputStyle, width: "100%" }} />
              </label>
              <label>
                <div style={labelStyle}>MÉTODO</div>
                <select value={exForm.method || "normal"}
                  onChange={e => setExForm(p => ({ ...p, method: e.target.value }))}
                  style={{ ...inputStyle, width: "100%" }}>
                  {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </label>
            </div>

            {/* Séries + Medida + Reps */}
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 12, marginBottom: 14 }}>
              <label>
                <div style={labelStyle}>SÉRIES</div>
                <input type="number" min={1} max={20}
                  value={exForm.sets ?? ""}
                  onChange={e => setExForm(p => ({ ...p, sets: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="4"
                  style={{ ...inputStyle, width: "100%" }} />
              </label>
              <label>
                <div style={labelStyle}>MEDIDA</div>
                <select value={exForm.measure_type || "reps"}
                  onChange={e => setExForm(p => ({ ...p, measure_type: e.target.value }))}
                  style={{ ...inputStyle, width: "100%" }}>
                  {MEASURE_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </label>
              <label>
                <div style={labelStyle}>
                  {exForm.measure_type === "tempo" ? "TEMPO (s)" : exForm.measure_type === "distancia" ? "DISTÂNCIA (m)" : "REPETIÇÕES"}
                </div>
                <input value={exForm.reps || ""}
                  onChange={e => setExForm(p => ({ ...p, reps: e.target.value }))}
                  placeholder={exForm.measure_type === "tempo" ? "30" : exForm.measure_type === "distancia" ? "100" : "10-12"}
                  style={{ ...inputStyle, width: "100%" }} />
              </label>
            </div>

            {/* Carga + Descanso + Cadência */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              <label>
                <div style={labelStyle}>CARGA (kg)</div>
                <input type="number" min={0} step={0.5}
                  value={exForm.load_kg ?? ""}
                  onChange={e => setExForm(p => ({ ...p, load_kg: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="60"
                  style={{ ...inputStyle, width: "100%" }} />
              </label>
              <label>
                <div style={labelStyle}>DESCANSO (s)</div>
                <input type="number" min={0} step={15}
                  value={exForm.rest_seconds ?? ""}
                  onChange={e => setExForm(p => ({ ...p, rest_seconds: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="60"
                  style={{ ...inputStyle, width: "100%" }} />
              </label>
              <label>
                <div style={labelStyle}>CADÊNCIA</div>
                <input value={exForm.cadence || ""}
                  onChange={e => setExForm(p => ({ ...p, cadence: e.target.value }))}
                  placeholder="2-0-2"
                  style={{ ...inputStyle, width: "100%" }} />
              </label>
            </div>

            {/* Nota técnica */}
            <label style={{ display: "block", marginBottom: 22 }}>
              <div style={labelStyle}>NOTA TÉCNICA / OBSERVAÇÃO</div>
              <textarea value={exForm.technique_note || ""}
                onChange={e => setExForm(p => ({ ...p, technique_note: e.target.value }))}
                placeholder="Ex: Manter cotovelos fechados, não travar no topo..."
                rows={3}
                style={{ ...inputStyle, width: "100%", resize: "vertical" }} />
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setExModal(null)} style={{ flex: 1, ...cancelBtnStyle }}>Cancelar</button>
              <button onClick={saveEx} disabled={savingEx || !exForm.exercise_name.trim()}
                style={{ flex: 2, ...primaryBtnStyle(!!exForm.exercise_name.trim()) }}>
                {savingEx ? <Loader size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <Save size={14} />}
                {savingEx ? "Salvando..." : exModal.mode === "add" ? "Adicionar Exercício" : "Salvar Exercício"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ HEADER ══ */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <Link href={`/dashboard/alunos/${studentId}`}
          style={{ color: "var(--text-muted)", textDecoration: "none", display: "flex", flexShrink: 0 }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Editor de Ficha</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {plan?.name || "Ficha de Treino"}
          </h1>
        </div>
      </div>

      {/* ══ PASTA: META DA FICHA ══ */}
      <div className="glass-card" style={{ padding: 22, marginBottom: 24, border: "1px solid rgba(61,189,212,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(61,189,212,0.12)", border: "1px solid rgba(61,189,212,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18 }}>📁</span>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.5px", color: "var(--accent)", textTransform: "uppercase" }}>Pasta — Ficha de Treino</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sortedDays.length} dia{sortedDays.length !== 1 ? "s" : ""} de treino</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ gridColumn: "1 / -1" }}>
            <div style={labelStyle}>NOME DA FICHA</div>
            <input value={planName} onChange={e => setPlanName(e.target.value)}
              style={{ ...inputStyle, width: "100%", fontSize: 15, fontWeight: 700 }} />
          </label>
          <label>
            <div style={labelStyle}>OBJETIVO (opcional)</div>
            <input value={planGoal} onChange={e => setPlanGoal(e.target.value)}
              placeholder="Ex: Hipertrofia, Emagrecimento..."
              style={{ ...inputStyle, width: "100%" }} />
          </label>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button onClick={saveMeta} disabled={savingMeta || !planName.trim()}
              style={{ width: "100%", ...primaryBtnStyle(!!planName.trim()), justifyContent: "center" }}>
              {savingMeta ? <Loader size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : metaSaved ? <Check size={14} /> : <Save size={14} />}
              {savingMeta ? "Salvando..." : metaSaved ? "Salvo!" : "Salvar Nome"}
            </button>
          </div>
        </div>
      </div>

      {/* ══ DIAS DE TREINO (conteúdo da pasta) ══ */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, letterSpacing: "1px", color: "var(--text-secondary)", textTransform: "uppercase" }}>
            Dias de Treino
          </h2>
          <button onClick={openAddDay}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, background: "rgba(61,189,212,0.1)", border: "1px solid rgba(61,189,212,0.25)", color: "var(--accent)", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(61,189,212,0.18)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(61,189,212,0.1)"}
          >
            <Plus size={13} /> Novo Dia
          </button>
        </div>

        {sortedDays.length === 0 && (
          <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
            <Dumbbell size={36} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>Nenhum dia de treino ainda.</p>
            <button onClick={openAddDay} className="btn-primary">
              <Plus size={14} /> Adicionar Primeiro Dia
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sortedDays.map(day => {
            const expanded = expandedDays.has(day.id);
            const exs = [...(day.prescribed_exercises || [])].sort((a, b) => a.order_index - b.order_index);
            return (
              <div key={day.id} className="glass-card" style={{ overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>

                {/* Day header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px" }}>
                  {/* Letter badge */}
                  <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: "rgba(61,189,212,0.12)", border: "1px solid rgba(61,189,212,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "var(--accent)" }}>
                    {day.day_letter}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{day.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{exs.length} exercício{exs.length !== 1 ? "s" : ""}</span>
                      {(day.suggested_weekdays || []).map(wd => (
                        <span key={wd} style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", background: "rgba(61,189,212,0.1)", padding: "2px 6px", borderRadius: 4 }}>
                          {{ segunda: "Seg", terca: "Ter", quarta: "Qua", quinta: "Qui", sexta: "Sex", sabado: "Sáb", domingo: "Dom" }[wd] || wd}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 5, flexShrink: 0, alignItems: "center" }}>
                    <button onClick={() => openEditDay(day)} title="Editar dia"
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 7, background: "rgba(61,189,212,0.06)", border: "1px solid rgba(61,189,212,0.15)", cursor: "pointer", color: "var(--accent)", fontSize: 11, fontWeight: 600, transition: "all 0.15s" }}>
                      <Edit2 size={11} /> Editar
                    </button>
                    <button onClick={() => deleteDay(day.id)} disabled={deletingDay === day.id} title="Deletar dia"
                      style={{ display: "flex", padding: "6px 8px", borderRadius: 7, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", cursor: "pointer", color: "#ef4444", transition: "all 0.15s" }}>
                      {deletingDay === day.id ? <Loader size={12} style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={12} />}
                    </button>
                    <button onClick={() => toggleDay(day.id)}
                      style={{ display: "flex", padding: "6px 8px", borderRadius: 7, background: "var(--surface-2)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-muted)", transition: "all 0.15s" }}>
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded: exercises */}
                {expanded && (
                  <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    {day.day_notes && (
                      <div style={{ padding: "10px 18px", background: "rgba(61,189,212,0.04)", borderBottom: "1px solid var(--border-subtle)", fontSize: 12, color: "var(--text-secondary)" }}>
                        📝 {day.day_notes}
                      </div>
                    )}

                    {exs.length === 0 && (
                      <div style={{ padding: "16px 18px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                        Nenhum exercício — adicione abaixo.
                      </div>
                    )}

                    {exs.map((ex, idx) => (
                      <div key={ex.id} style={{ padding: "12px 18px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 20, marginTop: 3, fontWeight: 700 }}>{idx + 1}.</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{ex.exercise_name}</span>
                            {ex.muscle_group && <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--surface-2)", padding: "2px 7px", borderRadius: 4 }}>{ex.muscle_group}</span>}
                            {ex.method && ex.method !== "normal" && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", background: "rgba(61,189,212,0.1)", padding: "2px 7px", borderRadius: 4 }}>
                                {METHODS.find(m => m.value === ex.method)?.label || ex.method}
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            {ex.sets && <ExTag label="Séries" value={String(ex.sets)} />}
                            {ex.reps && <ExTag label={ex.measure_type === "tempo" ? "Tempo" : ex.measure_type === "distancia" ? "Dist." : "Reps"} value={ex.reps + (ex.measure_type === "tempo" ? "s" : ex.measure_type === "distancia" ? "m" : "")} />}
                            {ex.load_kg && <ExTag label="Carga" value={`${ex.load_kg} kg`} />}
                            {ex.rest_seconds && <ExTag label="Descanso" value={`${ex.rest_seconds}s`} />}
                            {ex.cadence && <ExTag label="Cadência" value={ex.cadence} />}
                          </div>
                          {ex.technique_note && (
                            <div style={{ marginTop: 5, fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
                              💬 {ex.technique_note}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          <button onClick={() => openEditEx(day.id, ex)} title="Editar exercício"
                            style={{ display: "flex", padding: "5px 7px", borderRadius: 6, background: "rgba(61,189,212,0.06)", border: "1px solid rgba(61,189,212,0.15)", cursor: "pointer", color: "var(--accent)" }}>
                            <Edit2 size={11} />
                          </button>
                          <button onClick={() => deleteEx(ex.id)} disabled={deletingEx === ex.id} title="Remover exercício"
                            style={{ display: "flex", padding: "5px 7px", borderRadius: 6, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", cursor: "pointer", color: "#ef4444" }}>
                            {deletingEx === ex.id ? <Loader size={11} style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={11} />}
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add exercise button */}
                    <div style={{ padding: "12px 18px" }}>
                      <button onClick={() => openAddEx(day.id)}
                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", borderRadius: 9, background: "rgba(61,189,212,0.04)", border: "1px dashed rgba(61,189,212,0.2)", cursor: "pointer", color: "var(--accent)", fontSize: 12, fontWeight: 600, justifyContent: "center", transition: "all 0.15s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(61,189,212,0.1)"; (e.currentTarget as HTMLElement).style.borderStyle = "solid"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(61,189,212,0.04)"; (e.currentTarget as HTMLElement).style.borderStyle = "dashed"; }}
                      >
                        <Plus size={13} /> Adicionar Exercício
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add day CTA */}
      {sortedDays.length > 0 && (
        <button onClick={openAddDay}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "14px", borderRadius: 12, background: "rgba(61,189,212,0.04)", border: "1px dashed rgba(61,189,212,0.2)", cursor: "pointer", color: "var(--accent)", fontSize: 13, fontWeight: 700, justifyContent: "center", transition: "all 0.15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(61,189,212,0.1)"; (e.currentTarget as HTMLElement).style.borderStyle = "solid"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(61,189,212,0.04)"; (e.currentTarget as HTMLElement).style.borderStyle = "dashed"; }}
        >
          <Plus size={15} /> Adicionar Novo Dia de Treino
        </button>
      )}
    </div>
  );
}

/* ── tiny components ── */
function ExTag({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
      <span style={{ color: "var(--text-muted)", marginRight: 2 }}>{label}:</span>
      <strong style={{ color: "var(--text-primary)" }}>{value}</strong>
    </span>
  );
}

/* ── style helpers ── */
const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 800, letterSpacing: "1.2px",
  color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6, display: "block",
};
const inputStyle: React.CSSProperties = {
  background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 10, padding: "10px 13px", color: "var(--text-primary)",
  fontSize: 13, outline: "none", fontFamily: "inherit",
};
const cancelBtnStyle: React.CSSProperties = {
  padding: "11px", borderRadius: 10, background: "var(--surface-2)",
  border: "1px solid var(--border)", cursor: "pointer",
  color: "var(--text-secondary)", fontWeight: 700, fontSize: 13,
};
function primaryBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: "11px 18px", borderRadius: 10, border: "none",
    cursor: active ? "pointer" : "not-allowed",
    background: active ? "var(--accent)" : "var(--surface-2)",
    color: active ? "#000" : "var(--text-muted)",
    fontWeight: 800, fontSize: 13,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
    opacity: active ? 1 : 0.6, transition: "all 0.15s",
  };
}
