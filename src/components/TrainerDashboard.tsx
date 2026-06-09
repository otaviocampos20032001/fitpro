"use client";
import Link from "next/link";
import {
  Users, TrendingUp, Flame, AlertCircle, Plus,
  ChevronRight, Clock, Dumbbell, ClipboardList,
  BarChart3, UserPlus, FileText, Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile  { id: string; name: string; email: string; avatar_url?: string; role: string; }
interface Session  { id: string; student_id: string; status: string; created_at: string; duration_minutes?: number; profiles?: { name: string; avatar_url?: string } | null; }

const GREETINGS = [
  "Bom trabalho, {name}.",
  "Pronto para transformar vidas, {name}?",
  "Vamos em frente, {name}.",
  "Foco total, {name}.",
];

function getGreeting(name: string) {
  const h = new Date().getHours();
  const g = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return `${g}, ${name}.`;
}

export default function TrainerDashboard({
  profile, students, recentSessions,
}: {
  profile: Profile;
  students: Profile[];
  recentSessions: Session[];
}) {
  const today    = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const firstName = profile.name.split(" ")[0];

  const trainedToday = recentSessions.filter(s => s.created_at.startsWith(todayStr) && s.status === "completed").length;
  const trainedThisWeek = recentSessions.filter(s => {
    const diff = (today.getTime() - new Date(s.created_at).getTime()) / 86400000;
    return diff <= 7 && s.status === "completed";
  }).length;
  const inactive = students.filter(s => {
    const last = recentSessions.find(r => r.student_id === s.id);
    if (!last) return true;
    return (today.getTime() - new Date(last.created_at).getTime()) / 86400000 > 5;
  });

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }} className="animate-fade-in">

      {/* ══════════════════════════════════
          HEADER
      ══════════════════════════════════ */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          {/* Label */}
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "3px", color: "var(--accent)", marginBottom: 8, opacity: 0.7 }}>
            PAINEL DO PERSONAL TRAINER
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.5px", lineHeight: 1 }}>
            {getGreeting(firstName)} 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: 13, letterSpacing: "0.3px" }}>
            {today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link href="/dashboard/alunos/novo" style={{
          textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
          padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700,
          background: "linear-gradient(135deg, #3DBDD4, #1ab0ff)",
          color: "#000", letterSpacing: "0.3px",
          boxShadow: "0 4px 20px rgba(61,189,212,0.25)",
          transition: "all 0.2s",
        }}>
          <UserPlus size={16} />
          Adicionar Aluno
        </Link>
      </div>

      {/* ══════════════════════════════════
          STATS
      ══════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 28 }}>
        {([
          { label: "Total de Alunos",   value: students.length,  icon: Users,         color: "#3DBDD4", from: "rgba(61,189,212,0.12)",  to: "rgba(61,189,212,0.04)",  bar: "#3DBDD4" },
          { label: "Treinaram Hoje",    value: trainedToday,     icon: Flame,         color: "#10b981", from: "rgba(16,185,129,0.12)",  to: "rgba(16,185,129,0.04)",  bar: "#10b981" },
          { label: "Esta Semana",       value: trainedThisWeek,  icon: TrendingUp,    color: "#3b82f6", from: "rgba(59,130,246,0.12)",  to: "rgba(59,130,246,0.04)",  bar: "#3b82f6" },
          { label: "Inativos (+5 dias)", value: inactive.length, icon: AlertCircle,   color: "#f59e0b", from: "rgba(245,158,11,0.12)",  to: "rgba(245,158,11,0.04)",  bar: "#f59e0b" },
        ] as any[]).map(({ label, value, icon: Icon, color, from, to, bar }) => (
          <div key={label} style={{
            borderRadius: 18, padding: "20px 22px",
            background: `linear-gradient(145deg, ${from} 0%, ${to} 100%)`,
            border: `1px solid ${color}22`,
            position: "relative", overflow: "hidden",
            boxShadow: `0 4px 24px ${color}10`,
          }}>
            {/* Top accent bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${bar}, transparent)` }} />
            {/* Icon */}
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Icon size={20} color={color} />
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1, marginBottom: 6 }}>{value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.5px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════
          CONTENT GRID
      ══════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, marginBottom: 18 }}>

        {/* ── SEUS ALUNOS ── */}
        <div style={{
          borderRadius: 20, padding: "22px",
          background: "linear-gradient(145deg, var(--surface) 0%, var(--surface-2) 100%)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "2px", color: "var(--accent)", marginBottom: 4 }}>SEUS ALUNOS</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{students.length} cadastrado{students.length !== 1 ? "s" : ""}</div>
            </div>
            <Link href="/dashboard/alunos" style={{ color: "var(--text-muted)", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
              Ver todos <ChevronRight size={13} />
            </Link>
          </div>

          {students.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Users size={36} color="var(--text-muted)" style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Nenhum aluno ainda</p>
              <Link href="/dashboard/alunos/novo" style={{
                textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
                marginTop: 14, padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                background: "rgba(61,189,212,0.1)", color: "var(--accent)", border: "1px solid rgba(61,189,212,0.2)",
              }}>
                <Plus size={13} /> Adicionar primeiro aluno
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {students.map((student) => {
                const last   = recentSessions.find(r => r.student_id === student.id);
                const daysAgo = last ? Math.floor((today.getTime() - new Date(last.created_at).getTime()) / 86400000) : null;
                const isActive = daysAgo !== null && daysAgo <= 2;
                const isWarn   = daysAgo === null || daysAgo > 5;
                const dotColor = isActive ? "#10b981" : isWarn ? "#f59e0b" : "#3b82f6";

                return (
                  <Link key={student.id} href={`/dashboard/alunos/${student.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 14px", borderRadius: 12,
                      background: "var(--surface-2)",
                      border: "1px solid transparent",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(61,189,212,0.15)"; el.style.background = "var(--surface-3)"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "transparent"; el.style.background = "var(--surface-2)"; }}
                    >
                      {/* Avatar */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%",
                          background: "linear-gradient(135deg, #3DBDD4, #2196ac)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 15, fontWeight: 800, color: "#000",
                          boxShadow: "0 2px 10px rgba(61,189,212,0.2)",
                        }}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{
                          position: "absolute", bottom: 1, right: 1,
                          width: 9, height: 9, borderRadius: "50%",
                          background: dotColor,
                          border: "2px solid var(--surface-2)",
                          boxShadow: `0 0 6px ${dotColor}`,
                        }} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {student.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <Clock size={9} />
                          {daysAgo === null ? "Nunca treinou" : daysAgo === 0 ? "Treinou hoje" : `Há ${daysAgo} dia${daysAgo > 1 ? "s" : ""}`}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
                        letterSpacing: "0.5px",
                        background: isActive ? "rgba(16,185,129,0.1)" : isWarn ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)",
                        color: isActive ? "#10b981" : isWarn ? "#f59e0b" : "#3b82f6",
                        border: `1px solid ${isActive ? "rgba(16,185,129,0.2)" : isWarn ? "rgba(245,158,11,0.2)" : "rgba(59,130,246,0.2)"}`,
                      }}>
                        {isActive ? "ATIVO" : isWarn ? "INATIVO" : "REGULAR"}
                      </span>

                      <ChevronRight size={14} color="var(--text-muted)" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── ATIVIDADE RECENTE ── */}
        <div style={{
          borderRadius: 20, padding: "22px",
          background: "linear-gradient(145deg, var(--surface) 0%, var(--surface-2) 100%)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "2px", color: "var(--accent)", marginBottom: 4 }}>ATIVIDADE RECENTE</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Últimas sessões</div>
            </div>
            <Link href="/dashboard/relatorios" style={{ color: "var(--text-muted)", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
              Ver tudo <ChevronRight size={13} />
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Flame size={36} color="var(--text-muted)" style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Nenhuma atividade ainda</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentSessions.slice(0, 7).map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)" }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    background: s.status === "completed" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: s.status === "completed" ? "#10b981" : "#f59e0b",
                  }}>
                    {s.profiles?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.profiles?.name || "Aluno"}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
                      <Clock size={9} />
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: ptBR })}
                    </div>
                  </div>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: s.status === "completed" ? "#10b981" : "#f59e0b",
                    boxShadow: `0 0 6px ${s.status === "completed" ? "#10b981" : "#f59e0b"}`,
                  }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════
          AÇÕES RÁPIDAS
      ══════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
        {([
          { href: "/dashboard/alunos/novo",         icon: UserPlus,      label: "Novo Aluno",       color: "#3DBDD4" },
          { href: "/dashboard/exercicios",           icon: Dumbbell,      label: "Exercícios",       color: "#3b82f6" },
          { href: "/dashboard/fichas",               icon: ClipboardList, label: "Fichas de Treino", color: "#10b981" },
          { href: "/dashboard/relatorios",           icon: BarChart3,     label: "Relatórios",       color: "#f59e0b" },
        ] as any[]).map(({ href, icon: Icon, label, color }) => (
          <Link key={href} href={href} style={{ textDecoration: "none" }}>
            <div style={{
              borderRadius: 16, padding: "16px 18px",
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer", transition: "all 0.15s",
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${color}30`; el.style.background = `${color}08`; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border-subtle)"; el.style.background = "var(--surface)"; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={17} color={color} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{label}</span>
              <ChevronRight size={13} color="var(--text-muted)" style={{ marginLeft: "auto" }} />
            </div>
          </Link>
        ))}
      </div>

      {/* ══════════════════════════════════
          ALERTA INATIVOS
      ══════════════════════════════════ */}
      {inactive.length > 0 && (
        <div style={{
          borderRadius: 16, padding: "16px 20px",
          background: "rgba(245,158,11,0.06)",
          border: "1px solid rgba(245,158,11,0.2)",
          display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 0 20px rgba(245,158,11,0.05)",
        }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertCircle size={18} color="#f59e0b" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>
              {inactive.length} aluno{inactive.length > 1 ? "s" : ""} sem treinar há mais de 5 dias
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
              {inactive.slice(0, 3).map(s => s.name.split(" ")[0]).join(", ")}
              {inactive.length > 3 ? ` e mais ${inactive.length - 3}` : ""}
            </div>
          </div>
          <Link href="/dashboard/alunos" style={{ flexShrink: 0, color: "#f59e0b", fontSize: 12, textDecoration: "none", fontWeight: 700, padding: "6px 12px", borderRadius: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
            Ver alunos →
          </Link>
        </div>
      )}
    </div>
  );
}
