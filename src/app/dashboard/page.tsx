"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TrainerDashboard from "@/components/TrainerDashboard";
import StudentDashboard from "@/components/StudentDashboard";

export default function DashboardPage() {
  const [data, setData] = useState<{ profile: unknown; students: unknown[]; recentSessions: unknown[]; prs: unknown[]; activePlan: unknown } | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return;
        const uid = user.id;

        const { data: profile, error: profileError } = await (supabase.from("profiles") as any).select("*").eq("id", uid).single();
        if (profileError || !profile) {
          setDbError(`Erro ao buscar perfil: ${profileError?.message || "perfil nao encontrado"} (uid: ${uid})`);
          setData({ profile: null, students: [], recentSessions: [], prs: [], activePlan: null });
          return;
        }

        if ((profile as any).role === "trainer") {
          const { data: students } = await (supabase.from("profiles") as any).select("*").eq("trainer_id", uid).order("name");
          const ids = ((students as any[]) || []).map((s) => s.id);
          const { data: recentSessions } = ids.length
            ? await (supabase.from("workout_sessions") as any).select("*, profiles!student_id(name, avatar_url)").in("student_id", ids).order("created_at", { ascending: false }).limit(10)
            : { data: [] };
          setData({ profile, students: students || [], recentSessions: recentSessions || [], prs: [], activePlan: null });
        } else {
          const { data: activePlan } = await (supabase.from("workout_plans") as any).select("*, workout_days(*)").eq("student_id", uid).eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
          const { data: recentSessions } = await (supabase.from("workout_sessions") as any).select("*").eq("student_id", uid).order("created_at", { ascending: false }).limit(7);
          const { data: prs } = await (supabase.from("personal_records") as any).select("*, exercises(name)").eq("student_id", uid).order("achieved_at", { ascending: false }).limit(5);
          setData({ profile, students: [], recentSessions: recentSessions || [], prs: prs || [], activePlan });
        }
      } catch (e: any) {
        setDbError(`Excecao: ${e?.message || String(e)}`);
        setData({ profile: null, students: [], recentSessions: [], prs: [], activePlan: null });
      }
    })();
  }, []);

  if (!data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const { profile, students, recentSessions, prs, activePlan } = data as any;

  if (!profile) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <p style={{ color: "var(--text-secondary)", marginBottom: 8 }}>Erro ao carregar perfil. Tente recarregar a pagina.</p>
        {dbError && <p style={{ color: "#ef4444", fontSize: 12, fontFamily: "monospace", maxWidth: 600, margin: "0 auto", wordBreak: "break-all" }}>{dbError}</p>}
      </div>
    );
  }

  if (profile?.role === "trainer") {
    return <TrainerDashboard profile={profile} students={students} recentSessions={recentSessions} />;
  }
  return <StudentDashboard profile={profile} activePlan={activePlan} recentSessions={recentSessions} prs={prs} />;
}
