"use client";
import Link from "next/link";
import { Users, TrendingUp, Flame, AlertCircle, Plus, ChevronRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  id: string; name: string; email: string; avatar_url?: string; role: string;
}
interface Session {
  id: string; student_id: string; status: string; created_at: string;
  duration_minutes?: number;
  profiles?: { name: string; avatar_url?: string } | null;
}

export default function TrainerDashboard({
  profile, students, recentSessions,
}: {
  profile: Profile;
  students: Profile[];
  recentSessions: Session[];
}) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const trainedToday = recentSessions.filter(
    (s) => s.created_at.startsWith(todayStr) && s.status === "completed"
  ).length;

  const trainedThisWeek = recentSessions.filter((s) => {
    const d = new Date(s.created_at);
    const diff = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7 && s.status === "completed";
  }).length;

  const inactive = students.filter((s) => {
    const lastSession = recentSessions.find((r) => r.student_id === s.id);
    if (!lastSession) return true;
    const diff = (today.getTime() - new Date(lastSession.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return diff > 5;
  });

  const stats = [
    { label: "Total de Alunos", value: students.length, icon: Users, color: "#7c3aed", bg: "rgba(124,58,237,0.15)" },
    { label: "Treinaram Hoje", value: trainedToday, icon: Flame, color: "#10b981", bg: "rgba(16,185,129,0.15)" },
    { label: "Esta Semana", value: trainedThisWeek, icon: TrendingUp, color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
    { label: "Inativos (+5 dias)", value: inactive.length, icon: AlertCircle, color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  ];

  const firstName = profile.name.split(" ")[0];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)" }}>
            Olá, {firstName} 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <Link href="/dashboard/alunos/novo" className="btn-primary" style={{ textDecoration: "none", fontSize: 14 }}>
          <Plus size={16} />
          Adicionar Aluno
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-card" style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="grid-cols-1 md:grid-cols-2">
        {/* Recent activity */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Atividade Recente</h2>
            <Link href="/dashboard/relatorios" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              Ver tudo <ChevronRight size={14} />
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
              <Flame size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>Nenhuma atividade ainda</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentSessions.slice(0, 6).map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--accent), #6366f1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0,
                  }}>
                    {s.profiles?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.profiles?.name || "Aluno"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: ptBR })}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                    background: s.status === "completed" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                    color: s.status === "completed" ? "var(--green)" : "var(--orange)",
                  }}>
                    {s.status === "completed" ? "Concluído" : s.status === "in_progress" ? "Em andamento" : "Pulado"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Students list */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Seus Alunos</h2>
            <Link href="/dashboard/alunos" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              Ver todos <ChevronRight size={14} />
            </Link>
          </div>

          {students.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
              <Users size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>Nenhum aluno ainda</p>
              <Link href="/dashboard/alunos/novo" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", marginTop: 16, fontSize: 13, padding: "8px 16px" }}>
                <Plus size={14} /> Adicionar
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {students.slice(0, 6).map((student) => {
                const lastSession = recentSessions.find((r) => r.student_id === student.id);
                const daysAgo = lastSession
                  ? Math.floor((today.getTime() - new Date(lastSession.created_at).getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                const isInactive = daysAgo === null || daysAgo > 5;
                return (
                  <Link key={student.id} href={`/dashboard/alunos/${student.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 12px", borderRadius: 10,
                      background: "var(--surface-2)", cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--border-subtle)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
                    >
                      <div style={{ position: "relative" }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, color: "white",
                        }}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`status-dot ${isInactive ? "status-warning" : "status-active"}`} style={{
                          position: "absolute", bottom: 0, right: 0, border: "2px solid var(--surface-2)",
                        }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {student.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {daysAgo === null ? "Nunca treinou" : daysAgo === 0 ? "Treinou hoje" : `Há ${daysAgo} dia${daysAgo > 1 ? "s" : ""}`}
                        </div>
                      </div>
                      <ChevronRight size={14} color="var(--text-muted)" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Inactive alert */}
      {inactive.length > 0 && (
        <div style={{
          marginTop: 24,
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: 14, padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <AlertCircle size={20} color="var(--orange)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--orange)" }}>
              {inactive.length} aluno{inactive.length > 1 ? "s" : ""} sem treinar há mais de 5 dias
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              {inactive.slice(0, 3).map((s) => s.name.split(" ")[0]).join(", ")}
              {inactive.length > 3 ? ` e mais ${inactive.length - 3}` : ""}
            </div>
          </div>
          <Link href="/dashboard/alunos" style={{ marginLeft: "auto", color: "var(--orange)", fontSize: 13, textDecoration: "none", fontWeight: 600, flexShrink: 0 }}>
            Ver alunos →
          </Link>
        </div>
      )}
    </div>
  );
}
