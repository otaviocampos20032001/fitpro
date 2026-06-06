import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ActiveWorkout from "@/components/ActiveWorkout";

export default async function TreinoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role === "trainer") redirect("/dashboard");

  const { data: activePlan } = await supabase
    .from("workout_plans")
    .select(`*, workout_days(*, workout_day_exercises(*, exercises(*)))`)
    .eq("student_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: prs } = await supabase
    .from("personal_records")
    .select("*")
    .eq("student_id", user.id);

  return <ActiveWorkout plan={activePlan} studentId={user.id} prs={prs || []} />;
}
