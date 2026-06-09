"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Plus, ClipboardList, Phone, Target,
  Mail, Calendar, History, ChevronDown, ChevronUp, Dumbbell,
  CheckCircle, Copy, KeyRound, Edit2, Archive, Users,
  X, RotateCcw, Loader,
} from "lucide-react";

type Student = { id: string; name: string; email: string; phone?: string; goal?: string };

type PrescribedEx = {
  id: string; exercise_name: string; muscle_group?: string;
  method?: string; sets?: number; measure_type?: string; reps?: string;
  load_kg?: number; rest_seconds?: number; cadence?: string; technique_note?: string;
  order_index: number;
};

type Day = {
  id: string; day_letter: string; name: string;
  suggested_weekdays: string[] | null; day_notes?: string;
  order_index: number; prescribed_exercises: PrescribedEx[];
};

type Plan = {
  id: string; name: string; goal?: string;
  starts_at: string; active: boolean; created_at: string;
  workout_days: Day[];
};

const WEEKDAY_PT: Record<string, string> = {
  segunda: "Seg", terca: "Ter", quarta: "Qua",
  quinta: "Qui", sexta: "Sex", sabado: "Sáb", domingo: "Dom",
};

const METHOD_LABELS: Record<string, string> = {
  biset: "Bi-set", triset: "Tri-set", dropset: "Drop Set",
  piramide: "Pirâmide", superserie: "Supersérie",
  amrap: "AMRAP", isometrico: "Isométrico", circuito: "Circuito",
};

const MEASURE_LABELS: Record<string, string> = {
  tempo: "s", distancia: "m",
};

