"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Mail, Target, LogOut, ChevronRight, Dumbbell, Trophy, Calendar } from "lucide-react";

export default function PerfilPage() {
  const [profile, setProfile] = useState<any>(null);
  const [stats,   setStats]   = useState({ sessions: 0, prs: 0, streak: 0 });
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: prof } = await (supabase.from("profiles") as any).select("*").eq("id", session.user.id).single();
      setProfile(prof);

      const [sessRes, prRes] = await Promise.all([
        (supabase.from("workout_sessions") as any).select("id, created_at, status").eq("student_id", session.user.id).eq("status", "completed").order("created_at", { ascending: false }),
        (supabase.from("personal_records") as any).select("id").eq("student_id", session.user.id),
      ]);

      const sessions: any[] = sessRes.data || [];
      let streak = 0;
      const today = new Date();
      const sorted = sessions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      let prev: number | null = null;
      for (const s of sorted) {
        const d = Math.floor((today.getTime() - new Date(s.created_at).getTime()) / 86400000);
        if (prev === null && d <= 1) { streak++; prev = d; }
        else if (prev !== null && d === prev + 1) { streak++; prev = d; }
        else break;
      }
      setStats({ sessions: sessions.length, prs: prRes.data?.length ?? 0, streak });
    })();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = profile?.name ? profile.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase() : "?";

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }} className="animate-fade-in">
      {/* Avatar + name */}
      <div style={{ textAlign: "center", paddingTop: 8, marginBottom: 28 }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", margin: "0 auto 14px",
          background: "linear-gradient(135deg, #3DBDD4, #2196ac)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 900, color: "#000",
          border: "3px solid rgba(61,189,212,0.3)",
          boxShadow: "0 0 30px rgba(61,189,212,0.2)",
        }}>
          {initials}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{profile?.name || "Carregando..."}</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4 }}>{profile?.email}</p>
        {profile?.goal && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, background: "rgba(61,189,212,0.1)", border: "1px solid rgba(61,189,212,0.2)", borderRadius: 8, padding: "4px 12px" }}>
            <Target size={12} color="#3DBDD4" />
            <span style={{ fontSize: 11, color: "#3DBDD4", fontWeight: 700 }}>{profile.goal}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
        {[
          { icon: <Dumbbell size={18} color="#3DBDD4" />, value: stats.sessions, label: "Treinos" },
          { icon: <Trophy size={18} color="#f59e0b" />,  value: stats.prs,      label: "PRs" },
          { icon: <Calendar size={18} color="#10b981" />, value: stats.streak,   label: "Sequência" },
        ].map(({ icon, value, label }) => (
          <div key={label} style={{
            borderRadius: 16, padding: "16px 12px", textAlign: "center",
            background: "linear-gradient(145deg, #0b1628, #07101e)",
            border: "1px solid rgba(61,189,212,0.1)",
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{value}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2, letterSpacing: "0.5px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{ borderRadius: 20, overflow: "hidden", background: "linear-gradient(145deg, #0b1628, #07101e)", border: "1px solid rgba(61,189,212,0.1)", marginBottom: 16 }}>
        {[
          { icon: <User size={16} color="#3DBDD4" />,   label: "Nome",      value: profile?.name },
          { icon: <Mail size={16} color="#3DBDD4" />,   label: "Email",     value: profile?.email },
          { icon: <Target size={16} color="#3DBDD4" />, label: "Objetivo",  value: profile?.goal || "—" },
        ].map(({ icon, label, value }, i, arr) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
            borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(61,189,212,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.5px", marginBottom: 2 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 14, color: "#fff", fontWeight: 600 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button onClick={handleLogout} style={{
        width: "100%", borderRadius: 16, padding: "16px",
        background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
        color: "#ef4444", fontSize: 14, fontWeight: 700, transition: "background 0.15s",
      }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
      >
        <LogOut size={18} />
        Sair da conta
      </button>
    </div>
  );
}
