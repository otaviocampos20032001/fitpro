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
  { href: "/dashboard",            label: "Dashboard",        icon: LayoutDashboard },
  { href: "/dashboard/alunos",     label: "Alunos",           icon: Users },
  { href: "/dashboard/fichas",     label: "Fichas de Treino", icon: ClipboardList },
  { href: "/dashboard/exercicios", label: "Exercícios",       icon: Dumbbell },
  { href: "/dashboard/relatorios", label: "Relatórios",       icon: TrendingUp },
];

const studentLinks = [
  { href: "/dashboard",           label: "Início",      icon: LayoutDashboard },
  { href: "/dashboard/treino",    label: "Treino Hoje", icon: Dumbbell },
  { href: "/dashboard/historico", label: "Histórico",   icon: ClipboardList },
  { href: "/dashboard/evolucao",  label: "Evolução",    icon: TrendingUp },
];

export default function Sidebar({
  profile,
  collapsed,
  onToggleCollapse,
}: {
  profile: Profile | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const w = collapsed ? 64 : 260;

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
      width: w,
      height: "100vh",
      position: "fixed",
      top: 0, left: 0,
      background: "linear-gradient(180deg, #06080f 0%, #040509 100%)",
      borderRight: "1px solid rgba(61,189,212,0.07)",
      display: "flex",
      flexDirection: "column",
      zIndex: 50,
      transition: "width 0.25s cubic-bezier(.4,0,.2,1)",
      overflow: "hidden",
    }}>

      {/* Linha de brilho lateral direita */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: 1,
        background: "linear-gradient(180deg, transparent, rgba(61,189,212,0.10) 30%, rgba(61,189,212,0.04) 70%, transparent)",
        pointerEvents: "none",
      }} />

      {/* ── Brand / Logo ── */}
      <div style={{
        padding: collapsed ? "20px 0" : "16px 16px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        display: "flex",
        alignItems: collapsed ? "center" : "flex-start",
        justifyContent: collapsed ? "center" : "space-between",
        minHeight: 82,
      }}>
        {collapsed ? (
          <button onClick={onToggleCollapse} title="Expandir"
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
            <OFLogo size={26} color="#3DBDD4" />
          </button>
        ) : (
          <>
            <Link href="/dashboard" style={{ textDecoration: "none", flex: 1 }}>
              {/* Mark */}
              <OFLogo size={20} color="#3DBDD4" />
              {/* OTAVIO FONTES */}
              <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "2.5px", marginTop: 7, lineHeight: 1 }}>
                <span style={{ color: "#f0f4f8" }}>OTAVIO </span>
                <span style={{ color: "#3DBDD4" }}>FONTES</span>
              </div>
              {/* Barra subline */}
              <div style={{
                display: "inline-block", marginTop: 5,
                background: "#3DBDD4", color: "#000",
                fontSize: 7.5, fontWeight: 800, letterSpacing: "1.3px",
                padding: "3px 8px", borderRadius: 3, whiteSpace: "nowrap",
              }}>
                PERSONAL E CONSULTORIA-ON
              </div>
            </Link>

            <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
              <button onClick={onToggleCollapse} title="Minimizar"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 6, display: "flex", transition: "color 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
              >
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setOpen(false)} className="md:hidden"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex" }}>
                <X size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Role badge ── */}
      {!collapsed && (
        <div style={{ padding: "10px 16px 4px" }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase",
            color: "var(--accent)", border: "1px solid rgba(61,189,212,0.18)",
            background: "rgba(61,189,212,0.06)", padding: "3px 9px", borderRadius: 5,
          }}>
            {profile?.role === "trainer" ? "Personal Trainer" : "Aluno"}
          </span>
        </div>
      )}

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)} title={collapsed ? label : undefined}
              style={{
                display: "flex", alignItems: "center",
                gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? "center" : "flex-start",
                padding: collapsed ? "13px 0" : "10px 12px",
                borderRadius: 9, textDecoration: "none",
                color: active ? "var(--accent)" : "var(--text-secondary)",
                background: active ? "rgba(61,189,212,0.08)" : "transparent",
                fontWeight: active ? 700 : 400,
                fontSize: 13,
                transition: "all 0.15s",
                borderLeft: !collapsed && active ? "2px solid var(--accent)" : "2px solid transparent",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon size={17} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && active && <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.5 }} />}
            </Link>
          );
        })}
      </nav>

      {/* ── Notificações ── */}
      <div style={{ padding: "0 8px 8px" }}>
        <Link href="/dashboard/notificacoes" title={collapsed ? "Notificações" : undefined}
          style={{
            display: "flex", alignItems: "center",
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "13px 0" : "10px 12px",
            borderRadius: 9, textDecoration: "none",
            color: "var(--text-secondary)", fontSize: 13, transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Bell size={17} />
          {!collapsed && <span>Notificações</span>}
        </Link>
      </div>

      {/* Separador */}
      <div style={{ height: 1, margin: "0 14px", background: "rgba(255,255,255,0.04)" }} />

      {/* ── Usuário + Logout ── */}
      <div style={{
        padding: collapsed ? "14px 0" : "12px 14px",
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #3DBDD4, #2196ac)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, color: "#000",
          border: "1px solid rgba(61,189,212,0.3)",
          boxShadow: "0 0 12px rgba(61,189,212,0.15)",
        }} title={collapsed ? (profile?.name || "Usuário") : undefined}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
            : initials}
        </div>
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile?.name || "Usuário"}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile?.email}
              </div>
            </div>
            <button onClick={handleLogout} title="Sair"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 6, display: "flex", transition: "color 0.15s", flexShrink: 0 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--red)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
            >
              <LogOut size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile header ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 56,
        background: "rgba(4,5,9,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(61,189,212,0.06)",
        display: "flex", alignItems: "center", padding: "0 16px", gap: 14, zIndex: 40,
      }} className="md:hidden">
        <button onClick={() => setOpen(true)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)", display: "flex" }}>
          <Menu size={22} />
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <OFLogo size={16} color="#3DBDD4" />
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "2px" }}>
            <span style={{ color: "#f0f4f8" }}>OTAVIO </span>
            <span style={{ color: "#3DBDD4" }}>FONTES</span>
          </div>
        </div>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>

      {/* ── Mobile drawer ── */}
      {open && (
        <>
          <div onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 49, backdropFilter: "blur(6px)" }} />
          <div><SidebarContent /></div>
        </>
      )}

      {/* Espaçador mobile */}
      <div style={{ height: 56 }} className="md:hidden" />
    </>
  );
}
