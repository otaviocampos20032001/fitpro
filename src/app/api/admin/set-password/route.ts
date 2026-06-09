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

    // Verifica token do trainer no header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");

    const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!svc) {
      return NextResponse.json({ error: "Servidor não configurado (SUPABASE_SERVICE_ROLE_KEY ausente)" }, { status: 503 });
    }

    // Valida sessão e perfil do chamador
    const regularClient = createSupabaseClient(url, anon, { auth: { persistSession: false } });
    const { data: { user }, error: authErr } = await regularClient.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    const { data: profile } = await regularClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "trainer") {
      return NextResponse.json({ error: "Apenas trainers podem redefinir senhas" }, { status: 403 });
    }

    // Admin: define a senha diretamente
    const adminClient = createSupabaseClient(url, svc, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await adminClient.auth.admin.updateUserById(userId, { password });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro ao definir senha" }, { status: 500 });
  }
}
