import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, password } = body;

    if (!userId || !password) {
      return NextResponse.json({ error: "userId e password são obrigatórios" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) return NextResponse.json({ error: "NEXT_PUBLIC_SUPABASE_URL ausente" }, { status: 503 });
    if (!svc) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY ausente" }, { status: 503 });

    // Decodifica JWT para obter caller ID
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    let callerId: string | null = null;
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
        callerId = payload.sub ?? null;
      }
    } catch { /* token malformado */ }

    if (!callerId) {
      return NextResponse.json({ error: "Token inválido ou sessão expirada" }, { status: 401 });
    }

    // Admin client
    const admin = createSupabaseClient(url, svc, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verifica se caller é trainer
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("role")
      .eq("id", callerId)
      .single();

    if (profileErr) {
      return NextResponse.json({ error: `Erro ao buscar perfil: ${profileErr.message}` }, { status: 500 });
    }
    if (profile?.role !== "trainer") {
      return NextResponse.json({ error: "Apenas trainers podem redefinir senhas" }, { status: 403 });
    }

    // Define a senha via Admin API
    const { data: updatedUser, error: updateErr } = await admin.auth.admin.updateUserById(
      userId,
      { password }
    );

    if (updateErr) {
      // Retorna o erro detalhado do Supabase para diagnóstico
      return NextResponse.json(
        { error: updateErr.message, code: (updateErr as any).code, status: (updateErr as any).status },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, email: updatedUser.user?.email });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro desconhecido", stack: e?.stack?.slice(0, 200) }, { status: 500 });
  }
}
