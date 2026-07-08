import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      usuario_id,
      municipio_id,
      email,
    } = body;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "Não identificado";

    const dispositivo =
      req.headers.get("user-agent") || "Não identificado";

    let navegador = "Outro";

    if (dispositivo.includes("Chrome"))
      navegador = "Chrome";

    if (dispositivo.includes("Firefox"))
      navegador = "Firefox";

    if (
      dispositivo.includes("Safari") &&
      !dispositivo.includes("Chrome")
    )
      navegador = "Safari";

    if (dispositivo.includes("Edg"))
      navegador = "Edge";

    await supabaseAdmin
      .from("usuarios")
      .update({
        ultimo_login: new Date().toISOString(),
        ultimo_ip: ip,
        ultimo_dispositivo: dispositivo,
        ultimo_navegador: navegador,
      })
      .eq("id", usuario_id);

    await supabaseAdmin
      .from("logs_acesso")
      .insert({
        usuario_id,
        municipio_id,
        email,
        ip,
        dispositivo,
        navegador,
        acao: "LOGIN",
        status: "SUCESSO",
      });

    return NextResponse.json({
      ok: true,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json(
      { ok: false },
      { status: 500 }
    );
  }
}