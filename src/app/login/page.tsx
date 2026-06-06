"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import OFLogo from "@/components/OFLogo";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"student" | "trainer">("student");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, role } },
        });
        if (error) throw error;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao autenticar";
      if (msg.includes("Invalid login credentials")) setError("Email ou senha incorretos");
      else if (msg.includes("User already registered")) setError("Este email ja esta cadastrado");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--background)" }}>

      {/* Left Panel */}
      <div style={{
        flex: 1, display: "none", flexDirection: "column",
        justifyContent: "center", padding: "60px",
        background: "linear-gradient(160deg, #0d1a1e 0%, #0a0a0a 60%)",
        position: "relative", overflow: "hidden",
      }} className="md:flex">
        {/* Background glow */}
        <div style={{
          position: "absolute", top: "15%", left: "5%",
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(61,189,212,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "0%",
          width: 240, height: 240, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(61,189,212,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Brand */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 52 }}>
            <OFLogo size={52} color="#3DBDD4" />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "0.5px" }}>
                OTAVIO FONTES
              </div>
              <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "2px", textTransform: "uppercase", marginTop: 2 }}>
                Personal e Consultoria-ON
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.2, color: "#fff", marginBottom: 20 }}>
            Transforme seus<br />
            <span className="gradient-text">resultados</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.8, maxWidth: 360 }}>
            Plataforma exclusiva para acompanhar seus treinos, evoluir suas cargas e atingir seus objetivos.
          </p>

          {/* Divider */}
          <div style={{ width: 48, height: 3, background: "var(--accent)", borderRadius: 2, margin: "36px 0" }} />

          <div style={{ display: "flex", gap: 40 }}>
            {[
              { value: "50+", label: "Exercicios" },
              { value: "100%", label: "Personalizado" },
              { value: "PRs", label: "Rastreados" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "var(--accent)" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, letterSpacing: "0.5px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — form */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px",
        borderLeft: "1px solid var(--border-subtle)",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Mobile brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }} className="md:hidden">
            <OFLogo size={40} color="#3DBDD4" />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>OTAVIO FONTES</div>
              <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "1.5px" }}>PERSONAL E CONSULTORIA-ON</div>
            </div>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>
            {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: 14 }}>
            {mode === "login" ? "Entre para acessar sua plataforma" : "Preencha os dados para comecar"}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "signup" && (
              <>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, display: "block", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    Nome completo
                  </label>
                  <input type="text" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8, display: "block", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    Tipo de conta
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {(["student", "trainer"] as const).map((r) => (
                      <button key={r} type="button" onClick={() => setRole(r)} style={{
                        padding: "12px",
                        borderRadius: 10,
                        border: `2px solid ${role === r ? "var(--accent)" : "var(--border)"}`,
                        background: role === r ? "rgba(61,189,212,0.12)" : "var(--surface-2)",
                        color: role === r ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer", fontWeight: 700, fontSize: 13,
                        transition: "all 0.2s",
                      }}>
                        {r === "student" ? "Aluno" : "Personal"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, display: "block", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={15} color="var(--text-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ paddingLeft: 40 }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, display: "block", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Senha
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={15} color="var(--text-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={{ paddingLeft: 40, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4,
                }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 10, padding: "10px 14px", color: "#ef4444", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8, width: "100%", justifyContent: "center", fontSize: 15, padding: "14px" }}>
              {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--text-secondary)" }}>
            {mode === "login" ? "Nao tem conta?" : "Ja tem conta?"}{" "}
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} style={{
              background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 700,
            }}>
              {mode === "login" ? "Criar agora" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
