export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TrainerDashboard from "@/components/TrainerDashboard";
import StudentDashboard from "@/components/StudentDashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role === "trainer") {
    const { data: students } = await supabase
      .from("profiles")
      .select("*")
      .eq("trainer_id", user.id)
      .eq("active", true)
      .order("name");

    const { data: recentSessions } = await supabase
      .from("workout_sessions")
      .select("*, profiles!student_id(name, avatar_url)")
      .in("student_id", (students || []).map((s) => s.id))
      .order("created_at", { ascending: false })
      .limit(10);

    return (
      <TrainerDashboard
        profile={profile}
        students={students || []}
        recentSessions={recentSessions || []}
      />
    );
  }

  // Student dashboard
  const { data: activePlan } = await supabase
    .from("workout_plans")
    .select("*, workout_days(*)")
    .eq("student_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: recentSessions } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(7);

  const { data: prs } = await supabase
    .from("personal_records")
    .select("*, exercises(name)")
    .eq("student_id", user.id)
    .order("achieved_at", { ascending: false })
    .limit(5);

  return (
    <StudentDashboard
      profile={profile}
      activePlan={activePlan}
      recentSessions={recentSessions || []}
      prs={prs || []}
    />
  );
}
