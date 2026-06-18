import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { municipio_id } = await req.json();

    const { data } = await supabaseAdmin
      .from("ia_creditos_municipio")
      .select("saldo")
      .eq("municipio_id", municipio_id)
      .single();

    return NextResponse.json({
      saldo: data?.saldo || 0,
    });
  } catch {
    return NextResponse.json(
      { saldo: 0 },
      { status: 500 }
    );
  }
}