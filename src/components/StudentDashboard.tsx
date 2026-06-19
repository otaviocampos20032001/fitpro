"use client";
import Link from "next/link";
import { ChevronRight, Bell, Dumbbell, Droplets, Moon, UtensilsCrossed, Brain, Clock, Flame } from "lucide-react";

const ACCENT = "#00C4F5";

/* ─── Types ─── */
interface Profile   { id: string; name: string; goal?: string; }
interface WorkoutDay { id: string; day_letter: string; day_notes?: string; order_index?: number; }
interface ActivePlan {
  id: string; name: string; goal?: string; starts_at?: string;
  workout_days?: WorkoutDay[];
}
interface Session { id: string; status: string; created_at: string; duration_minutes?: number; }
interface PR { id: string; weight?: number; reps?: number; achieved_at: string; exercises?: { name: string } | null; }

/* ─── Human Body SVG ─── */
function HumanBodySVG() {
  return (
    <svg width="90" height="158" viewBox="0 0 90 158" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 0 12px rgba(0,196,245,0.35))" }}>
      {/* Halo circles */}
      <circle cx="45" cy="78" r="58" stroke="rgba(0,196,245,0.03)" strokeWidth="20" fill="none" />
      <circle cx="45" cy="78" r="52" stroke="rgba(0,196,245,0.05)" strokeWidth="1" fill="none" />
      <circle cx="45" cy="78" r="43" stroke="rgba(0,196,245,0.04)" strokeWidth="1" fill="none" />

      {/* Head */}
      <ellipse cx="45" cy="13" rx="10" ry="11.5" fill="rgba(0,196,245,0.12)" stroke={ACCENT} strokeWidth="1.3" />

      {/* Neck */}
      <path d="M40 24 L40 31 Q45 33 50 31 L50 24" fill="rgba(0,196,245,0.1)" stroke={ACCENT} strokeWidth="0.8" />

      {/* Torso */}
      <path d="M26 35 Q20 43 19 54 L19 76 Q19 83 26 86 L36 88.5 L45 89.5 L54 88.5 L64 86 Q71 83 71 76 L71 54 Q70 43 64 35 Q56 32 45 32 Q34 32 26 35 Z"
        fill="rgba(0,196,245,0.07)" stroke={ACCENT} strokeWidth="1.2" />

      {/* Left upper arm */}
      <path d="M26 37 Q14 45 11 57 Q9 65 12 73"
        stroke={ACCENT} strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Left forearm */}
      <path d="M12 73 Q9 83 7 92"
        stroke={ACCENT} strokeWidth="3.5" strokeLinecap="round" fill="none" />

      {/* Right upper arm */}
      <path d="M64 37 Q76 45 79 57 Q81 65 78 73"
        stroke={ACCENT} strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Right forearm */}
      <path d="M78 73 Q81 83 83 92"
        stroke={ACCENT} strokeWidth="3.5" strokeLinecap="round" fill="none" />

      {/* Left upper leg */}
      <path d="M36 89 Q29 104 27 118 Q25 127 25 134"
        stroke={ACCENT} strokeWidth="5.5" strokeLinecap="round" fill="none" />
      {/* Left shin */}
      <path d="M25 134 Q24 143 24 152"
        stroke={ACCENT} strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* Right upper leg */}
      <path d="M54 89 Q61 104 63 118 Q65 127 65 134"
        stroke={ACCENT} strokeWidth="5.5" strokeLinecap="round" fill="none" />
      {/* Right shin */}
      <path d="M65 134 Q66 143 66 152"
        stroke={ACCENT} strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* Joint dots */}
      <circle cx="45" cy="32" r="2.5" fill={ACCENT} style={{ filter: `drop-shadow(0 0 4px ${ACCENT})` }} />
      <circle cx="26" cy="37" r="3"   fill={ACCENT} style={{ filter: `drop-shadow(0 0 5px ${ACCENT})` }} />
      <circle cx="64" cy="37" r="3"   fill={ACCENT} style={{ filter: `drop-shadow(0 0 5px ${ACCENT})` }} />
      <circle cx="12" cy="73" r="2.5" fill={ACCENT} opacity="0.8" />
      <circle cx="78" cy="73" r="2.5" fill={ACCENT} opacity="0.8" />
      <circle cx="36" cy="89" r="3"   fill={ACCENT} style={{ filter: `drop-shadow(0 0 5px ${ACCENT})` }} />
      <circle cx="54" cy="89" r="3"   fill={ACCENT} style={{ filter: `drop-shadow(0 0 5px ${ACCENT})` }} />
      <circle cx="25" cy="134" r="2.5" fill={ACCENT} opacity="0.8" />
      <circle cx="65" cy="134" r="2.5" fill={ACCENT} opacity="0.8" />
    </svg>
  );
}

