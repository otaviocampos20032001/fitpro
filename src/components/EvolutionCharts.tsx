"use client";
import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { TrendingUp, Calendar, Trophy, Weight, Flame } from "lucide-react";
import { format, subDays, startOfWeek, eachWeekOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Session { id: string; created_at: string; duration_minutes?: number; }
interface ExerciseSet { session_id: string; exercise_id: string; weight?: number; reps?: number; created_at: string; exercises?: { name: string; muscle_groups?: string[] } | null; }
interface PR { exercise_id: string; weight?: number; reps?: number; one_rep_max?: number; achieved_at: string; exercises?: { name: string } | null; }
interface Measurement { measured_at: string; weight_kg?: number; body_fat_pct?: number; }

export default function EvolutionCharts({
  sessions, sets, prs, measurements,
}: {
  sessions: Session[];
  sets: ExerciseSet[];
  prs: PR[];
  measurements: Measurement[];
}) {
  const [tab, setTab] = useState<"frequencia" | "carga" | "corpo" | "prs">("frequencia");
  const [selectedExercise, setSelectedExercise] = useState<string>("");

  // Frequency data — sessions per week (last 12 weeks)
  const freqData = (() => {
    const now = new Date();
    const weeks = eachWeekOfInterval({ start: subDays(now, 83), end: now }, { weekStartsOn: 1 });
    return weeks.map((weekStart) => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const count = sessions.filter((s) => {
        const d = parseISO(s.created_at);
        return d >= weekStart && d <= weekEnd;
      }).length;
      const avgDuration = (() => {
        const weekSessions = sessions.filter((s) => {
          const d = parseISO(s.created_at);
          return d >= weekStart && d <= weekEnd && s.duration_minutes;
        });
        if (weekSessions.length === 0) return 0;
        return Math.round(weekSessions.reduce((a, s) => a + (s.duration_minutes || 0), 0) / weekSessions.length);
      })();
      return {
        week: format(weekStart, "dd/MM", { locale: ptBR }),
        treinos: count,
        duracao: avgDuration,
      };
    });
  })();

  // Unique exercises
  const exercises = Array.from(
    new Map(sets.map((s) => [s.exercise_id, s.exercises?.name || ""])).entries()
  ).map(([id, name]) => ({ id, name })).filter((e) => e.name);

  const activeExercise = selectedExercise || exercises[0]?.id || "";

  // Load progression for selected exercise
  const loadData = (() => {
    const exSets = sets.filter((s) => s.exercise_id === activeExercise && s.weight && s.weight > 0);
    const bySession: Record<string, number[]> = {};
    for (const s of exSets) {
      if (!bySession[s.session_id]) bySession[s.session_id] = [];
      bySession[s.session_id].push(s.weight || 0);
    }
    return Object.entries(bySession).map(([sessionId, weights]) => {
      const session = sessions.find((s) => s.id === sessionId);
      return {
        date: session ? format(parseISO(session.created_at), "dd/MM") : "",
        maxCarga: Math.max(...weights),
        mediaCarga: Math.round(weights.reduce((a, b) => a + b, 0) / weights.length),
      };
    }).filter((d) => d.date);
  })();

  // Body measurements
  const bodyData = measurements.map((m) => ({
    date: format(parseISO(m.measured_at), "dd/MM/yy"),
    peso: m.weight_kg,
    gordura: m.body_fat_pct,
  }));

  const tabs = [
    { key: "frequencia", label: "Frequência", icon: Calendar },
    { key: "carga", label: "Evolução de Carga", icon: TrendingUp },
    { key: "corpo", label: "Corpo", icon: Weight },
    { key: "prs", label: "Recordes", icon: Trophy },
  ] as const;

  const totalSessions = sessions.length;
  const avgDuration = sessions.filter((s) => s.duration_minutes).length > 0
    ? Math.round(sessions.reduce((a, s) => a + (s.duration_minutes || 0), 0) / sessions.filter((s) => s.duration_minutes).length)
    : 0;
  const thisMonthSessions = sessions.filter((s) => {
    const d = parseISO(s.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ fontSize: 13, fontWeight: 600, color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }} className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>Minha Evolução</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>
          Acompanhe seu progresso ao longo do tempo
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total de Treinos", value: totalSessions, color: "var(--accent-light)", icon: "🏋️" },
          { label: "Este Mês", value: thisMonthSessions, color: "var(--green)", icon: "📅" },
          { label: "Duração Média", value: avgDuration ? `${avgDuration}min` : "—", color: "var(--blue)", icon: "⏱️" },
        ].map((s) => (
          <div key={s.label} className="glass-card" style={{ padding: "18px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${tab === key ? "var(--accent)" : "var(--border)"}`,
              background: tab === key ? "rgba(124,58,237,0.15)" : "var(--surface-2)",
              color: tab === key ? "var(--accent-light)" : "var(--text-secondary)",
              cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="glass-card" style={{ padding: 24 }}>
        {tab === "frequencia" && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>
              Treinos por Semana — últimas 12 semanas
            </h2>
            {freqData.every((d) => d.treinos === 0) ? (
              <EmptyState icon={<Flame size={32} />} message="Nenhum treino registrado ainda" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={freqData} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(124,58,237,0.08)" }} />
                  <Bar dataKey="treinos" name="Treinos" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        )}

        {tab === "carga" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                Evolução de Carga
              </h2>
              <select
                value={activeExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                style={{ maxWidth: 280, padding: "8px 12px" }}
              >
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>
            {loadData.length < 2 ? (
              <EmptyState icon={<TrendingUp size={32} />} message="Treine mais vezes para ver a evolução de carga" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={loadData}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} unit="kg" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="maxCarga" name="Carga máx (kg)" stroke="#a855f7" fill="url(#areaGrad)" strokeWidth={2} dot={{ fill: "#a855f7", r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="mediaCarga" name="Carga média (kg)" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </>
        )}

        {tab === "corpo" && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>
              Evolução Corporal
            </h2>
            {bodyData.length < 2 ? (
              <EmptyState icon={<Weight size={32} />} message="Adicione medidas corporais para ver a evolução" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={bodyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="gordura" name="Gordura (%)" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </>
        )}

        {tab === "prs" && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>
              Recordes Pessoais (PR)
            </h2>
            {prs.length === 0 ? (
              <EmptyState icon={<Trophy size={32} />} message="Nenhum PR ainda. Continue treinando com cargas progressivas!" />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                {prs.map((pr) => (
                  <div key={pr.exercise_id} style={{ background: "var(--surface-2)", borderRadius: 12, padding: "16px", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span className="pr-badge">PR</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {pr.exercises?.name}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      {pr.weight && (
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--orange)" }}>{pr.weight}kg</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Carga</div>
                        </div>
                      )}
                      {pr.reps && (
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent-light)" }}>{pr.reps}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Reps</div>
                        </div>
                      )}
                      {pr.one_rep_max && (
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--green)" }}>{pr.one_rep_max}kg</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>1RM est.</div>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
                      {format(parseISO(pr.achieved_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
      <div style={{ opacity: 0.3, margin: "0 auto 12px", display: "flex", justifyContent: "center" }}>{icon}</div>
      <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{message}</p>
    </div>
  );
}
