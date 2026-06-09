"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";
import StudentBottomNav from "@/components/StudentBottomNav";
import Link from "next/link";
import OFLogo from "@/components/OFLogo";
import { Bell, User } from "lucide-react";

interface Profile {
  id: string; name: string; email: string; role: string; avatar_url?: string;
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed(v => {
      localStorage.setItem("sidebar-collapsed", String(!v));
      return !v;
    });
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await (supabase.from("profiles") as any)
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    });
  }, []);

  /* ── Student layout ── */
  if (profile?.role === "student") {
    return (
      <div style={{ minHeight: "100vh", background: "#060912" }}>

        {/* Fixed top header */}
        <header style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 64, zIndex: 100,
          background: "rgba(6,9,18,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(61,189,212,0.07)",
          display: "flex", alignItems: "center",
          padding: "0 20px",
          justifyContent: "space-between",
        }}>
          {/* Brand */}
          <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <OFLogo size={22} color="#3DBDD4" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: "2px", lineHeight: 1 }}>
                <span style={{ color: "#f0f4f8" }}>OTÁVIO </span>
                <span style={{ color: "#3DBDD4" }}>FONTES</span>
              </div>
              <div style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: "1.2px", color: "rgba(61,189,212,0.7)", marginTop: 2 }}>
                PERSONAL E CONSULTORIA · ON
              </div>
            </div>
          </Link>

          {/* Icons right */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", padding: 8, position: "relative" }}>
              <Bell size={20} color="rgba(255,255,255,0.6)" />
            </button>
            <Link href="/dashboard/perfil" style={{ textDecoration: "none" }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(61,189,212,0.3)" }} />
              ) : (
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "linear-gradient(135deg, #3DBDD4, #2196ac)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: "#000",
                  border: "2px solid rgba(61,189,212,0.3)",
                }}>
                  {profile?.name?.charAt(0).toUpperCase() ?? <User size={16} />}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Scrollable content */}
        <main style={{
          paddingTop: 64 + 20,  // header + gap
          paddingBottom: 80 + 16, // bottom nav + gap
          paddingLeft: 16,
          paddingRight: 16,
          minHeight: "100vh",
        }}>
          {children}
        </main>

        {/* Bottom navigation */}
        <StudentBottomNav />
      </div>
    );
  }

  /* ── Trainer layout (sidebar) ── */
  const sidebarW = collapsed ? 64 : 260;

  return (
    <>
      <Sidebar profile={profile} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />

      <div
        className="mt-14 md:mt-0"
        style={{ minHeight: "100vh", background: "var(--background)", transition: "padding-left 0.25s cubic-bezier(.4,0,.2,1)" }}
        id="dashboard-shell"
      >
        <style>{`
          @media (min-width: 768px) {
            #dashboard-shell { padding-left: ${sidebarW}px; }
          }
        `}</style>
        <div style={{ padding: "28px 28px 48px" }}>
          {children}
        </div>
      </div>
    </>
  );
}
