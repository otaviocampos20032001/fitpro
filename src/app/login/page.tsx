"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, Fingerprint, ArrowRight } from "lucide-react";
import OFLogo from "@/components/OFLogo";

const ACCENT = "#00C4F5";

export default function LoginPage() {
  const router = useRouter();
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
    <div style={{ minHeight: "100vh", display: "flex", background: "#030406", position: "relative" }}>

      {/* ── Painel esquerdo — Brand (desktop) ── */}
      <div style={{
        flex: 1, display: "none", flexDirection: "column",
        justifyContent: "space-between", padding: "56px 56px 52px",
        background: "linear-gradient(155deg, #060c15 0%, #020406 55%, #030910 100%)",
        position: "relative", overflow: "hidden",
      }} className="md:flex">

        {/* Grade tech */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(0,196,245,0.022) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,196,245,0.022) 1px, transparent 1px)`,
          backgroundSize: "64px 64px", pointerEvents: "none",
        }} />

        {/* Glow radial central */}
        <div style={{
          position: "absolute", top: "20%", left: "0%",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,196,245,0.065) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        {/* Linha brilho direita */}
        <div style={{
          position: "absolute", top: 0, right: 0, bottom: 0, width: 1,
          background: "linear-gradient(180deg, transparent, rgba(0,196,245,0.11) 35%, rgba(0,196,245,0.04) 70%, transparent)",
          pointerEvents: "none",
        }} />

        {/* ── Topo: Logo ── */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 80 }}>
            <div style={{ filter: "drop-shadow(0 0 22px rgba(0,196,245,0.55))" }}>
              <OFLogo size={30} color={ACCENT} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1 }}>
              <span style={{ color: ACCENT }}>OF</span>
              <span style={{ color: "#fff", fontStyle: "italic" }}>it</span>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 54, fontWeight: 900, lineHeight: 1.1,
            color: "#fff", marginBottom: 24, letterSpacing: "-1.5px",
          }}>
            Ciência.<br />
            <span style={{ color: ACCENT, filter: "drop-shadow(0 0 18px rgba(0,196,245,0.35))" }}>
              Performance.
            </span><br />
            Resultados.
          </h1>

          <p style={{
            color: "rgba(255,255,255,0.32)", fontSize: 14,
            lineHeight: 1.9, maxWidth: 300,
          }}>
            Sistema de gestão de performance humana. Treinos, evolução e dados — tudo em um lugar.
          </p>
        </div>

        {/* ── Base: Stats + badge ── */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", gap: 48, marginBottom: 36 }}>
            {[
              { val: "103+", lbl: "Exercícios" },
              { val: "100%", lbl: "Personalizado" },
              { val: "PRs",  lbl: "Rastreados" },
            ].map(s => (
              <div key={s.lbl}>
                <div style={{
                  fontSize: 22, fontWeight: 800, color: ACCENT, letterSpacing: "0.5px",
                  filter: "drop-shadow(0 0 8px rgba(0,196,245,0.3))",
                }}>{s.val}</div>
                <div style={{
                  fontSize: 9, color: "rgba(255,255,255,0.22)", marginTop: 4,
                  letterSpacing: "1.5px", textTransform: "uppercase",
                }}>{s.lbl}</div>
              </div>
            ))}
          </div>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            border: "1px solid rgba(0,196,245,0.13)",
            background: "rgba(0,196,245,0.04)",
            padding: "8px 16px", borderRadius: 100,
            fontSize: 9, fontWeight: 800, letterSpacing: "2px",
            color: "rgba(0,196,245,0.55)", textTransform: "uppercase",
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }} />
            HUMAN PERFORMANCE SYSTEM
          </div>
        </div>
      </div>

      {/* ── Painel direito — Formulário ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px", minHeight: "100vh",
        borderLeft: "1px solid rgba(0,196,245,0.04)",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Mobile: logo com glow */}
          <div style={{ textAlign: "center", marginBottom: 52 }} className="md:hidden">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ filter: "drop-shadow(0 0 26px rgba(0,196,245,0.72))" }}>
                <OFLogo size={32} color={ACCENT} />
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1 }}>
                <span style={{ color: ACCENT }}>OF</span>
                <span style={{ color: "#fff", fontStyle: "italic" }}>it</span>
              </div>
            </div>
            <div style={{
              fontSize: 8, fontWeight: 800, letterSpacing: "2.5px",
              color: "rgba(0,196,245,0.42)", textTransform: "uppercase",
            }}>
              HUMAN PERFORMANCE SYSTEM
            </div>
          </div>

          {/* Heading */}
          <h2 style={{
            fontSize: 27, fontWeight: 900, letterSpacing: "-0.4px",
            color: "#fff", marginBottom: 8, textTransform: "uppercase",
          }}>
            {mode === "login" ? "Faça Login" : "Criar Conta"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.36)", marginBottom: 36, fontSize: 13, lineHeight: 1.6 }}>
            {mode === "login"
              ? "Bem-vindo de volta à sua melhor versão."
              : "Preencha os dados para começar."}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {mode === "signup" && (
              <>
                <div>
                  <label style={labelSt}>Nome completo</label>
                  <input
                    type="text" placeholder="Seu nome"
                    value={name} onChange={e => setName(e.target.value)} required
                    style={inputSt}
                  />
                </div>
                <div>
                  <label style={labelSt}>Tipo de conta</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {(["student", "trainer"] as const).map(r => (
                      <button key={r} type="button" onClick={() => setRole(r)} style={{
                        padding: "13px", borderRadius: 12,
                        border: `1px solid ${role === r ? ACCENT : "rgba(255,255,255,0.07)"}`,
                        background: role === r ? "rgba(0,196,245,0.08)" : "rgba(255,255,255,0.03)",
                        color: role === r ? ACCENT : "rgba(255,255,255,0.38)",
                        cursor: "pointer", fontWeight: 700, fontSize: 13,
                        transition: "all 0.2s",
                        boxShadow: role === r ? "0 0 20px rgba(0,196,245,0.12)" : "none",
                      }}>
                        {r === "student" ? "Aluno" : "Personal"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* E-MAIL */}
            <div>
              <label style={labelSt}>E-MAIL</label>
              <div style={{ position: "relative" }}>
                <Mail size={14} color="rgba(255,255,255,0.26)"
                  style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="email" placeholder="seu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} required
                  style={{ ...inputSt, paddingLeft: 42 }}
                />
              </div>
            </div>

            {/* SENHA */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ ...labelSt, marginBottom: 0 }}>SENHA</label>
                {mode === "login" && (
                  <span style={{ fontSize: 11, color: ACCENT, cursor: "pointer", fontWeight: 700, letterSpacing: "0.2px" }}>
                    Esqueceu sua senha?
                  </span>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={14} color="rgba(255,255,255,0.26)"
                  style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required minLength={6}
                  style={{ ...inputSt, paddingLeft: 42, paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.26)", padding: 4, display: "flex",
                }}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10, padding: "10px 14px", color: "#ef4444", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            {/* Botão principal */}
            <button
              type="submit" disabled={loading}
              style={{
                marginTop: 4, width: "100%", padding: "16px",
                background: loading
                  ? "rgba(0,196,245,0.22)"
                  : `linear-gradient(135deg, ${ACCENT} 0%, #0099cc 100%)`,
                border: "none", borderRadius: 12,
                cursor: loading ? "not-allowed" : "pointer",
                color: "#000", fontWeight: 900, fontSize: 13, letterSpacing: "2.5px",
                textTransform: "uppercase",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: loading
                  ? "none"
                  : "0 0 32px rgba(0,196,245,0.2), 0 4px 20px rgba(0,0,0,0.5)",
                transition: "all 0.2s",
                position: "relative", overflow: "hidden",
              }}
              onMouseEnter={e => {
                if (!loading) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-1px)";
                  el.style.boxShadow = "0 0 44px rgba(0,196,245,0.35), 0 8px 24px rgba(0,0,0,0.5)";
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = loading ? "none" : "0 0 32px rgba(0,196,245,0.2), 0 4px 20px rgba(0,0,0,0.5)";
              }}
            >
              {loading
                ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                : <ArrowRight size={16} />
              }
              {loading ? "Aguarde..." : (mode === "login" ? "ENTRAR" : "CRIAR CONTA")}
            </button>
          </form>

          {/* OU + BIOMETRIA (modo login) */}
          {mode === "login" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "28px 0 20px" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.16)", fontWeight: 800, letterSpacing: "2.5px" }}>OU</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
              </div>

              <button
                type="button"
                style={{
                  width: "100%", padding: "14px",
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, cursor: "pointer",
                  color: "rgba(255,255,255,0.45)", fontWeight: 700,
                  fontSize: 12, letterSpacing: "2px", textTransform: "uppercase",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  backdropFilter: "blur(8px)", transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.border = "1px solid rgba(0,196,245,0.2)";
                  el.style.color = ACCENT;
                  el.style.boxShadow = "0 0 20px rgba(0,196,245,0.07)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.border = "1px solid rgba(255,255,255,0.07)";
                  el.style.color = "rgba(255,255,255,0.45)";
                  el.style.boxShadow = "none";
                }}
              >
                <Fingerprint size={17} />
                ENTRAR COM BIOMETRIA
              </button>
            </>
          )}

          {/* Link modo */}
          <p style={{ textAlign: "center", marginTop: 32, fontSize: 13, color: "rgba(255,255,255,0.26)" }}>
            {mode === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              style={{ background: "none", border: "none", color: ACCENT, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
            >
              {mode === "login" ? "Criar conta" : "Fazer login"}
            </button>
          </p>

          {/* Tagline */}
          <p style={{
            textAlign: "center", marginTop: 56,
            fontSize: 8.5, fontWeight: 800, letterSpacing: "3px",
            color: "rgba(255,255,255,0.09)", textTransform: "uppercase",
          }}>
            CIÊNCIA · PERFORMANCE · RESULTADOS
          </p>
        </div>
      </div>
    </div>
  );
}

const labelSt: React.CSSProperties = {
  fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 8,
  display: "block", fontWeight: 800, letterSpacing: "1.8px", textTransform: "uppercase",
};

const inputSt: React.CSSProperties = {
  width: "100%", padding: "14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 12, color: "#fff", fontSize: 14,
  outline: "none", transition: "border 0.2s",
  fontFamily: "inherit",
};
