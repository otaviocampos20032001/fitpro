"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Loader2, Copy, Check } from "lucide-react";
import Link from "next/link";

export default function NovoAlunoPage() {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Create invite via signUp — in production, use Supabase invite email
      const tempPassword = Math.random().toString(36).slice(2, 10) + "A1!";
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: { data: { name, role: "student" } },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("Erro ao criar aluno");

      // Link student to trainer
      await (supabase.from("profiles") as any).update({
        trainer_id: user.id,
        phone: phone || null,
        goal: goal || null,
      }).eq("id", data.user.id);

      const link = `${window.location.origin}/login?email=${encodeURIComponent(email)}&senha=${encodeURIComponent(tempPassword)}`;
      setInviteLink(link);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar aluno";
      if (msg.includes("User already registered")) setError("Este email já está cadastrado. Peça ao aluno para fazer login.");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (inviteLink) {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", paddingTop: 20 }} className="animate-slide-up">
        <div className="glass-card" style={{ padding: 32, textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <UserPlus size={32} color="var(--green)" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            Aluno criado!
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
            Compartilhe o link abaixo com {name} para que ele acesse o app.
          </p>

          <div style={{
            background: "var(--surface-2)", borderRadius: 10, padding: "12px 16px",
            marginBottom: 16, wordBreak: "break-all", fontSize: 12,
            color: "var(--text-secondary)", textAlign: "left",
            border: "1px solid var(--border)",
          }}>
            {inviteLink}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={copyLink} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copiado!" : "Copiar link de acesso"}
            </button>
            <Link href="/dashboard/alunos" className="btn-ghost" style={{ textDecoration: "none", width: "100%", justifyContent: "center" }}>
              Ver todos os alunos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }} className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <Link href="/dashboard/alunos" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>Novo Aluno</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>Crie o perfil e envie o acesso</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 28 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 500 }}>
                Nome completo *
              </label>
              <input type="text" placeholder="João Silva" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 500 }}>
                Telefone
              </label>
              <input type="tel" placeholder="(11) 9 9999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 500 }}>
              Email *
            </label>
            <input type="email" placeholder="aluno@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 500 }}>
              Objetivo
            </label>
            <input type="text" placeholder="Ex: Hipertrofia, emagrecimento, condicionamento..." value={goal} onChange={(e) => setGoal(e.target.value)} />
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10, padding: "10px 14px", color: "#ef4444", fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <Link href="/dashboard/alunos" className="btn-ghost" style={{ textDecoration: "none", flex: 1, justifyContent: "center" }}>
              Cancelar
            </Link>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, justifyContent: "center" }}>
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <UserPlus size={16} />}
              {loading ? "Criando..." : "Criar Aluno"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
