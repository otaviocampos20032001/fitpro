"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Users, Plus, ChevronRight } from "lucide-react";

export default function AlunosPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: s } = await supabase.from("profiles").select("*").eq("trainer_id", session.user.id).order("name");
      setStudents(s || []);
      if (s && s.length > 0) {
        const { data: sess } = await supabase.from("workout_sessions").select("student_id, created_at, status").in("student_id", s.map((x: any) => x.id)).order("created_at", { ascending: false });
        setSessions(sess || []);
      }
      setLoading(false);
    })();
  }, []);

  const today = new Date();
  function getDaysAgo(dateStr?: string) {
    if (!dateStr) return null;
    return Math.floor((today.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
      <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }} className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>Alunos</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>{students.length} aluno{students.length !== 1 ? "s" : ""} cadastrado{students.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/dashboard/alunos/novo" className="btn-primary" style={{ textDecoration: "none", fontSize: 14 }}>
          <Plus size={16} /> Adicionar Aluno
        </Link>
      </div>

      {students.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <Users size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Nenhum aluno ainda</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>Adicione seu primeiro aluno para comecar.</p>
          <Link href="/dashboard/alunos/novo" className="btn-primary" style={{ textDecoration: "none" }}><Plus size={16} /> Adicionar Aluno</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {students.map((student) => {
            const lastSession = sessions.find((s) => s.student_id === student.id);
            const daysAgo = getDaysAgo(lastSession?.created_at);
            const isInactive = daysAgo === null || daysAgo > 5;
            const total = sessions.filter((s) => s.student_id === student.id && s.status === "completed").length;
            return (
              <Link key={student.id} href={`/dashboard/alunos/${student.id}`} style={{ textDecoration: "none" }}>
                <div className="glass-card glass-card-hover" style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #3DBDD4, #2a9fb5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#000" }}>
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`status-dot ${isInactive ? "status-warning" : "status-active"}`} style={{ position: "absolute", bottom: 0, right: 0, border: "2px solid var(--surface)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{student.email}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{total}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Treinos</div>
                    </div>
                    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isInactive ? "var(--orange)" : "var(--green)" }}>
                        {daysAgo === null ? "Nunca" : daysAgo === 0 ? "Hoje" : `${daysAgo}d atras`}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Ultimo treino</div>
                    </div>
                  </div>
                  {student.goal && <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-secondary)", padding: "8px 10px", background: "var(--surface-2)", borderRadius: 8 }}>🎯 {student.goal}</div>}
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}><ChevronRight size={16} color="var(--text-muted)" /></div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
