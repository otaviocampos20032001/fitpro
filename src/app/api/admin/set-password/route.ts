import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { userId, password } = await req.json();

    if (!userId || !password) {
      return NextResponse.json({ error: "userId e password são obrigatórios" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!svc) {
      return NextResponse.json(
        { error: "Servidor não configurado (SUPABASE_SERVICE_ROLE_KEY ausente)" },
        { status: 503 }
      );
    }

    const adminClient = createSupabaseClient(url, svc, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Extrai o caller ID diretamente do JWT (sem chamada extra ao Supabase Auth)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    let callerId: string | null = null;

    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], "base64url").toString("utf-8")
        );
        callerId = payload.sub ?? null;
      }
    } catch {
      // token malformado
    }

    if (!callerId) {
      return NextResponse.json({ error: "Token inválido ou sessão expirada" }, { status: 401 });
    }

    // Verifica no banco se o caller é trainer
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", callerId)
      .single();

    if (profile?.role !== "trainer") {
      return NextResponse.json({ error: "Apenas trainers podem redefinir senhas" }, { status: 403 });
    }

    // Define a senha diretamente via Admin API
    const { error } = await adminClient.auth.admin.updateUserById(userId, { password });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro ao definir senha" }, { status: 500 });
  }
}
