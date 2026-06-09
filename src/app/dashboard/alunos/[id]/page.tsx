"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Plus, ClipboardList, Phone, Target,
  Mail, Calendar, History, ChevronDown, ChevronUp, Dumbbell,
  Send, CheckCircle, Copy, KeyRound,
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

  const [student, setStudent] = useState<Student | null>(null);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [planHistory, setPlanHistory] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTrainer, setIsTrainer] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [sendingAccess, setSendingAccess] = useState(false);
  const [accessMsg, setAccessMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

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
      const active = all.find(p => p.active) || null;
      setActivePlan(active);
      setPlanHistory(all.filter(p => !p.active));
      setLoading(false);
    })();
  }, [studentId]);

  async function handleSendAccess() {
    if (!student?.email) return;
    setSendingAccess(true);
    setAccessMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(student.email, {
        redirectTo: `${window.location.origin}/dashboard`,
      });
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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <Link href="/dashboard/alunos" style={{ color: "var(--text-muted)", textDecoration: "none", display: "flex" }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{student.name}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>Perfil do aluno</p>
        </div>
        {isTrainer && (
          <Link href={`/dashboard/alunos/${studentId}/ficha/novo`} className="btn-primary" style={{ textDecoration: "none", fontSize: 13 }}>
            <Plus size={15} /> Nova Ficha
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
        <div style={{
          background: "var(--surface-2)", borderRadius: 12, padding: "14px 16px",
          marginBottom: 12, border: "1px solid var(--border-subtle)",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--text-muted)", marginBottom: 6 }}>
            EMAIL DE ACESSO
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Mail size={14} color="var(--accent)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: student.email ? "var(--text-primary)" : "var(--text-muted)", flex: 1 }}>
              {student.email || "Email não cadastrado"}
            </span>
            {student.email && (
              <button onClick={copyEmail} title="Copiar email"
                style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "var(--green)" : "var(--text-muted)", display: "flex", padding: 4, borderRadius: 6, transition: "color 0.15s" }}>
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
                color: "var(--accent)", fontSize: 13, fontWeight: 700,
                transition: "all 0.15s",
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <ClipboardList size={18} color="var(--accent)" /> Ficha de Treino Ativa
          </h2>
          {isTrainer && activePlan && (
            <Link href={`/dashboard/alunos/${studentId}/ficha/novo`} style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
              + Nova versão
            </Link>
          )}
        </div>

        {activePlan ? (
          <div>
            {/* Plan meta card */}
            <div className="glass-card" style={{ padding: "14px 20px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{activePlan.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 12 }}>
                  {activePlan.goal && <span style={{ color: "var(--accent)" }}>🎯 {activePlan.goal}</span>}
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={11} /> Desde {new Date(activePlan.starts_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {activePlan.workout_days?.length || 0} treinos
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
                    {/* Day header — clickable */}
                    <button
                      onClick={() => toggleDay(day.id)}
                      style={{
                        width: "100%", background: "none", border: "none", cursor: "pointer",
                        padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: "rgba(61,189,212,0.15)", border: "1px solid rgba(61,189,212,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 800, color: "var(--accent)",
                      }}>
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

                    {/* Exercises — shown when expanded */}
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
                          <div key={ex.id} style={{
                            padding: "12px 20px",
                            borderBottom: idx < exs.length - 1 ? "1px solid var(--border-subtle)" : "none",
                          }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                              <div style={{ flex: 1 }}>
                                {/* Exercise number + name */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", minWidth: 20 }}>{idx + 1}.</span>
                                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{ex.exercise_name}</span>
                                  {ex.method && ex.method !== "normal" && (
                                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", background: "rgba(61,189,212,0.12)", padding: "2px 7px", borderRadius: 5 }}>
                                      {METHOD_LABELS[ex.method] || ex.method}
                                    </span>
                                  )}
                                </div>

                                {/* Stats row */}
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

                                {/* Technique note */}
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
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
              Nenhuma ficha ativa
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>
              {isTrainer
                ? "Crie uma ficha de treino personalizada para este aluno."
                : "Aguardando seu Personal criar sua ficha de treino."}
            </p>
            {isTrainer && (
              <Link href={`/dashboard/alunos/${studentId}/ficha/novo`} className="btn-primary" style={{ textDecoration: "none" }}>
                <Plus size={16} /> Criar Ficha de Treino
              </Link>
            )}
          </div>
        )}
      </div>

      {/* History */}
      {planHistory.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <History size={18} color="var(--text-muted)" /> Fichas Anteriores
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {planHistory.map(plan => (
              <div key={plan.id} className="glass-card" style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{plan.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {new Date(plan.created_at).toLocaleDateString("pt-BR")} · {plan.workout_days?.length || 0} dia{plan.workout_days?.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--surface-2)", padding: "4px 10px", borderRadius: 6 }}>Arquivada</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
