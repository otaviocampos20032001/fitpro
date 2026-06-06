import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EvolutionCharts from "@/components/EvolutionCharts";

export default async function EvolucaoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, created_at, status, duration_minutes")
    .eq("student_id", user.id)
    .eq("status", "completed")
    .order("created_at");

  const { data: sets } = await supabase
    .from("session_sets")
    .select("*, exercises(name, muscle_groups)")
    .in("session_id", (sessions || []).map((s) => s.id))
    .order("created_at");

  const { data: prs } = await supabase
    .from("personal_records")
    .select("*, exercises(name)")
    .eq("student_id", user.id)
    .order("achieved_at", { ascending: false });

  const { data: measurements } = await supabase
    .from("measurements")
    .select("*")
    .eq("student_id", user.id)
    .order("measured_at");

  return (
    <EvolutionCharts
      sessions={sessions || []}
      sets={sets || []}
      prs={prs || []}
      measurements={measurements || []}
    />
  );
}