export default function AlunoDetailPage() {
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent]         = useState<Student | null>(null);
  const [activePlan, setActivePlan]   = useState<Plan | null>(null);
  const [planHistory, setPlanHistory] = useState<Plan[]>([]);
  const [loading, setLoading]         = useState(true);
  const [isTrainer, setIsTrainer]     = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  /* ── Reenvio de acesso ── */
  const [sendingAccess, setSendingAccess] = useState(false);
  const [accessMsg, setAccessMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  /* ── Editar ficha ── */
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  /* ── Arquivar ficha ── */
  const [archiving, setArchiving] = useState(false);

  /* ── Clonar ficha ── */
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneStudents, setCloneStudents] = useState<Student[]>([]);
  const [cloneTargetId, setCloneTargetId] = useState("");
  const [cloning, setCloning] = useState(false);
  const [cloneMsg, setCloneMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  /* ── Restaurar ficha antiga ── */
  const [restoring, setRestoring] = useState<string | null>(null);

  function reloadPlans() {
    const supabase = createClient();
    (supabase.from("workout_plans") as any)
      .select("*, workout_days(*, prescribed_exercises(*))")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => {
        const all: Plan[] = data || [];
        setActivePlan(all.find(p => p.active) || null);
        setPlanHistory(all.filter(p => !p.active));
      });
  }

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [profileRes, studentRes, plansRes] = await Promise.all([
        (supabase.from("profiles") as any).select("role").eq("id", session.user.id).single(),
        (supabase.from("profiles") as any).select("*").eq("id", studentId).single(),
        (supabase.from("workout_plans") as any)
          .select("*, workout_days(*, prescribed_exercises(*))")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false }),
      ]);

      setIsTrainer(profileRes.data?.role === "trainer");
      setStudent(studentRes.data);
      const all: Plan[] = plansRes.data || [];
      setActivePlan(all.find(p => p.active) || null);
      setPlanHistory(all.filter(p => !p.active));
      setLoading(false);
    })();
  }, [studentId]);

  /* ── Reenviar acesso ── */
  async function handleSendAccess() {
    if (!student?.email) return;
    setSendingAccess(true);
    setAccessMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(student.email);
      if (error) throw error;
      setAccessMsg({ type: "ok", text: `Email de acesso enviado para ${student.email}` });
    } catch (e: any) {
      setAccessMsg({ type: "err", text: e?.message || "Erro ao enviar email" });
    } finally {
      setSendingAccess(false);
    }
  }

  function copyEmail() {
    if (!student?.email) return;
    navigator.clipboard.writeText(student.email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function toggleDay(id: string) {
    setExpandedDays(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /* ── Abrir modal de edição ── */
  function openEditModal() {
    if (!activePlan) return;
    setEditName(activePlan.name);
    setEditGoal(activePlan.goal || "");
    setShowEditModal(true);
  }

  /* ── Salvar edição ── */
  async function handleSaveEdit() {
    if (!activePlan || !editName.trim()) return;
    setSavingEdit(true);
    try {
      const supabase = createClient();
      const { error } = await (supabase.from("workout_plans") as any)
        .update({ name: editName.trim(), goal: editGoal.trim() || null })
        .eq("id", activePlan.id);
      if (error) throw error;
      setShowEditModal(false);
      reloadPlans();
    } catch (e: any) {
      alert(e?.message || "Erro ao salvar");
    } finally {
      setSavingEdit(false);
    }
  }

  /* ── Arquivar ficha ── */
  async function handleArchive() {
    if (!activePlan) return;
    if (!confirm(`Arquivar a ficha "${activePlan.name}"? Ela poderá ser restaurada depois.`)) return;
    setArchiving(true);
    try {
      const supabase = createClient();
      const { error } = await (supabase.from("workout_plans") as any)
        .update({ active: false })
        .eq("id", activePlan.id);
      if (error) throw error;
      reloadPlans();
    } catch (e: any) {
      alert(e?.message || "Erro ao arquivar");
    } finally {
      setArchiving(false);
    }
  }

  /* ── Restaurar ficha antiga ── */
  async function handleRestore(planId: string) {
    if (!confirm("Restaurar esta ficha? A ficha atual será arquivada.")) return;
    setRestoring(planId);
    try {
      const supabase = createClient();
      // Arquiva todas as fichas ativas
      if (activePlan) {
        await (supabase.from("workout_plans") as any)
          .update({ active: false })
          .eq("id", activePlan.id);
      }
      // Ativa a ficha selecionada
      const { error } = await (supabase.from("workout_plans") as any)
        .update({ active: true })
        .eq("id", planId);
      if (error) throw error;
      reloadPlans();
    } catch (e: any) {
      alert(e?.message || "Erro ao restaurar");
    } finally {
      setRestoring(null);
    }
  }

  /* ── Abrir modal de clone (carrega alunos) ── */
  async function openCloneModal() {
    setCloneMsg(null);
    setCloneTargetId("");
    setShowCloneModal(true);
    if (cloneStudents.length === 0) {
      const supabase = createClient();
      const { data } = await (supabase.from("profiles") as any)
        .select("id, name, email")
        .eq("role", "student")
        .neq("id", studentId)
        .order("name");
      setCloneStudents(data || []);
    }
  }

  /* ── Clonar ficha para outro aluno ── */
  async function handleClone() {
    if (!activePlan || !cloneTargetId) return;
    setCloning(true);
    setCloneMsg(null);
    try {
      const supabase = createClient();

      // 1. Cria nova ficha no aluno destino
      const { data: newPlan, error: planErr } = await (supabase.from("workout_plans") as any)
        .insert({
          student_id: cloneTargetId,
          name: activePlan.name,
          goal: activePlan.goal,
          active: true,
          starts_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (planErr) throw planErr;

      // 2. Arquiva fichas ativas existentes do aluno destino (exceto a que acabamos de criar)
      await (supabase.from("workout_plans") as any)
        .update({ active: false })
        .eq("student_id", cloneTargetId)
        .neq("id", newPlan.id)
        .eq("active", true);

      // 3. Clona cada dia de treino
      const days = [...(activePlan.workout_days || [])].sort((a, b) => a.order_index - b.order_index);
      for (const day of days) {
        const { data: newDay, error: dayErr } = await (supabase.from("workout_days") as any)
          .insert({
            plan_id: newPlan.id,
            day_letter: day.day_letter,
            name: day.name,
            suggested_weekdays: day.suggested_weekdays,
            day_notes: day.day_notes,
            order_index: day.order_index,
          })
          .select()
          .single();
        if (dayErr) throw dayErr;

        // 4. Clona os exercícios de cada dia
        const exs = [...(day.prescribed_exercises || [])].sort((a, b) => a.order_index - b.order_index);
        if (exs.length > 0) {
          const { error: exErr } = await (supabase.from("prescribed_exercises") as any)
            .insert(exs.map(ex => ({
              day_id: newDay.id,
              exercise_name: ex.exercise_name,
              muscle_group: ex.muscle_group,
              method: ex.method,
              sets: ex.sets,
              measure_type: ex.measure_type,
              reps: ex.reps,
              load_kg: ex.load_kg,
              rest_seconds: ex.rest_seconds,
              cadence: ex.cadence,
              technique_note: ex.technique_note,
              order_index: ex.order_index,
            })));
          if (exErr) throw exErr;
        }
      }

      const target = cloneStudents.find(s => s.id === cloneTargetId);
      setCloneMsg({ type: "ok", text: `Ficha clonada com sucesso para ${target?.name || "o aluno"}!` });
    } catch (e: any) {
      setCloneMsg({ type: "err", text: e?.message || "Erro ao clonar ficha" });
    } finally {
      setCloning(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!student) {
    return <div style={{ textAlign: "center", paddingTop: 80, color: "var(--text-secondary)" }}>Aluno não encontrado</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }} className="animate-fade-in">

      {/* ── Modais ── */}

      {/* Modal: Editar Ficha */}
      {showEditModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={() => setShowEditModal(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
          <div style={{ position: "relative", width: "100%", maxWidth: 440, background: "var(--surface)", border: "1px solid var(--border-accent)", borderRadius: 20, padding: 28, zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>Editar Ficha</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                <X size={18} />
              </button>
            </div>
            <label style={{ display: "block", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", color: "var(--text-muted)", marginBottom: 6 }}>NOME DA FICHA</div>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", color: "var(--text-primary)", fontSize: 14, outline: "none" }}
              />
            </label>
            <label style={{ display: "block", marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", color: "var(--text-muted)", marginBottom: 6 }}>OBJETIVO (opcional)</div>
              <input
                value={editGoal}
                onChange={e => setEditGoal(e.target.value)}
                placeholder="Ex: Hipertrofia, Emagrecimento..."
                style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", color: "var(--text-primary)", fontSize: 14, outline: "none" }}
              />
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-secondary)", fontWeight: 700, fontSize: 13 }}>
                Cancelar
              </button>
              <button onClick={handleSaveEdit} disabled={savingEdit || !editName.trim()} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "var(--accent)", border: "none", cursor: "pointer", color: "#000", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {savingEdit ? <Loader size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : null}
                {savingEdit ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Clonar Ficha */}
      {showCloneModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={() => !cloning && setShowCloneModal(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
          <div style={{ position: "relative", width: "100%", maxWidth: 440, background: "var(--surface)", border: "1px solid var(--border-accent)", borderRadius: 20, padding: 28, zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>Clonar Ficha</h3>
              <button onClick={() => setShowCloneModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>
              Clona <strong style={{ color: "var(--text-primary)" }}>"{activePlan?.name}"</strong> para outro aluno (incluindo todos os dias e exercícios).
            </p>
            <label style={{ display: "block", marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", color: "var(--text-muted)", marginBottom: 8 }}>SELECIONAR ALUNO DESTINO</div>
              {cloneStudents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>
                  <Loader size={16} style={{ animation: "spin 0.8s linear infinite", marginBottom: 8 }} />
                  <div>Carregando alunos...</div>
                </div>
              ) : (
                <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {cloneStudents.map(s => (
                    <button key={s.id} onClick={() => setCloneTargetId(s.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                        borderRadius: 10, cursor: "pointer", textAlign: "left",
                        background: cloneTargetId === s.id ? "rgba(61,189,212,0.1)" : "var(--surface-2)",
                        border: `1px solid ${cloneTargetId === s.id ? "rgba(61,189,212,0.35)" : "var(--border)"}`,
                        transition: "all 0.15s",
                      }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#3DBDD4,#2196ac)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#000", flexShrink: 0 }}>
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.email}</div>
                      </div>
                      {cloneTargetId === s.id && <CheckCircle size={16} color="var(--accent)" />}
                    </button>
                  ))}
                </div>
              )}
            </label>

            {cloneMsg && (
              <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, fontSize: 13,
                background: cloneMsg.type === "ok" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${cloneMsg.type === "ok" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                color: cloneMsg.type === "ok" ? "var(--green)" : "#ef4444",
              }}>
                {cloneMsg.text}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowCloneModal(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-secondary)", fontWeight: 700, fontSize: 13 }}>
                Fechar
              </button>
              <button onClick={handleClone} disabled={!cloneTargetId || cloning}
                style={{ flex: 1, padding: "11px", borderRadius: 10, background: cloneTargetId ? "var(--accent)" : "var(--surface-2)", border: "none", cursor: cloneTargetId ? "pointer" : "not-allowed", color: cloneTargetId ? "#000" : "var(--text-muted)", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}>
                {cloning ? <Loader size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : null}
                {cloning ? "Clonando..." : "Clonar Ficha"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <Link href="/dashboard/alunos" style={{ color: "var(--text-muted)", textDecoration: "none", display: "flex", flexShrink: 0 }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{student.name}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 1 }}>Perfil do aluno</p>
        </div>
        {isTrainer && (
          <Link href={`/dashboard/alunos/${studentId}/ficha/novo`} className="btn-primary" style={{ textDecoration: "none", fontSize: 12, padding: "9px 16px", flexShrink: 0, whiteSpace: "nowrap" }}>
            <Plus size={14} /> Nova Ficha
          </Link>
        )}
      </div>

      {/* Student card */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        {/* Top: avatar + info */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #3DBDD4, #2a9fb5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 700, color: "#000",
            boxShadow: "0 0 20px rgba(61,189,212,0.25)",
          }}>
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{student.name}</div>
            {student.goal && (
              <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Target size={12} />{student.goal}
              </span>
            )}
          </div>
        </div>

        {/* Email — destaque com copiar */}
        <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: "14px 16px", marginBottom: 12, border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--text-muted)", marginBottom: 6 }}>EMAIL DE ACESSO</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Mail size={14} color="var(--accent)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: student.email ? "var(--text-primary)" : "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {student.email || "Email não cadastrado"}
            </span>
            {student.email && (
              <button onClick={copyEmail} title="Copiar email" style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "var(--green)" : "var(--text-muted)", display: "flex", padding: 4, borderRadius: 6, transition: "color 0.15s", flexShrink: 0 }}>
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              </button>
            )}
          </div>
        </div>

        {/* Phone */}
        {student.phone && (
          <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: "12px 16px", marginBottom: 12, border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--text-muted)", marginBottom: 6 }}>TELEFONE</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Phone size={14} color="var(--accent)" />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{student.phone}</span>
            </div>
          </div>
        )}

        {/* Botão Reenviar Acesso */}
        {isTrainer && student.email && (
          <div style={{ marginBottom: 16 }}>
            <button onClick={handleSendAccess} disabled={sendingAccess}
              style={{
                width: "100%", borderRadius: 12, padding: "12px 16px",
                background: sendingAccess ? "rgba(61,189,212,0.05)" : "rgba(61,189,212,0.08)",
                border: "1px solid rgba(61,189,212,0.2)",
                cursor: sendingAccess ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                color: "var(--accent)", fontSize: 13, fontWeight: 700, transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!sendingAccess) (e.currentTarget as HTMLElement).style.background = "rgba(61,189,212,0.14)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(61,189,212,0.08)"; }}
            >
              <KeyRound size={14} />
              {sendingAccess ? "Enviando..." : "Reenviar Acesso por Email"}
            </button>
            {accessMsg && (
              <div style={{
                marginTop: 8, padding: "10px 14px", borderRadius: 10, fontSize: 13,
                background: accessMsg.type === "ok" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${accessMsg.type === "ok" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                color: accessMsg.type === "ok" ? "var(--green)" : "#ef4444",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                {accessMsg.type === "ok" ? <CheckCircle size={13} /> : null}
                {accessMsg.text}
              </div>
            )}
          </div>
        )}

        {/* Stats mini */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { label: "Ficha ativa", value: activePlan ? "Sim ✓" : "Não" },
            { label: "Versões", value: String(1 + planHistory.length) },
            { label: "Dias de treino", value: String(activePlan?.workout_days?.length || 0) },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "var(--surface-2)", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Active plan */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <ClipboardList size={18} color="var(--accent)" /> Ficha de Treino Ativa
          </h2>
          {isTrainer && activePlan && (
            <Link href={`/dashboard/alunos/${studentId}/ficha/novo`} style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
              + Nova versão
            </Link>
          )}
        </div>

        {activePlan ? (
          <div>
            {/* Plan meta card com ações */}
            <div className="glass-card" style={{ padding: "16px 20px", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{activePlan.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    {activePlan.goal && <span style={{ color: "var(--accent)" }}>🎯 {activePlan.goal}</span>}
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Calendar size={11} /> Desde {new Date(activePlan.starts_at).toLocaleDateString("pt-BR")}
                    </span>
                    <span>{activePlan.workout_days?.length || 0} treinos</span>
                  </div>
                </div>

                {/* Botões de ação */}
                {isTrainer && (
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={openEditModal} title="Editar ficha"
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, background: "rgba(61,189,212,0.06)", border: "1px solid rgba(61,189,212,0.15)", cursor: "pointer", color: "var(--accent)", fontSize: 12, fontWeight: 600, transition: "all 0.15s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(61,189,212,0.12)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(61,189,212,0.06)"}
                    >
                      <Edit2 size={12} /> Editar
                    </button>
                    <button onClick={openCloneModal} title="Clonar para outro aluno"
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", cursor: "pointer", color: "#60a5fa", fontSize: 12, fontWeight: 600, transition: "all 0.15s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.12)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.06)"}
                    >
                      <Users size={12} /> Clonar
                    </button>
                    <button onClick={handleArchive} disabled={archiving} title="Arquivar ficha"
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", cursor: archiving ? "not-allowed" : "pointer", color: "#ef4444", fontSize: 12, fontWeight: 600, transition: "all 0.15s" }}
                      onMouseEnter={e => { if (!archiving) (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; }}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.05)"}
                    >
                      {archiving ? <Loader size={12} style={{ animation: "spin 0.8s linear infinite" }} /> : <Archive size={12} />}
                      Arquivar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Day cards - expandable */}
            {[...(activePlan.workout_days || [])]
              .sort((a, b) => a.order_index - b.order_index)
              .map(day => {
                const expanded = expandedDays.has(day.id);
                const exs = [...(day.prescribed_exercises || [])].sort((a, b) => a.order_index - b.order_index);
                return (
                  <div key={day.id} className="glass-card" style={{ marginBottom: 10, overflow: "hidden" }}>
                    <button
                      onClick={() => toggleDay(day.id)}
                      style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "rgba(61,189,212,0.15)", border: "1px solid rgba(61,189,212,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "var(--accent)" }}>
                        {day.day_letter}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{day.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            <Dumbbell size={10} style={{ display: "inline", marginRight: 3 }} />
                            {exs.length} exercício{exs.length !== 1 ? "s" : ""}
                          </span>
                          {day.suggested_weekdays?.map(wd => (
                            <span key={wd} style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", background: "rgba(61,189,212,0.12)", padding: "2px 6px", borderRadius: 4 }}>
                              {WEEKDAY_PT[wd] || wd}
                            </span>
                          ))}
                        </div>
                      </div>
                      {expanded ? <ChevronUp size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
                    </button>

                    {expanded && (
                      <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        {day.day_notes && (
                          <div style={{ padding: "10px 20px", background: "rgba(61,189,212,0.05)", borderBottom: "1px solid var(--border-subtle)", fontSize: 12, color: "var(--text-secondary)" }}>
                            📝 {day.day_notes}
                          </div>
                        )}
                        {exs.length === 0 && (
                          <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                            Nenhum exercício cadastrado
                          </div>
                        )}
                        {exs.map((ex, idx) => (
                          <div key={ex.id} style={{ padding: "12px 20px", borderBottom: idx < exs.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", minWidth: 20 }}>{idx + 1}.</span>
                                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{ex.exercise_name}</span>
                                  {ex.method && ex.method !== "normal" && (
                                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", background: "rgba(61,189,212,0.12)", padding: "2px 7px", borderRadius: 5 }}>
                                      {METHOD_LABELS[ex.method] || ex.method}
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", paddingLeft: 28 }}>
                                  {ex.sets && (
                                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Séries: </span>
                                      <strong>{ex.sets}</strong>
                                    </span>
                                  )}
                                  {ex.reps && (
                                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                                        {ex.measure_type === "tempo" ? "Tempo: " : ex.measure_type === "distancia" ? "Distância: " : "Reps: "}
                                      </span>
                                      <strong>{ex.reps}{ex.measure_type && MEASURE_LABELS[ex.measure_type] ? ` ${MEASURE_LABELS[ex.measure_type]}` : ""}</strong>
                                    </span>
                                  )}
                                  {ex.load_kg && (
                                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Carga: </span>
                                      <strong>{ex.load_kg} kg</strong>
                                    </span>
                                  )}
                                  {ex.rest_seconds && (
                                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Descanso: </span>
                                      <strong>{ex.rest_seconds}s</strong>
                                    </span>
                                  )}
                                  {ex.cadence && (
                                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Cadência: </span>
                                      <strong>{ex.cadence}</strong>
                                    </span>
                                  )}
                                </div>
                                {ex.technique_note && (
                                  <div style={{ paddingLeft: 28, marginTop: 5, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                                    💬 {ex.technique_note}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
            <ClipboardList size={44} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Nenhuma ficha ativa</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>
              {isTrainer ? "Crie uma ficha de treino personalizada para este aluno." : "Aguardando seu Personal criar sua ficha de treino."}
            </p>
            {isTrainer && (
              <Link href={`/dashboard/alunos/${studentId}/ficha/novo`} className="btn-primary" style={{ textDecoration: "none" }}>
                <Plus size={16} /> Criar Ficha de Treino
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Fichas anteriores */}
      {planHistory.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <History size={18} color="var(--text-muted)" /> Fichas Anteriores
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {planHistory.map(plan => (
              <div key={plan.id} className="glass-card" style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{plan.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {new Date(plan.created_at).toLocaleDateString("pt-BR")} · {plan.workout_days?.length || 0} dia{plan.workout_days?.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--surface-2)", padding: "4px 10px", borderRadius: 6 }}>Arquivada</span>
                  {isTrainer && (
                    <button onClick={() => handleRestore(plan.id)} disabled={restoring === plan.id} title="Restaurar esta ficha como ativa"
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, background: "rgba(61,189,212,0.06)", border: "1px solid rgba(61,189,212,0.15)", cursor: restoring === plan.id ? "not-allowed" : "pointer", color: "var(--accent)", fontSize: 11, fontWeight: 600, transition: "all 0.15s" }}
                    >
                      {restoring === plan.id ? <Loader size={10} style={{ animation: "spin 0.8s linear infinite" }} /> : <RotateCcw size={10} />}
                      Restaurar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
