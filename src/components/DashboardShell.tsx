"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";

interface Profile {
  id: string; name: string; email: string; role: string; avatar_url?: string;
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setProfile(data);
    });
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>
      <Sidebar profile={profile} />
      <main style={{ flex: 1, padding: "24px", overflowY: "auto" }} className="md:ml-64 mt-14 md:mt-0">
        {children}
      </main>
    </div>
  );
}
