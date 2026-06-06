"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import EvolutionCharts from "@/components/EvolutionCharts";

export default function EvolucaoPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      const { data: sessions } = await supabase.from("workout_sessions").select("id, created_at, status, duration_minutes").eq("student_id", uid).eq("status", "completed").order("created_at");
      const ids = (sessions || []).map((s: any) => s.id);
      const { data: sets } = ids.length ? await supabase.from("session_sets").select("*, exercises(name, muscle_groups)").in("session_id", ids).order("created_at") : { data: [] };
      const { data: prs } = await supabase.from("personal_records").select("*, exercises(name)").eq("student_id", uid).order("achieved_at", { ascending: false });
      const { data: measurements } = await supabase.from("measurements").select("*").eq("student_id", uid).order("measured_at");
      setData({ sessions: sessions || [], sets: sets || [], prs: prs || [], measurements: measurements || [] });
    })();
  }, []);

  if (!data) return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
      <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return <EvolutionCharts {...data} />;
}
