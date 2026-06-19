"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Activity, BarChart2, User } from "lucide-react";

const TABS = [
  { href: "/dashboard",           label: "Início",      Icon: Home },
  { href: "/dashboard/treino",    label: "Protocolo",   Icon: ClipboardList },
  { href: "/dashboard/checkin",   label: "Check-ins",   Icon: Activity },
  { href: "/dashboard/evolucao",  label: "Desempenho",  Icon: BarChart2 },
  { href: "/dashboard/perfil",    label: "Perfil",      Icon: User },
];

export default function StudentBottomNav() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      background: "rgba(5,8,15,0.97)",
      backdropFilter: "blur(28px)",
      borderTop: "1px solid rgba(0,196,245,0.07)",
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
            gap: 5, padding: "10px 4px 9px",
            textDecoration: "none", position: "relative",
            color: active ? "#00C4F5" : "rgba(255,255,255,0.28)",
            transition: "color 0.2s",
          }}>
            {/* Active indicator bar */}
            {active && (
              <span style={{
                position: "absolute", top: 0, left: "50%",
                transform: "translateX(-50%)",
                width: 24, height: 2, borderRadius: 2,
                background: "linear-gradient(90deg, #00C4F5, #0099cc)",
                boxShadow: "0 0 10px rgba(0,196,245,0.7)",
              }} />
            )}
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{
              fontSize: 9.5, fontWeight: active ? 700 : 500,
              letterSpacing: "0.2px",
            }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
