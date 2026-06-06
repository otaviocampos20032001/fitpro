import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, Dumbbell } from "lucide-react";

export default async function HistoricoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select(`*, workout_days(name), session_sets(id, weight, reps, is_pr)`)
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }} className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>Histórico de Treinos</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>
          {sessions?.length || 0} treinos registrados
        </p>
      </div>

      {!sessions || sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <Dumbbell size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Nenhum treino registrado ainda</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sessions.map((session) => {
            const totalSets = session.session_sets?.length || 0;
            const prSets = session.session_sets?.filter((s: { is_pr: boolean }) => s.is_pr).length || 0;
            const totalVolume = session.session_sets?.reduce((acc: number, s: { weight?: number; reps?: number }) => acc + ((s.weight || 0) * (s.reps || 0)), 0) || 0;

            return (
              <div key={session.id} className="glass-card" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: session.status === "completed" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {session.status === "completed"
                        ? <CheckCircle2 size={20} color="var(--green)" />
                        : <Clock size={20} color="var(--orange)" />}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                        {session.workout_days?.name || "Treino livre"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {format(parseISO(session.created_at), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  {session.status === "completed" && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                      background: "rgba(16,185,129,0.15)", color: "var(--green)",
                    }}>
                      Concluído
                    </span>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 }}>
                  {[
                    { label: "Duração", value: session.duration_minutes ? `${session.duration_minutes}min` : "—" },
                    { label: "Séries", value: totalSets },
                    { label: "Volume total", value: totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}t` : "—" },
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: "var(--surface-2)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{stat.value}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {prSets > 0 && (
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="pr-badge">PR</span>
                    <span style={{ fontSize: 12, color: "var(--orange)" }}>
                      {prSets} novo{prSets > 1 ? "s" : ""} recorde{prSets > 1 ? "s" : ""} neste treino!
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
