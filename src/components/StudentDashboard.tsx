"use client";
import Link from "next/link";
import { Play, ChevronRight, Dumbbell, Droplets, Moon, Footprints, ClipboardCheck, Trophy, Lock } from "lucide-react";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface Profile   { id: string; name: string; goal?: string; }
interface WorkoutDay { id: string; day_letter: string; day_notes?: string; }
interface ActivePlan {
  id: string; name: string; goal?: string; starts_at?: string;
  workout_days?: WorkoutDay[];
}
interface Session { id: string; status: string; created_at: string; duration_minutes?: number; }
interface PR { id: string; weight?: number; reps?: number; achieved_at: string; exercises?: { name: string } | null; }

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

const QUOTES = [
  "Foco no processo, resultado é consequência.",
  "Cada treino é um passo à frente.",
  "Consistência supera motivação.",
  "O progresso é a soma dos esforços diários.",
  "Não existe atalho para o resultado que você merece.",
  "Discipline creates freedom.",
  "A dor de hoje é o resultado de amanhã.",
];

/* ─────────────────────────────────────────────
   OF Circular Logo SVG
───────────────────────────────────────────── */
function OFCircle({ size = 120 }: { size?: number }) {
  const r1 = size * 0.44, r2 = size * 0.35, r3 = size * 0.26;
  const cx = size / 2, cy = size / 2;
  const circ1 = 2 * Math.PI * r1;
  // dots at specific angles
  const dots = [0, 72, 144, 216, 288].map(deg => {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + r1 * Math.cos(rad), y: cy + r1 * Math.sin(rad), bright: deg < 100 };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      {/* Outer glow circle */}
      <circle cx={cx} cy={cy} r={r1 + 8} fill="none" stroke="rgba(61,189,212,0.06)" strokeWidth={16} />
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r1} fill="none" stroke="rgba(61,189,212,0.12)" strokeWidth={1.5} />
      {/* Arc progress */}
      <circle cx={cx} cy={cy} r={r1} fill="none"
        stroke="url(#arcGrad)" strokeWidth={2.5}
        strokeDasharray={`${circ1 * 0.68} ${circ1 * 0.32}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ filter: "drop-shadow(0 0 4px rgba(61,189,212,0.6))" }}
      />
      {/* Mid ring */}
      <circle cx={cx} cy={cy} r={r2} fill="none" stroke="rgba(61,189,212,0.07)" strokeWidth={1} />
      {/* Inner fill */}
      <circle cx={cx} cy={cy} r={r3} fill="rgba(61,189,212,0.05)" />
      {/* OF text */}
      <text x={cx} y={cy + 6} textAnchor="middle" fill="#3DBDD4"
        fontSize={size * 0.18} fontWeight="900" letterSpacing="1"
        style={{ fontFamily: "system-ui, sans-serif" }}>
        OF
      </text>
      {/* Dots */}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.bright ? 3 : 2}
          fill={d.bright ? "#3DBDD4" : "rgba(61,189,212,0.3)"}
          style={d.bright ? { filter: "drop-shadow(0 0 3px #3DBDD4)" } : {}} />
      ))}
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3DBDD4" />
          <stop offset="100%" stopColor="#1ab0ff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function StudentDashboard({
  profile, activePlan, recentSessions, prs,
}: {
  profile: Profile;
  activePlan: ActivePlan | null;
  recentSessions: Session[];
  prs: PR[];
}) {
  const today = new Date();
  const firstName = profile.name.split(" ")[0];
  const greeting = getGreeting();
  const quote = QUOTES[today.getDay() % QUOTES.length];
  const todayStr = today.toISOString().split("T")[0];

  // Plan progress
  const daysElapsed = activePlan?.starts_at
    ? Math.max(1, Math.floor((Date.now() - new Date(activePlan.starts_at).getTime()) / 86400000) + 1)
    : 1;
  const totalDays = 90;
  const progressPct = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
  const phase =
    progressPct < 33 ? "FASE 1 · ADAPTAÇÃO" :
    progressPct < 66 ? "FASE 2 · CONSTRUÇÃO INTENSIVA" :
    "FASE 3 · PICO DE PERFORMANCE";

  // Missions
  const trainedToday = recentSessions.some(s =>
    s.created_at.startsWith(todayStr) && s.status === "completed"
  );

  // Streak
  const streak = (() => {
    let count = 0;
    const sorted = [...recentSessions]
      .filter(s => s.status === "completed")
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

  // Next workout
  const days = activePlan?.workout_days || [];
  const nextDay = days[0]; // simplificado

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 16 }}>

      {/* ── Greeting ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
          {greeting}, {firstName}. 👋
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 5 }}>{quote}</p>
      </div>

      {/* ── PROJETO ATUAL ── */}
      {activePlan ? (
        <div style={{
          borderRadius: 20, padding: "22px 22px 18px",
          background: "linear-gradient(145deg, #0b1628 0%, #07101e 100%)",
          border: "1px solid rgba(61,189,212,0.14)",
          boxShadow: "0 0 40px rgba(61,189,212,0.06)",
          marginBottom: 16, position: "relative", overflow: "hidden",
        }}>
          {/* BG glow */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(61,189,212,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

          {/* OF circle (right side) */}
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.9 }}>
            <OFCircle size={100} />
          </div>

          {/* Content */}
          <div style={{ maxWidth: "62%" }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "2px", color: "#3DBDD4", marginBottom: 8 }}>
              PROJETO ATUAL
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.2px", marginBottom: 4 }}>
              {activePlan.name.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "1px", marginBottom: 14 }}>
              {phase}
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>
              DIA <span style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{daysElapsed}</span> DE {totalDays}
            </div>

            {/* Progress bar */}
            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", marginBottom: 6, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2, width: `${progressPct}%`,
                background: "linear-gradient(90deg, #3DBDD4, #1ab0ff)",
                boxShadow: "0 0 8px rgba(61,189,212,0.5)",
                transition: "width 1s ease",
              }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#3DBDD4" }}>{progressPct}%</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "rgba(255,255,255,0.4)" }}>
                CONCLUÍDO
              </span>
            </div>

            <Link href={`/dashboard/treino`} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              marginTop: 14, textDecoration: "none",
              fontSize: 11, fontWeight: 700, letterSpacing: "1px",
              color: "#3DBDD4", border: "1px solid rgba(61,189,212,0.3)",
              borderRadius: 8, padding: "6px 12px",
              background: "rgba(61,189,212,0.06)",
            }}>
              VER DETALHES <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      ) : (
        <div style={{
          borderRadius: 20, padding: 24, marginBottom: 16, textAlign: "center",
          background: "linear-gradient(145deg, #0b1628, #07101e)",
          border: "1px dashed rgba(61,189,212,0.15)",
        }}>
          <Dumbbell size={32} color="rgba(61,189,212,0.3)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            Aguardando ficha de treino
          </p>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
            Seu personal está preparando seu programa
          </p>
        </div>
      )}

      {/* ── MISSÃO DO DIA ── */}
      <div style={{
        borderRadius: 20, padding: "18px 18px 16px",
        background: "linear-gradient(145deg, #0b1628, #07101e)",
        border: "1px solid rgba(61,189,212,0.1)",
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "2px", color: "#3DBDD4" }}>
            MISSÃO DO DIA
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "1px" }}>
            {trainedToday ? "1" : "0"}/5 CONCLUÍDAS
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
          {/* TREINO — dado real */}
          <MissionItem
            icon={<Dumbbell size={18} />}
            label="TREINO"
            sub={trainedToday ? "Concluído" : "Pendente"}
            done={trainedToday}
          />
          {/* Os demais — coming soon */}
          <MissionItem icon={<Droplets size={18} />} label="ÁGUA"     sub="Em breve" locked />
          <MissionItem icon={<ClipboardCheck size={18} />} label="CHECK-IN" sub="Em breve" locked />
          <MissionItem icon={<Moon size={18} />}      label="SONO"     sub="Em breve" locked />
          <MissionItem icon={<Footprints size={18} />} label="PASSOS"   sub="Em breve" locked />
        </div>
      </div>

      {/* ── MENSAGEM DO OTÁVIO ── */}
      <div style={{
        borderRadius: 20, padding: "18px",
        background: "linear-gradient(145deg, #0b1628, #07101e)",
        border: "1px solid rgba(61,189,212,0.1)",
        marginBottom: 16, position: "relative", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "2px", color: "#3DBDD4" }}>
            MENSAGEM DO OTÁVIO
          </span>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1px", color: "#000", background: "#3DBDD4", padding: "3px 8px", borderRadius: 4 }}>
            EM BREVE
          </span>
        </div>
        {/* Placeholder */}
        <div style={{
          borderRadius: 14, height: 80, overflow: "hidden", position: "relative",
          background: "linear-gradient(135deg, rgba(61,189,212,0.06) 0%, rgba(10,16,32,0.95) 100%)",
          border: "1px solid rgba(61,189,212,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(61,189,212,0.1)",
            border: "1px solid rgba(61,189,212,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Play size={16} color="rgba(61,189,212,0.5)" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
              Mensagens de vídeo em breve
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>
              Seu personal poderá enviar vídeos diretamente para você
            </div>
          </div>
        </div>
      </div>

      {/* ── PRÓXIMO TREINO ── */}
      {activePlan && (
        <div style={{
          borderRadius: 20, padding: "18px",
          background: "linear-gradient(145deg, #0b1628, #07101e)",
          border: "1px solid rgba(61,189,212,0.1)",
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "2px", color: "#3DBDD4", marginBottom: 14 }}>
            PRÓXIMO TREINO
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
              background: "rgba(61,189,212,0.08)",
              border: "1px solid rgba(61,189,212,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Dumbbell size={22} color="#3DBDD4" />
            </div>

            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.2px" }}>
                {nextDay ? `Treino ${nextDay.day_letter}` : activePlan.name}
              </div>
              {nextDay?.day_notes && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
                  {nextDay.day_notes}
                </div>
              )}
              <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                  🗓 {days.length} dias de treino
                </span>
                {streak > 0 && (
                  <span style={{ fontSize: 11, color: "#f59e0b" }}>
                    🔥 {streak} dias seguidos
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* INICIAR button */}
          <Link href="/dashboard/treino" style={{ textDecoration: "none", display: "block" }}>
            <div style={{
              borderRadius: 14, padding: "16px",
              background: "linear-gradient(90deg, #3DBDD4 0%, #1ab0ff 100%)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer",
              boxShadow: "0 4px 24px rgba(61,189,212,0.3)",
            }}>
              <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: "2px", color: "#000" }}>
                INICIAR TREINO
              </span>
              <ChevronRight size={20} color="#000" strokeWidth={3} />
            </div>
          </Link>
        </div>
      )}

      {/* ── CONQUISTAS RECENTES ── */}
      {prs.length > 0 && (
        <div style={{
          borderRadius: 20, padding: "18px",
          background: "linear-gradient(145deg, #0b1628, #07101e)",
          border: "1px solid rgba(61,189,212,0.1)",
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "2px", color: "#3DBDD4" }}>
              CONQUISTAS RECENTES
            </span>
            <Link href="/dashboard/evolucao" style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textDecoration: "none", letterSpacing: "1px" }}>
              VER TODAS
            </Link>
          </div>

          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
            {prs.slice(0, 6).map((pr, i) => (
              <div key={pr.id} style={{
                flexShrink: 0,
                width: 72, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 8,
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${PR_COLORS[i % PR_COLORS.length].from}, ${PR_COLORS[i % PR_COLORS.length].to})`,
                  border: "2px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 4px 16px ${PR_COLORS[i % PR_COLORS.length].glow}`,
                }}>
                  <Trophy size={22} color="#fff" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px" }}>
                    PR
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2, lineHeight: 1.3,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 70 }}>
                    {pr.exercises?.name || "Exercício"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EVOLUÇÃO ── */}
      <Link href="/dashboard/evolucao" style={{ textDecoration: "none", display: "block" }}>
        <div style={{
          borderRadius: 20, padding: "16px 20px",
          background: "linear-gradient(145deg, #0b1628, #07101e)",
          border: "1px solid rgba(61,189,212,0.1)",
          display: "flex", alignItems: "center", gap: 14,
          marginBottom: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Ver minha Evolução</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
              Cargas, frequência e volume
            </div>
          </div>
          <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
        </div>
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Mission Item
───────────────────────────────────────────── */
function MissionItem({ icon, label, sub, done, locked }: {
  icon: React.ReactNode;
  label: string; sub: string;
  done?: boolean; locked?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      {/* Circle */}
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        background: done
          ? "rgba(61,189,212,0.12)"
          : "rgba(255,255,255,0.04)",
        border: done
          ? "1.5px solid rgba(61,189,212,0.4)"
          : "1.5px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
        color: done ? "#3DBDD4" : locked ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)",
      }}>
        {locked ? <Lock size={14} color="rgba(255,255,255,0.15)" /> : icon}
        {done && (
          <div style={{
            position: "absolute", top: -2, right: -2,
            width: 18, height: 18, borderRadius: "50%",
            background: "#3DBDD4",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 8px rgba(61,189,212,0.5)",
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <polyline points="2,5 4,7.5 8,3" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
      {/* Labels */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.5px", color: done ? "#3DBDD4" : "rgba(255,255,255,0.4)" }}>
          {label}
        </div>
        <div style={{ fontSize: 8, color: locked ? "rgba(255,255,255,0.15)" : done ? "rgba(61,189,212,0.7)" : "rgba(255,255,255,0.25)", marginTop: 2 }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

const PR_COLORS = [
  { from: "#4c1d95", to: "#7c3aed", glow: "rgba(124,58,237,0.3)" },
  { from: "#0e4f7a", to: "#1e88c8", glow: "rgba(30,136,200,0.3)" },
  { from: "#1a4731", to: "#059669", glow: "rgba(5,150,105,0.3)" },
  { from: "#7c2d12", to: "#ea580c", glow: "rgba(234,88,12,0.3)" },
  { from: "#7f1d1d", to: "#dc2626", glow: "rgba(220,38,38,0.3)" },
  { from: "#1e3a5f", to: "#3b82f6", glow: "rgba(59,130,246,0.3)" },
];
