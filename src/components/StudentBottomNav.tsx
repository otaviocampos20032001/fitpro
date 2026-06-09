"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, ClipboardCheck, TrendingUp, User } from "lucide-react";

const TABS = [
  { href: "/dashboard",           label: "INÍCIO",    Icon: Home },
  { href: "/dashboard/treino",    label: "TREINOS",   Icon: Dumbbell },
  { href: "/dashboard/checkin",   label: "CHECK-IN",  Icon: ClipboardCheck },
  { href: "/dashboard/evolucao",  label: "EVOLUÇÃO",  Icon: TrendingUp },
  { href: "/dashboard/perfil",    label: "PERFIL",    Icon: User },
];

export default function StudentBottomNav() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      background: "rgba(6,9,18,0.96)",
      backdropFilter: "blur(24px)",
      borderTop: "1px solid rgba(61,189,212,0.08)",
      display: "flex",
      zIndex: 200,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {TABS.map(({ href, label, Icon }) => {
        const active = href === "/dashboard"
          ? pathname === href
          : pathname.startsWith(href);
        return (
          <Link key={href} href={href} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 5, padding: "10px 4px 8px",
            textDecoration: "none", position: "relative",
            color: active ? "#3DBDD4" : "rgba(255,255,255,0.3)",
            transition: "color 0.2s",
          }}>
            {/* Active top bar */}
            {active && (
              <span style={{
                position: "absolute", top: 0, left: "50%",
                transform: "translateX(-50%)",
                width: 28, height: 2, borderRadius: 2,
                background: "linear-gradient(90deg, #3DBDD4, #1ab0ff)",
                boxShadow: "0 0 8px rgba(61,189,212,0.6)",
              }} />
            )}
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{
              fontSize: 9, fontWeight: active ? 700 : 500,
              letterSpacing: "0.6px",
            }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
