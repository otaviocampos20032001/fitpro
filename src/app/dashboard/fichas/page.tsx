"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ClipboardList, Plus, Search, Calendar, Dumbbell, ChevronRight, Archive, CheckCircle } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  goal?: string;
  active: boolean;
  starts_at: string;
  created_at: string;
  student_id: string;
  workout_days?: { id: string }[];
  student: { name: string; email: string; goal?: string };
};

type Tab = "ativas" | "arquivadas" | "todas";

export default function FichasPage() {
  const [plans,   setPlans]   = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<Tab>("ativas");
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await (supabase.from("workout_plans") as any)
        .select("*, student:profiles!student_id(name, email, goal), workout_days(id)")
        .eq("trainer_id", session.user.id)
        .order("created_at", { ascending: false });

      setPlans(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = plans.filter(p => {
    const matchTab = tab === "ativas" ? p.active : tab === "arquivadas" ? !p.active : true;
    const q = search.toLowerCase();
    const matchSearch = !q
      || p.name.toLowerCase().includes(q)
      || p.student?.name?.toLowerCase().includes(q)
      || (p.goal || "").toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const countAtivas     = plans.filter(p => p.active).length;
  const countArquivadas = plans.filter(p => !p.active).length;

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "ativas",     label: "Ativas",     count: countAtivas },
    { key: "arquivadas", label: "Arquivadas", count: countArquivadas },
    { key: "todas",      label: "Todas",      count: plans.length },
  ];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
            <ClipboardList size={22} color="var(--accent)" />
            Fichas de Treino
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
            {plans.length} ficha{plans.length !== 1 ? "s" : ""} no total · {countAtivas} ativa{countAtivas !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/alunos" className="btn-primary" style={{ textDecoration: "none", fontSize: 13 }}>
          <Plus size={15} /> Nova Ficha
        </Link>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por aluno, ficha ou objetivo..."
          style={{ paddingLeft: 38, width: "100%" }}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
              fontWeight: tab === t.key ? 700 : 400, transition: "all 0.15s",
              background: tab === t.key ? "rgba(61,189,212,0.12)" : "var(--surface-2)",
              color: tab === t.key ? "var(--accent)" : "var(--text-secondary)",
              borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
              display: "flex", alignItems: "center", gap: 6,
            }}>
            {t.label}
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
              background: tab === t.key ? "rgba(61,189,212,0.2)" : "rgba(255,255,255,0.06)",
              color: tab === t.key ? "var(--accent)" : "var(--text-muted)",
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
          <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="glass-card" style={{ padding: 48, textAlign: "center" }}>
          <ClipboardList size={44} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 8 }}>
            {search ? "Nenhuma ficha encontrada" : tab === "ativas" ? "Nenhuma ficha ativa" : "Nenhuma ficha arquivada"}
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {!search && tab === "ativas" && "Selecione um aluno e crie a primeira ficha de treino."}
          </p>
        </div>
      )}

      {/* Plan list */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(plan => {
            const dayCount = plan.workout_days?.length ?? 0;
            const initials = plan.student?.name?.charAt(0)?.toUpperCase() ?? "?";
            return (
              <Link
                key={plan.id}
                href={`/dashboard/alunos/${plan.student_id}`}
                style={{ textDecoration: "none" }}
              >
                <div className="glass-card glass-card-hover" style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

                    {/* Student avatar */}
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, #3DBDD4, #2196ac)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, fontWeight: 800, color: "#000",
                      boxShadow: "0 0 14px rgba(61,189,212,0.2)",
                    }}>
                      {initials}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{plan.name}</span>
                        {plan.active
                          ? <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.12)", padding: "2px 8px", borderRadius: 5, display: "flex", alignItems: "center", gap: 3 }}>
                              <CheckCircle size={9} /> Ativa
                            </span>
                          : <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 5, display: "flex", alignItems: "center", gap: 3 }}>
                              <Archive size={9} /> Arquivada
                            </span>
                        }
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                        Aluno: <strong style={{ color: "var(--text-primary)" }}>{plan.student?.name}</strong>
                        {plan.goal && <span style={{ color: "var(--accent)", marginLeft: 10 }}>🎯 {plan.goal}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Dumbbell size={11} /> {dayCount} dia{dayCount !== 1 ? "s" : ""} de treino
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Calendar size={11} /> {new Date(plan.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