/* ─── Performance chart ─── */
function PerformanceChart({ score }: { score: number }) {
  const pts = "8,76 28,68 48,62 68,66 88,50 112,42 136,48 158,34 178,28 196,18";
  const fill = "8,76 28,68 48,62 68,66 88,50 112,42 136,48 158,34 178,28 196,18 196,90 8,90";
  return (
    <svg width="200" height="90" viewBox="0 0 200 90" fill="none">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.18" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill="url(#chartFill)" />
      <polyline
        points={pts}
        stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
        style={{ filter: `drop-shadow(0 0 3px ${ACCENT})` }}
      />
      <circle cx="196" cy="18" r="3.5" fill={ACCENT}
        style={{ filter: `drop-shadow(0 0 6px ${ACCENT})` }} />
    </svg>
  );
}

/* ─── Today stat item ─── */
function TodayItem({ icon, label, value, pct = 0, done = false }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  pct?: number;
  done?: boolean;
}) {
  const sz = 62, r = 25, circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
      <div style={{ position: "relative", width: sz, height: sz }}>
        <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{ position: "absolute", inset: 0 }}>
          <circle cx={sz/2} cy={sz/2} r={r} fill="rgba(0,196,245,0.06)" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
          {pct > 0 && (
            <circle cx={sz/2} cy={sz/2} r={r} fill="none"
              stroke={ACCENT} strokeWidth="2.5"
              strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${sz/2} ${sz/2})`}
              style={{ filter: `drop-shadow(0 0 3px ${ACCENT})` }}
            />
          )}
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: done || pct > 0 ? ACCENT : "rgba(255,255,255,0.4)",
        }}>
          {icon}
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: 9, fontWeight: 800, letterSpacing: "0.8px",
          color: "rgba(255,255,255,0.55)", textTransform: "uppercase",
        }}>{label}</div>
        <div style={{
          fontSize: 10, fontWeight: 700, marginTop: 2,
          color: done ? ACCENT : "rgba(255,255,255,0.35)",
        }}>{value}</div>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function StudentDashboard({
  profile, activePlan, recentSessions, prs,
}: {
  profile: Profile;
  activePlan: ActivePlan | null;
  recentSessions: Session[];
  prs: PR[];
}) {
  const today   = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const firstName = profile.name.split(" ")[0];

  /* streak */
  const completedSessions = recentSessions.filter(s => s.status === "completed");
  const streak = (() => {
    let count = 0;
    const sorted = [...completedSessions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    let prev: number | null = null;
    for (const s of sorted) {
      const d = Math.floor((today.getTime() - new Date(s.created_at).getTime()) / 86400000);
      if (prev === null && d <= 1) { count++; prev = d; }
      else if (prev !== null && d === prev + 1) { count++; prev = d; }
      else break;
    }
    return count;
  })();

  /* plan progress */
  const daysElapsed = activePlan?.starts_at
    ? Math.max(1, Math.floor((Date.now() - new Date(activePlan.starts_at).getTime()) / 86400000) + 1)
    : 1;
  const totalDays  = 84; // 12 weeks
  const totalWeeks = 12;
  const currentWeek = Math.min(totalWeeks, Math.ceil(daysElapsed / 7));
  const progressPct = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
  const phase = progressPct < 33 ? 1 : progressPct < 66 ? 2 : 3;

  /* performance score */
  const perfScore = Math.min(100, Math.max(35,
    45 + completedSessions.length * 5 + (streak >= 3 ? 12 : 0) + (prs.length > 0 ? 5 : 0)
  ));
  const perfDelta  = Math.max(1, completedSessions.length * 2);
  const perfLabel  = perfScore >= 90 ? "EXCELENTE" : perfScore >= 70 ? "ÓTIMO" : perfScore >= 50 ? "BOM" : "EM PROGRESSO";

  /* today's workout */
  const trainedToday = completedSessions.some(s => s.created_at.startsWith(todayStr));
  const days = activePlan?.workout_days
    ? [...activePlan.workout_days].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    : [];
  const nextDay = days[0];

  /* insight text */
  const insights = [
    "Consistência é o único atalho real para performance. Você está no caminho certo.",
    "Seu histórico mostra evolução constante. Continue gerando sobrecarga progressiva.",
    "Recuperação é treino. Priorize sono e hidratação para maximizar seus resultados.",
    "A fase atual exige foco. Cada sessão concluída é um investimento no seu corpo.",
    "Performance não é um acidente. É o resultado de decisões repetidas todo dia.",
  ];
  const insight = insights[today.getDay() % insights.length];

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 16 }}>

      {/* ══ Greeting ══ */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
            Olá, <span style={{ color: ACCENT }}>{firstName}</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 5 }}>
            Pronto para evoluir hoje?
          </p>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 14, padding: "10px 16px",
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
          }}>
            <Flame size={18} color="#f59e0b" style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.6))" }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{streak}</div>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "1.2px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginTop: 2 }}>
                DIAS DE FOCO
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ PROTOCOLO ATUAL ══ */}
      {activePlan ? (
        <div style={{
          borderRadius: 22, padding: "22px 22px 20px",
          background: "linear-gradient(145deg, #0c1828 0%, #07111e 100%)",
          border: "1px solid rgba(0,196,245,0.13)",
          boxShadow: "0 0 40px rgba(0,196,245,0.05)",
          marginBottom: 14, position: "relative", overflow: "hidden",
        }}>
          {/* Radial glow */}
          <div style={{
            position: "absolute", top: -60, right: -60,
            width: 220, height: 220, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,196,245,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* Human body (absolute right) */}
          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.88 }}>
            <HumanBodySVG />
          </div>

          <div style={{ maxWidth: "58%", position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "2px", color: ACCENT, marginBottom: 10 }}>
              PROTOCOLO ATUAL
            </div>
            <div style={{ fontSize: 19, fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.2px", marginBottom: 4 }}>
              {activePlan.name}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", letterSpacing: "0.5px", marginBottom: 18 }}>
              Fase {phase} · Semana {currentWeek} de {totalWeeks}
            </div>

            {/* Progress bar */}
            <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.07)", marginBottom: 6, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3, width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${ACCENT}, #0099cc)`,
                boxShadow: `0 0 8px rgba(0,196,245,0.5)`,
                transition: "width 1s ease",
              }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", marginBottom: 18 }}>
              <span style={{ color: ACCENT, fontSize: 13, fontWeight: 900 }}>{progressPct}%</span>
              {" "}concluído
            </div>

            <Link href="/dashboard/treino" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              textDecoration: "none",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.8px",
              color: "rgba(255,255,255,0.65)",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, padding: "7px 14px",
            }}>
              Ver detalhes do protocolo <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      ) : (
        <div style={{
          borderRadius: 22, padding: 28, marginBottom: 14, textAlign: "center",
          background: "linear-gradient(145deg, #0c1828, #07111e)",
          border: "1px dashed rgba(0,196,245,0.15)",
        }}>
          <Dumbbell size={32} color="rgba(0,196,245,0.3)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            Aguardando protocolo de treino
          </p>
          <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 12 }}>
            Seu personal está preparando seu programa
          </p>
        </div>
      )}

      {/* ══ SCORE DE PERFORMANCE ══ */}
      <div style={{
        borderRadius: 22, padding: "20px 20px 16px",
        background: "linear-gradient(145deg, #0c1828, #07111e)",
        border: "1px solid rgba(0,196,245,0.1)",
        marginBottom: 14, position: "relative", overflow: "hidden",
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "2px", color: ACCENT, marginBottom: 14 }}>
          SCORE DE PERFORMANCE
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
              <span style={{
                fontSize: 54, fontWeight: 900, color: "#fff",
                letterSpacing: "-2px", lineHeight: 1,
              }}>{perfScore}</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>/100</span>
            </div>
            <div style={{
              display: "inline-block", fontSize: 10, fontWeight: 800, letterSpacing: "1.5px",
              color: "#000", background: ACCENT, padding: "4px 12px", borderRadius: 20,
            }}>
              {perfLabel}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
              <span style={{ color: "#10b981" }}>↑ {perfDelta} pontos</span> vs semana passada
            </div>
          </div>
          <div style={{ opacity: 0.9 }}>
            <PerformanceChart score={perfScore} />
          </div>
        </div>
      </div>

      {/* ══ MISSÃO DO DIA ══ */}
      <div style={{
        borderRadius: 22, padding: "20px",
        background: "linear-gradient(145deg, #0c1828, #07111e)",
        border: "1px solid rgba(0,196,245,0.1)",
        marginBottom: 14,
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "2px", color: ACCENT, marginBottom: 16 }}>
          MISSÃO DO DIA
        </div>

        {activePlan && nextDay ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Workout icon */}
            <div style={{
              width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
              background: "rgba(0,196,245,0.06)",
              border: `1.5px solid rgba(0,196,245,0.3)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(0,196,245,0.15)",
            }}>
              <Dumbbell size={22} color={ACCENT} style={{ filter: `drop-shadow(0 0 4px ${ACCENT})` }} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "-0.2px" }}>
                Treino {nextDay.day_letter}
              </div>
              {nextDay.day_notes && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                  {nextDay.day_notes}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <Clock size={11} color="rgba(255,255,255,0.3)" />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>45–60 min</span>
              </div>
            </div>

            <Link href="/dashboard/treino" style={{ textDecoration: "none", flexShrink: 0 }}>
              <div style={{
                background: `linear-gradient(135deg, ${ACCENT}, #0099cc)`,
                borderRadius: 100, padding: "10px 18px",
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 900, color: "#000", letterSpacing: "0.5px",
                boxShadow: "0 4px 20px rgba(0,196,245,0.3)",
                whiteSpace: "nowrap",
              }}>
                Iniciar treino <ChevronRight size={14} strokeWidth={3} />
              </div>
            </Link>
          </div>
        ) : (
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center", padding: "8px 0" }}>
            {trainedToday ? "✓ Treino concluído hoje!" : "Nenhum treino programado"}
          </div>
        )}
      </div>

      {/* ══ HOJE ══ */}
      <div style={{
        borderRadius: 22, padding: "20px",
        background: "linear-gradient(145deg, #0c1828, #07111e)",
        border: "1px solid rgba(0,196,245,0.1)",
        marginBottom: 14,
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "2px", color: ACCENT, marginBottom: 18 }}>
          HOJE
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          <TodayItem
            icon={<Dumbbell size={18} />}
            label="TREINO"
            value={trainedToday ? "Concluído" : "Pendente"}
            pct={trainedToday ? 1 : 0}
            done={trainedToday}
          />
          <TodayItem
            icon={<UtensilsCrossed size={18} />}
            label="NUTRIÇÃO"
            value="Em breve"
            pct={0}
          />
          <TodayItem
            icon={<Droplets size={18} />}
            label="HIDRATAÇÃO"
            value="Em breve"
            pct={0}
          />
          <TodayItem
            icon={<Moon size={18} />}
            label="RECUPERAÇÃO"
            value="Em breve"
            pct={0}
          />
        </div>
      </div>

      {/* ══ INSIGHT O.FIT ══ */}
      <div style={{
        borderRadius: 22, padding: "18px 20px",
        background: "linear-gradient(145deg, #0c1828, #07111e)",
        border: "1px solid rgba(0,196,245,0.1)",
        display: "flex", alignItems: "flex-start", gap: 14,
        marginBottom: 8,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: "rgba(0,196,245,0.08)",
          border: `1px solid rgba(0,196,245,0.2)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Brain size={18} color={ACCENT} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "2px", color: ACCENT, marginBottom: 6 }}>
            INSIGHT O.FIT
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
            {insight}
          </div>
        </div>
        <ChevronRight size={16} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0, marginTop: 4 }} />
      </div>
    </div>
  );
}
