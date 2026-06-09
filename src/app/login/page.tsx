"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import OFLogo from "@/components/OFLogo";

export default function LoginPage() {
  const router   = useRouter();

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [mode,         setMode]         = useState<"login" | "signup">("login");
  const [name,         setName]         = useState("");
  const [role,         setRole]         = useState<"student" | "trainer">("student");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name, role } },
        });
        if (error) throw error;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao autenticar";
      if (msg.includes("Invalid login credentials")) setError("Email ou senha incorretos");
      else if (msg.includes("User already registered")) setError("Este email já está cadastrado");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--background)", position: "relative" }}>

      {/* ── Painel esquerdo — Brand ── */}
      <div style={{
        flex: 1, display: "none", flexDirection: "column",
        justifyContent: "center", padding: "64px 56px",
        background: "linear-gradient(150deg, #08101a 0%, #04050d 55%, #050a0c 100%)",
        position: "relative", overflow: "hidden",
      }} className="md:flex">

        {/* Grade tech de fundo */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(61,189,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(61,189,212,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }} />

        {/* Brilho radial ciano (canto superior) */}
        <div style={{
          position: "absolute", top: "-10%", left: "-5%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(61,189,212,0.10) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        {/* Brilho radial sutil (canto inferior) */}
        <div style={{
          position: "absolute", bottom: "-5%", right: "-8%",
          width: 360, height: 360, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(61,189,212,0.06) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        {/* Linha de brilho direita */}
        <div style={{
          position: "absolute", top: 0, right: 0, bottom: 0, width: 1,
          background: "linear-gradient(180deg, transparent 0%, rgba(61,189,212,0.15) 40%, rgba(61,189,212,0.06) 70%, transparent 100%)",
          pointerEvents: "none",
        }} />

        {/* Conteúdo da marca */}
        <div style={{ position: "relative", zIndex: 1 }}>

          {/* Logo mark grande */}
          <div style={{ marginBottom: 28 }}>
            <OFLogo size={52} color="#3DBDD4" />
          </div>

          {/* OTAVIO FONTES */}
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "4px", lineHeight: 1, marginBottom: 8 }}>
            <span style={{ color: "#f0f4f8" }}>OTAVIO </span>
            <span style={{ color: "#3DBDD4" }}>FONTES</span>
          </div>

          {/* Barra subline */}
          <div style={{
            display: "inline-block",
            background: "#3DBDD4", color: "#000",
            fontSize: 10, fontWeight: 800, letterSpacing: "2px",
            padding: "5px 14px", borderRadius: 4, marginBottom: 48,
          }}>
            PERSONAL E CONSULTORIA-ON
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.25, color: "#fff", marginBottom: 18 }}>
            Transforme seus<br />
            <span className="gradient-text">resultados.</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.9, maxWidth: 340 }}>
            Plataforma exclusiva para acompanhar seus treinos, evoluir suas cargas e atingir seus objetivos com precisão.
          </p>

          {/* Divider */}
          <div style={{
            width: 40, height: 2,
            background: "linear-gradient(90deg, #3DBDD4, transparent)",
            borderRadius: 2, margin: "36px 0",
          }} />

          {/* Stats */}
          <div style={{ display: "flex", gap: 44 }}>
            {[
              { value: "103+", label: "Exercícios" },
              { value: "100%", label: "Personalizado" },
              { value: "PRs",  label: "Rastreados" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--accent)", letterSpacing: "1px" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, letterSpacing: "1px", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Painel direito — Formulário ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px",
        background: "var(--background)",
        borderLeft: "1px solid rgba(61,189,212,0.05)",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Mobile: brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 36 }} className="md:hidden">
            <OFLogo size={32} color="#3DBDD4" />
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: "2.5px" }}>
              <span style={{ color: "#f0f4f8" }}>OTAVIO </span>
              <span style={{ color: "#3DBDD4" }}>FONTES</span>
            </div>
            <div style={{
              display: "inline-block", background: "#3DBDD4", color: "#000",
              fontSize: 8, fontWeight: 800, letterSpacing: "1.2px",
              padding: "3px 8px", borderRadius: 3,
            }}>
              PERSONAL E CONSULTORIA-ON
            </div>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 5, color: "var(--text-primary)", letterSpacing: "0.3px" }}>
            {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: 13 }}>
            {mode === "login" ? "Entre para acessar sua plataforma" : "Preencha os dados para começar"}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "signup" && (
              <>
                <div>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 7, display: "block", fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" }}>
                    Nome completo
                  </label>
                  <input type="text" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 7, display: "block", fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" }}>
                    Tipo de conta
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {(["student", "trainer"] as const).map((r) => (
                      <button key={r} type="button" onClick={() => setRole(r)} style={{
                        padding: "12px",
                        borderRadius: 10,
                        border: `1px solid ${role === r ? "var(--accent)" : "rgba(255,255,255,0.06)"}`,
                        background: role === r ? "rgba(61,189,212,0.08)" : "var(--surface-2)",
                        color: role === r ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer", fontWeight: 700, fontSize: 13,
                        transition: "all 0.2s",
                        boxShadow: role === r ? "0 0 16px rgba(61,189,212,0.12)" : "none",
                      }}>
                        {r === "student" ? "Aluno" : "Personal"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 7, display: "block", fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" }}>
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={14} color="var(--text-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ paddingLeft: 40 }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 7, display: "block", fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" }}>
                Senha
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={14} color="var(--text-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required minLength={6}
                  style={{ paddingLeft: 40, paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex",
                }}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10, padding: "10px 14px", color: "#ef4444", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: 6, width: "100%", justifyContent: "center", fontSize: 14, padding: "14px", borderRadius: 10 }}
            >
              {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--text-secondary)" }}>
            {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
            >
              {mode === "login" ? "Criar agora" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
