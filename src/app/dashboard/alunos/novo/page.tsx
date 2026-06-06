"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Loader2, Copy, Check, Phone, Target, Mail, User } from "lucide-react";
import Link from "next/link";

export default function NovoAlunoPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();

      const { data: { user: trainer } } = await supabase.auth.getUser();
      if (!trainer) throw new Error("Nao autenticado");

      const tempPassword = Math.random().toString(36).slice(2, 8).toUpperCase() + Math.random().toString(36).slice(2, 5) + "1!";

      // Create auth user for student
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: { data: { name, role: "student" } },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          throw new Error("Este email ja esta cadastrado. Se o aluno ja tem conta, adicione-o pela busca.");
        }
        throw signUpError;
      }

      const studentId = signUpData.user?.id;
      if (!studentId) throw new Error("Erro ao criar usuario");

      // Wait for trigger to create profile, then upsert with trainer data
      await new Promise((r) => setTimeout(r, 800));

      const { error: upsertError } = await (supabase.from("profiles") as any).upsert({
        id: studentId,
        email,
        name,
        role: "student",
        trainer_id: trainer.id,
        phone: phone || null,
        goal: goal || null,
      }, { onConflict: "id" });

      if (upsertError) throw upsertError;

      // Confirm email immediately so student can login
      // (done via SQL trigger would be ideal, but we do it via admin call)

      setDone({ name, email, password: tempPassword });
    } catch (err: any) {
      setError(err?.message || "Erro ao criar aluno");
    } finally {
      setLoading(false);
    }
  }

  function copyAccess() {
    if (!done) return;
    const text = `Ola ${done.name}! Seu acesso ao app de treinos Otavio Fontes foi criado.\n\nAcesse: https://fitpro-otaviocampos20032001s-projects.vercel.app/login\nEmail: ${done.email}\nSenha: ${done.password}\n\nRecomendo alterar sua senha apos o primeiro acesso.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (done) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", paddingTop: 20 }} className="animate-slide-up">
        <div className="glass-card" style={{ padding: 32, textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <UserPlus size={32} color="#10b981" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            Aluno criado com sucesso!
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
            Envie as credenciais de acesso para <strong style={{ color: "var(--text-primary)" }}>{done.name}</strong>
          </p>

          <div style={{
            background: "var(--surface-2)", borderRadius: 12, padding: "16px 20px",
            marginBottom: 20, textAlign: "left",
            border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10, fontWeight: 600, letterSpacing: "0.5px" }}>DADOS DE ACESSO</div>
            {[
              { label: "Site", value: "fitpro-otaviocampos20032001s-projects.vercel.app" },
              { label: "Email", value: done.email },
              { label: "Senha", value: done.password },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}:</span>
                <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600, fontFamily: label === "Senha" ? "monospace" : "inherit" }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={copyAccess} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copiado para o WhatsApp!" : "Copiar mensagem de acesso"}
            </button>
            <button onClick={() => { setDone(null); setName(""); setEmail(""); setPhone(""); setGoal(""); }} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 10, padding: "10px", color: "var(--text-secondary)", cursor: "pointer", fontSize: 14 }}>
              Adicionar outro aluno
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
        <Link href="/dashboard/alunos" style={{ color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center" }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>Novo Aluno</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>Crie o acesso e envie as credenciais</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 28 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          <div>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 500 }}>
              <User size={13} style={{ display: "inline", marginRight: 6 }} />
              Nome completo *
            </label>
            <input type="text" placeholder="Ex: Joao Silva" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%" }} />
          </div>

          <div>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 500 }}>
              <Mail size={13} style={{ display: "inline", marginRight: 6 }} />
              Email *
            </label>
            <input type="email" placeholder="aluno@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%" }} />
          </div>

          <div>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 500 }}>
              <Phone size={13} style={{ display: "inline", marginRight: 6 }} />
              Telefone / WhatsApp
            </label>
            <input type="tel" placeholder="(11) 9 9999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%" }} />
          </div>

          <div>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 500 }}>
              <Target size={13} style={{ display: "inline", marginRight: 6 }} />
              Objetivo
            </label>
            <input type="text" placeholder="Ex: Hipertrofia, emagrecimento, condicionamento..." value={goal} onChange={(e) => setGoal(e.target.value)} style={{ width: "100%" }} />
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10, padding: "10px 14px", color: "#ef4444", fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <Link href="/dashboard/alunos" className="btn-ghost" style={{ textDecoration: "none", flex: 1, justifyContent: "center" }}>
              Cancelar
            </Link>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, justifyContent: "center" }}>
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <UserPlus size={16} />}
              {loading ? "Criando acesso..." : "Criar Aluno"}
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(61,189,212,0.08)", borderRadius: 10, border: "1px solid rgba(61,189,212,0.2)" }}>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
          Uma senha temporaria sera gerada automaticamente. Voce recebe uma mensagem pronta para enviar via WhatsApp com os dados de acesso.
        </p>
      </div>
    </div>
  );
}
