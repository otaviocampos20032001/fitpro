"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ActiveWorkout from "@/components/ActiveWorkout";

export default function TreinoPage() {
  const [data, setData] = useState<{ plan: any; studentId: string; prs: any[] } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      const { data: plan } = await supabase.from("workout_plans")
        .select("*, workout_days(*, prescribed_exercises(*, exercises(name, muscle_groups, video_url)))")
        .eq("student_id", uid).eq("active", true)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      const { data: prs } = await supabase.from("personal_records").select("*").eq("student_id", uid);
      setData({ plan, studentId: uid, prs: prs || [] });
    })();
  }, []);

  if (!data) return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
      <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return <ActiveWorkout plan={data.plan} studentId={data.studentId} prs={data.prs} />;
}
