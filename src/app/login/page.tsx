"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Dumbbell, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

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
        router.push("/dashboard");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, role } },
        });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
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
    <div
      style={{ minHeight: "100vh", display: "flex", background: "var(--background)" }}
    >
      {/* Left Panel — branding */}
      <div
        style={{
          flex: 1,
          display: "none",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
          background: "linear-gradient(135deg, #1a0a3a 0%, #0a0a1f 50%, #0d1a0d 100%)",
          position: "relative",
          overflow: "hidden",
        }}
        className="md:flex"
      >
        {/* Background circles */}
        <div style={{
          position: "absolute", top: "10%", left: "10%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "15%", right: "5%",
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #7c3aed, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Dumbbell size={24} color="white" />
            </div>
            <span style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>FitPro</span>
          </div>

          <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.2, color: "var(--text-primary)", marginBottom: 20 }}>
            Treinos que<br />
            <span className="gradient-text">transformam</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.7, maxWidth: 360 }}>
            Plataforma completa para personal trainers prescreverem, acompanharem e evoluírem seus alunos.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: 40, marginTop: 56 }}>
            {[
              { value: "100+", label: "Exercícios" },
              { value: "∞", label: "Alunos" },
              { value: "PRs", label: "Rastreados" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent-light)" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — form */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }} className="md:hidden">
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, #7c3aed, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Dumbbell size={20} color="white" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700 }}>FitPro</span>
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
            {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: 14 }}>
            {mode === "login"
              ? "Entre com seus dados para continuar"
              : "Preencha seus dados para começar"}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "signup" && (
              <>
                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block", fontWeight: 500 }}>
                    Nome completo
                  </label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, display: "block", fontWeight: 500 }}>
                    Tipo de conta
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {(["student", "trainer"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        style={{
                          padding: "12px",
                          borderRadius: 12,
                          border: `2px solid ${role === r ? "var(--accent)" : "var(--border)"}`,
                          background: role === r ? "rgba(124,58,237,0.15)" : "var(--surface-2)",
                          color: role === r ? "var(--accent-light)" : "var(--text-secondary)",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 13,
                          transition: "all 0.2s",
                        }}
                      >
                        {r === "student" ? "🏋️ Aluno" : "👨‍🏫 Personal"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block", fontWeight: 500 }}>
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block", fontWeight: 500 }}>
                Senha
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ paddingLeft: 40, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                    padding: 4,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 10, padding: "10px 14px", color: "#ef4444", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8, width: "100%", justifyContent: "center", fontSize: 15 }}>
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--text-secondary)" }}>
            {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              style={{ background: "none", border: "none", color: "var(--accent-light)", cursor: "pointer", fontWeight: 600 }}
            >
              {mode === "login" ? "Criar agora" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
