import { supabase } from "@/lib/supabase";

export async function consultarEstatisticas(
  mensagem: string,
  municipioId?: number
) {
  if (!municipioId) {
    return "Município não identificado.";
  }

  const hoje = new Date()
    .toISOString()
    .slice(0, 10);

  const [
    ocorrencias,
    guardas,
    viaturas,
    patrulhamentos,
  ] = await Promise.all([
    supabase
      .from("ocorrencias")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("municipio_id", municipioId)
      .gte("data", `${hoje}T00:00:00`)
      .lte("data", `${hoje}T23:59:59`),

    supabase
      .from("guardas")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("municipio_id", municipioId),

    supabase
      .from("viaturas")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("municipio_id", municipioId),

    supabase
      .from("patrulhamentos")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("municipio_id", municipioId)
      .gte(
        "iniciado_em",
        `${hoje}T00:00:00`
      )
      .lte(
        "iniciado_em",
        `${hoje}T23:59:59`
      ),
  ]);

  return `📊 Estatísticas do município

Ocorrências hoje: ${ocorrencias.count ?? 0}

Guardas cadastrados: ${guardas.count ?? 0}

Viaturas cadastradas: ${viaturas.count ?? 0}

Patrulhamentos hoje: ${patrulhamentos.count ?? 0}`;
}