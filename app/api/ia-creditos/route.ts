import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const municipioId = Number(body?.municipio_id);

if (!municipioId) {
  return NextResponse.json(
    {
      saldo: 0,
      erro: "Município inválido.",
    },
    { status: 400 }
  );
}

    const { data, error } = await supabaseAdmin
      .from("ia_creditos_municipio")
      .select("saldo")
      .eq("municipio_id", municipioId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar créditos IA:", error);

      return NextResponse.json({
        saldo: 0,
        erro: "Erro ao buscar créditos.",
      });
    }

    if (!data) {
      return NextResponse.json({
        saldo: 0,
        erro: "Município sem créditos cadastrados.",
      });
    }

    return NextResponse.json({
      saldo: data.saldo || 0,
    });
  } catch (error) {
    console.error("Erro geral créditos IA:", error);

    return NextResponse.json({
      saldo: 0,
      erro: "Erro ao carregar créditos.",
    });
  }
}