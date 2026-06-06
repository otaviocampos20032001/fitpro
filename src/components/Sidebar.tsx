"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Users, Dumbbell, TrendingUp,
  ClipboardList, LogOut, Menu, X, Bell, ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

const trainerLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/alunos", label: "Alunos", icon: Users },
  { href: "/dashboard/fichas", label: "Fichas de Treino", icon: ClipboardList },
  { href: "/dashboard/exercicios", label: "Exercícios", icon: Dumbbell },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: TrendingUp },
];

const studentLinks = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/dashboard/treino", label: "Treino de Hoje", icon: Dumbbell },
  { href: "/dashboard/historico", label: "Histórico", icon: ClipboardList },
  { href: "/dashboard/evolucao", label: "Evolução", icon: TrendingUp },
];

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  const links = profile?.role === "trainer" ? trainerLinks : studentLinks;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const SidebarContent = () => (
    <div style={{
      width: 256, height: "100vh", position: "fixed", top: 0, left: 0,
      background: "var(--surface)", borderRight: "1px solid var(--border-subtle)",
      display: "flex", flexDirection: "column", zIndex: 50,
      transition: "transform 0.3s ease",
    }}>
      {/* Logo */}
      <div style={{
        padding: "24px 20px 20px",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #7c3aed, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Dumbbell size={18} color="white" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>FitPro</span>
        </Link>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }} className="md:hidden">
          <X size={20} />
        </button>
      </div>

      {/* Role badge */}
      <div style={{ padding: "12px 20px" }}>
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase",
          color: profile?.role === "trainer" ? "var(--accent-light)" : "var(--green)",
          background: profile?.role === "trainer" ? "rgba(124,58,237,0.15)" : "rgba(16,185,129,0.15)",
          padding: "4px 10px", borderRadius: 6,
        }}>
          {profile?.role === "trainer" ? "Personal Trainer" : "Aluno"}
        </span>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 10,
                textDecoration: "none",
                color: active ? "white" : "var(--text-secondary)",
                background: active ? "linear-gradient(135deg, var(--accent), #6366f1)" : "transparent",
                fontWeight: active ? 600 : 400,
                fontSize: 14,
                transition: "all 0.15s",
                boxShadow: active ? "0 2px 12px var(--accent-glow)" : "none",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {active && <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.7 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Notifications */}
      <div style={{ padding: "0 12px 8px" }}>
        <Link href="/dashboard/notificacoes" style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 12px", borderRadius: 10,
          textDecoration: "none", color: "var(--text-secondary)", fontSize: 14,
          transition: "background 0.15s",
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Bell size={18} />
          <span>Notificações</span>
        </Link>
      </div>

      {/* User + Logout */}
      <div style={{
        padding: "16px 20px",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent), #6366f1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0,
        }}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
            : initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {profile?.name || "Usuário"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {profile?.email}
          </div>
        </div>
        <button onClick={handleLogout} title="Sair" style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-muted)", padding: 4, borderRadius: 6,
          transition: "color 0.15s",
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--red)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile header */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 56,
        background: "var(--surface)", borderBottom: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center", padding: "0 16px", gap: 12, zIndex: 40,
      }} className="md:hidden">
        <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)" }}>
          <Menu size={22} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #7c3aed, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Dumbbell size={14} color="white" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>FitPro</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 49,
          }} />
          <div style={{ transform: "translateX(0)" }}>
            <SidebarContent />
          </div>
        </>
      )}

      {/* Mobile top spacer */}
      <div style={{ height: 56 }} className="md:hidden" />
    </>
  );
}
