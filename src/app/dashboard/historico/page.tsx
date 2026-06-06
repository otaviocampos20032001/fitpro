"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Clock, Dumbbell } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function HistoricoPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("workout_sessions").select("*, workout_days(name), session_sets(id, weight, reps, is_pr)").eq("student_id", session.user.id).order("created_at", { ascending: false }).limit(50);
      setSessions(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
      <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }} className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>Historico de Treinos</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>{sessions.length} treinos registrados</p>
      </div>
      {sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <Dumbbell size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Nenhum treino registrado ainda</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sessions.map((s) => {
            const totalSets = s.session_sets?.length || 0;
            const prSets = s.session_sets?.filter((x: any) => x.is_pr).length || 0;
            const totalVolume = s.session_sets?.reduce((a: number, x: any) => a + ((x.weight || 0) * (x.reps || 0)), 0) || 0;
            return (
              <div key={s.id} className="glass-card" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: s.status === "completed" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {s.status === "completed" ? <CheckCircle2 size={20} color="var(--green)" /> : <Clock size={20} color="var(--orange)" />}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{s.workout_days?.name || "Treino livre"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{format(parseISO(s.created_at), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
                    </div>
                  </div>
                  {s.status === "completed" && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(16,185,129,0.15)", color: "var(--green)" }}>Concluido</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 }}>
                  {[
                    { label: "Duracao", value: s.duration_minutes ? `${s.duration_minutes}min` : "-" },
                    { label: "Series", value: totalSets },
                    { label: "Volume", value: totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}t` : "-" },
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: "var(--surface-2)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{stat.value}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                {prSets > 0 && <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}><span className="pr-badge">PR</span><span style={{ fontSize: 12, color: "var(--orange)" }}>{prSets} novo{prSets > 1 ? "s" : ""} recorde{prSets > 1 ? "s" : ""}!</span></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
