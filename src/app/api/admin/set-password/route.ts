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

    // Admin client — valida token E faz a operação
    const adminClient = createSupabaseClient(url, svc, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verifica se o chamador tem sessão válida
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? "";

    const { data: { user: caller }, error: authErr } = await adminClient.auth.getUser(token);
    if (authErr || !caller) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    // Verifica se o chamador é trainer
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (profile?.role !== "trainer") {
      return NextResponse.json({ error: "Apenas trainers podem redefinir senhas" }, { status: 403 });
    }

    // Define a senha diretamente
    const { error } = await adminClient.auth.admin.updateUserById(userId, { password });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro ao definir senha" }, { status: 500 });
  }
}
