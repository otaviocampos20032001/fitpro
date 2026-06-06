"use client";
import Link from "next/link";
import { Dumbbell, Trophy, Calendar, TrendingUp, ChevronRight, Play, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile { id: string; name: string; goal?: string; }
interface WorkoutDay { id: string; name: string; order_index: number; }
interface Plan { id: string; name: string; days_per_week?: number; workout_days?: WorkoutDay[]; }
interface Session { id: string; status: string; created_at: string; duration_minutes?: number; }
interface PR { id: string; weight?: number; reps?: number; achieved_at: string; exercises?: { name: string } | null; }

export default function StudentDashboard({
  profile, activePlan, recentSessions, prs,
}: {
  profile: Profile;
  activePlan: Plan | null;
  recentSessions: Session[];
  prs: PR[];
}) {
  const today = new Date();
  const thisWeekSessions = recentSessions.filter((s) => {
    const diff = (today.getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7 && s.status === "completed";
  });

  const streak = (() => {
    let count = 0;
    const sorted = [...recentSessions]
      .filter((s) => s.status === "completed")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    let prevDay: number | null = null;
    for (const s of sorted) {
      const dayAgo = Math.floor((today.getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24));
      if (prevDay === null && dayAgo <= 1) { count++; prevDay = dayAgo; }
      else if (prevDay !== null && dayAgo === prevDay + 1) { count++; prevDay = dayAgo; }
      else break;
    }
    return count;
  })();

  const firstName = profile.name.split(" ")[0];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
          {getGreeting()}, {firstName}! {streak > 0 ? "🔥" : "💪"}
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>
          {today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--orange)" }}>{streak}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Sequência 🔥</div>
        </div>
        <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent-light)" }}>{thisWeekSessions.length}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Esta semana</div>
        </div>
        <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--green)" }}>{prs.length}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Recordes (PR)</div>
        </div>
      </div>

      {/* Today's workout CTA */}
      {activePlan ? (
        <Link href="/dashboard/treino" style={{ textDecoration: "none", display: "block", marginBottom: 24 }}>
          <div style={{
            borderRadius: 16, padding: "24px",
            background: "linear-gradient(135deg, #4c1d95 0%, #1e1b4b 50%, #0f172a 100%)",
            border: "1px solid rgba(124,58,237,0.4)",
            boxShadow: "0 4px 30px rgba(124,58,237,0.2)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 40px rgba(124,58,237,0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 30px rgba(124,58,237,0.2)";
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>
                Treino de hoje
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>{activePlan.name}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                {activePlan.workout_days?.length || 0} dias de treino
              </div>
            </div>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Play size={24} color="white" fill="white" />
            </div>
          </div>
        </Link>
      ) : (
        <div className="glass-card" style={{ padding: 24, textAlign: "center", marginBottom: 24, border: "1px dashed var(--border)" }}>
          <Dumbbell size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 4 }}>Nenhuma ficha de treino ainda</p>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Aguardando seu personal definir seu plano</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* PRs */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <Trophy size={16} color="var(--orange)" />
              Recordes Pessoais
            </h2>
            <Link href="/dashboard/evolucao" style={{ color: "var(--text-muted)", fontSize: 12, textDecoration: "none" }}>
              Ver todos <ChevronRight size={12} style={{ display: "inline" }} />
            </Link>
          </div>
          {prs.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>Ainda sem PRs. Continue treinando! 💪</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {prs.slice(0, 4).map((pr) => (
                <div key={pr.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "var(--surface-2)" }}>
                  <span className="pr-badge">PR</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {pr.exercises?.name || "Exercício"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {pr.weight ? `${pr.weight}kg` : ""}{pr.weight && pr.reps ? " × " : ""}{pr.reps ? `${pr.reps} reps` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workout history mini */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={16} color="var(--blue)" />
              Últimos Treinos
            </h2>
            <Link href="/dashboard/historico" style={{ color: "var(--text-muted)", fontSize: 12, textDecoration: "none" }}>
              Ver todos <ChevronRight size={12} style={{ display: "inline" }} />
            </Link>
          </div>
          {recentSessions.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>Nenhum treino registrado</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentSessions.slice(0, 5).map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "var(--surface-2)" }}>
                  <Flame size={14} color={s.status === "completed" ? "var(--green)" : "var(--text-muted)"} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                      {s.status === "completed" ? "Treino concluído" : s.status === "in_progress" ? "Em andamento" : "Pulado"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: ptBR })}
                      {s.duration_minutes ? ` · ${s.duration_minutes}min` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress link */}
      <Link href="/dashboard/evolucao" style={{ textDecoration: "none", display: "block", marginTop: 20 }}>
        <div className="glass-card glass-card-hover" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={20} color="var(--blue)" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Ver minha Evolução</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Gráficos de carga, frequência e volume</div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" style={{ marginLeft: "auto" }} />
        </div>
      </Link>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
