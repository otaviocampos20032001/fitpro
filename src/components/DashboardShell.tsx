"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";

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
    setCollapsed((v) => {
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

  const sidebarWidth = collapsed ? 64 : 256;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>
      <Sidebar profile={profile} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      <main
        style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
          transition: "margin-left 0.25s ease",
        }}
        className="mt-14 md:mt-0"
        // inline style for dynamic margin on desktop
      >
        <style>{`@media (min-width: 768px) { .dashboard-main { margin-left: ${sidebarWidth}px; } }`}</style>
        <div className="dashboard-main" style={{ minHeight: "100%" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
