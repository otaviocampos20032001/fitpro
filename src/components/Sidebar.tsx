"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Users, Dumbbell, TrendingUp,
  ClipboardList, LogOut, Menu, X, Bell, ChevronRight, ChevronLeft,
} from "lucide-react";
import { useState } from "react";
import OFLogo from "@/components/OFLogo";

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

export default function Sidebar({ profile, collapsed, onToggleCollapse }: {
  profile: Profile | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const w = collapsed ? 64 : 256;

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
      width: w, height: "100vh", position: "fixed", top: 0, left: 0,
      background: "var(--surface)", borderRight: "1px solid var(--border-subtle)",
      display: "flex", flexDirection: "column", zIndex: 50,
      transition: "width 0.25s ease",
      overflow: "hidden",
    }}>
      {/* Logo + collapse button */}
      <div style={{
        padding: collapsed ? "20px 0" : "20px 16px",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        minHeight: 72,
      }}>
        {collapsed ? (
          <button onClick={onToggleCollapse} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }} title="Expandir">
            <OFLogo size={32} color="#3DBDD4" />
          </button>
        ) : (
          <>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <OFLogo size={32} color="#3DBDD4" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "0.3px", whiteSpace: "nowrap" }}>OTAVIO FONTES</div>
                <div style={{ fontSize: 9, color: "var(--accent)", letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" }}>Personal & Consultoria</div>
              </div>
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button onClick={onToggleCollapse} title="Minimizar" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 6, display: "flex", transition: "color 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
              >
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }} className="md:hidden">
                <X size={20} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div style={{ padding: "10px 16px" }}>
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase",
            color: "var(--accent)", background: "rgba(61,189,212,0.12)",
            padding: "4px 10px", borderRadius: 6, whiteSpace: "nowrap",
          }}>
            {profile?.role === "trainer" ? "Personal Trainer" : "Aluno"}
          </span>
        </div>
      )}

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "8px 6px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              title={collapsed ? label : undefined}
              style={{
                display: "flex", alignItems: "center",
                gap: collapsed ? 0 : 12,
                justifyContent: collapsed ? "center" : "flex-start",
                padding: collapsed ? "12px 0" : "10px 12px",
                borderRadius: 10,
                textDecoration: "none",
                color: active ? "var(--accent)" : "var(--text-secondary)",
                background: active ? "rgba(61,189,212,0.15)" : "transparent",
                fontWeight: active ? 600 : 400,
                fontSize: 14,
                transition: "all 0.15s",
                borderLeft: !collapsed && active ? "2px solid var(--accent)" : "2px solid transparent",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && active && <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.7 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Notifications */}
      <div style={{ padding: "0 6px 8px" }}>
        <Link href="/dashboard/notificacoes" title={collapsed ? "Notificacoes" : undefined} style={{
          display: "flex", alignItems: "center",
          gap: collapsed ? 0 : 12,
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "12px 0" : "10px 12px",
          borderRadius: 10,
          textDecoration: "none", color: "var(--text-secondary)", fontSize: 14,
          transition: "background 0.15s",
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Bell size={18} />
          {!collapsed && <span>Notificacoes</span>}
        </Link>
      </div>

      {/* User + Logout */}
      <div style={{
        padding: collapsed ? "16px 0" : "16px 16px",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, var(--accent), var(--accent-dark))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "white",
        }} title={collapsed ? (profile?.name || "Usuario") : undefined}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
            : initials}
        </div>
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile?.name || "Usuario"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile?.email}
              </div>
            </div>
            <button onClick={handleLogout} title="Sair" style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", padding: 4, borderRadius: 6,
              transition: "color 0.15s", flexShrink: 0,
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--red)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
            >
              <LogOut size={16} />
            </button>
          </>
        )}
        {collapsed && (
          <button onClick={handleLogout} title="Sair" style={{
            display: "none",
            background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
          }}>
            <LogOut size={14} />
          </button>
        )}
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
          <OFLogo size={28} color="#3DBDD4" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "0.3px" }}>OTAVIO FONTES</div>
          </div>
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
