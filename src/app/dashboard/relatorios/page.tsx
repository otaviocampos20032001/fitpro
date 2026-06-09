"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { TrendingUp, Users, ClipboardList, Dumbbell, CheckCircle, Clock, ChevronRight, Award } from "lucide-react";

type StudentStat = {
  id: string;
  name: string;
  email: string;
  goal?: string;
  phone?: string;
  activePlan?: { name: string; starts_at: string; days: number };
  totalPlans: number;
};

export default function RelatoriosPage() {
  const [students, setStudents] = useState<StudentStat[]>([]);
  const [totalExercises, setTotalExercises] = useState(0);
  const [totalPlans,     setTotalPlans]     = useState(0);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Alunos + planos
      const [studentsRes, plansRes, exRes] = await Promise.all([
        (supabase.from("profiles") as any)
          .select("id, name, email, goal, phone")
          .eq("trainer_id", session.user.id)
          .eq("role", "student"),
        (supabase.from("workout_plans") as any)
          .select("id, name, goal, active, starts_at, student_id, workout_days(id)")
          .eq("trainer_id", session.user.id),
        (supabase.from("exercises") as any)
          .select("id", { count: "exact", head: true })
          .or(`is_public.eq.true,created_by.eq.${session.user.id}`),
      ]);

      const allStudents: any[] = studentsRes.data || [];
      const allPlans: any[] = plansRes.data || [];
      setTotalExercises(exRes.count ?? 0);
      setTotalPlans(allPlans.length);

      const stats: StudentStat[] = allStudents.map(s => {
        const myPlans = allPlans.filter(p => p.student_id === s.id);
        const active  = myPlans.find(p => p.active);
        return {
          id: s.id, name: s.name, email: s.email, goal: s.goal, phone: s.phone,
          totalPlans: myPlans.length,
          activePlan: active ? {
            name: active.name,
            starts_at: active.starts_at,
            days: active.workout_days?.length ?? 0,
          } : undefined,
        };
      });

      setStudents(stats);
      setLoading(false);
    })();
  }, []);

  const withPlan    = students.filter(s => s.activePlan);
  const withoutPlan = students.filter(s => !s.activePlan);

  const stats = [
    { label: "Alunos",         value: students.length,              icon: Users,         color: "#3DBDD4", sub: "cadastrados" },
    { label: "Fichas ativas",  value: students.filter(s=>s.activePlan).length, icon: ClipboardList, color: "#10b981", sub: "em andamento" },
    { label: "Fichas totais",  value: totalPlans,                   icon: Award,         color: "#f59e0b", sub: "criadas" },
    { label: "Exercícios",     value: totalExercises,               icon: Dumbbell,      color: "#8b5cf6", sub: "no banco" },
  ];

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
      <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }} className="animate-fade-in">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
          <TrendingUp size={22} color="var(--accent)" />
          Relatórios
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>Visão geral da sua base de alunos</p>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {stats.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="glass-card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${color}18`, border: `1px solid ${color}28`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={17} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginTop: 4 }}>{label}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Alunos COM ficha */}
      {withPlan.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <CheckCircle size={16} color="#10b981" />
            Alunos com ficha ativa
            <span style={{ fontSize: 11, background: "rgba(16,185,129,0.12)", color: "#10b981", padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>{withPlan.length}</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {withPlan.map(s => (
              <Link key={s.id} href={`/dashboard/alunos/${s.id}`} style={{ textDecoration: "none" }}>
                <div className="glass-card glass-card-hover" style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, #3DBDD4, #2196ac)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 800, color: "#000",
                      boxShadow: "0 0 12px rgba(61,189,212,0.2)",
                    }}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{s.name}</span>
                        {s.goal && <span style={{ fontSize: 11, color: "var(--accent)" }}>🎯 {s.goal}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>
                        {s.activePlan?.name}
                      </div>
                      <div style={{ display: "flex", gap: 14, marginTop: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          🏋️ {s.activePlan?.days} dia{s.activePlan?.days !== 1 ? "s" : ""} de treino
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          📅 Desde {s.activePlan?.starts_at ? new Date(s.activePlan.starts_at).toLocaleDateString("pt-BR") : "—"}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          📋 {s.totalPlans} versão{s.totalPlans !== 1 ? "ões" : ""}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Alunos SEM ficha */}
      {withoutPlan.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Clock size={16} color="var(--orange)" />
            Aguardando ficha
            <span style={{ fontSize: 11, background: "rgba(245,158,11,0.12)", color: "var(--orange)", padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>{withoutPlan.length}</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {withoutPlan.map(s => (
              <Link key={s.id} href={`/dashboard/alunos/${s.id}`} style={{ textDecoration: "none" }}>
                <div className="glass-card glass-card-hover" style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, #334155, #1e293b)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 800, color: "#94a3b8",
                    }}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                        Sem ficha ativa
                        {s.goal && <span style={{ color: "var(--text-secondary)", marginLeft: 8 }}>· {s.goal}</span>}
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/alunos/${s.id}/ficha/novo`}
                      className="btn-primary"
                      style={{ textDecoration: "none", fontSize: 11, padding: "6px 12px" }}
                      onClick={e => e.stopPropagation()}
                    >
                      Criar ficha
                    </Link>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sem alunos */}
      {students.length === 0 && (
        <div className="glass-card" style={{ padding: 48, textAlign: "center" }}>
          <TrendingUp size={44} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 8 }}>Sem dados ainda</h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Cadastre alunos para ver os relatórios aqui.</p>
          <Link href="/dashboard/alunos/novo" className="btn-primary" style={{ textDecoration: "none" }}>
            Adicionar primeiro aluno
          </Link>
        </div>
      )}

      {/* Observação footer */}
      {students.length > 0 && (
        <div style={{ marginTop: 8, padding: "10px 14px", background: "rgba(61,189,212,0.04)", border: "1px solid rgba(61,189,212,0.1)", borderRadius: 10, fontSize: 11, color: "var(--text-muted)" }}>
          💡 Em breve: evolução de cargas por aluno, frequência de treinos, gráficos de progresso.
        </div>
      )}
    </div>
  );
}
