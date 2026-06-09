"use client";
import { Lock } from "lucide-react";

export default function CheckinPage() {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 20, textAlign: "center" }} className="animate-fade-in">
      <div style={{
        borderRadius: 20, padding: 48,
        background: "linear-gradient(145deg, #0b1628, #07101e)",
        border: "1px solid rgba(61,189,212,0.1)",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(61,189,212,0.08)",
          border: "1px solid rgba(61,189,212,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <Lock size={28} color="rgba(61,189,212,0.4)" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 10 }}>
          Check-in Diário
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
          Em breve você poderá registrar seu treino, hidratação, sono e passos do dia — tudo em um único lugar.
        </p>
        <div style={{ marginTop: 20, display: "inline-block", background: "rgba(61,189,212,0.1)", border: "1px solid rgba(61,189,212,0.2)", borderRadius: 8, padding: "6px 14px", fontSize: 11, fontWeight: 800, letterSpacing: "1px", color: "#3DBDD4" }}>
          EM BREVE
        </div>
      </div>
    </div>
  );
}
