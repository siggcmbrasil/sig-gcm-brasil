import { supabase } from "@/lib/supabase";

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

export async function consultarOcorrenciasHoje() {
  const dataHoje = hoje();

  const { data, error } = await supabase
    .from("ocorrencias")
    .select("id,tipo,local,data")
    .gte("data", `${dataHoje}T00:00:00`)
    .lte("data", `${dataHoje}T23:59:59`);

  if (error) {
    return "Não consegui consultar as ocorrências de hoje.";
  }

  if (!data?.length) {
    return "Hoje ainda não existem ocorrências registradas.";
  }

  const tipos: Record<string, number> = {};

  data.forEach((o) => {
    tipos[o.tipo || "Não informado"] =
      (tipos[o.tipo || "Não informado"] || 0) + 1;
  });

  return `Hoje existem ${data.length} ocorrência(s).\n\n${Object.entries(
    tipos
  )
    .map(([t, q]) => `${t}: ${q}`)
    .join("\n")}`;
}

export async function consultarPlantaoHoje() {
  const dataHoje = hoje();

  const { data, error } = await supabase
    .from("escalas_servico")
    .select("*")
    .eq("data_servico", dataHoje)
    .order("equipe");

  if (error) {
    console.error(error);
    return "Não consegui consultar a escala de serviço.";
  }

  if (!data || data.length === 0) {
    return "Não existe escala cadastrada para hoje.";
  }

  const equipes: Record<string, string[]> = {};

  data.forEach((g: any) => {
    const equipe = g.equipe || "Sem equipe";

    if (!equipes[equipe]) {
      equipes[equipe] = [];
    }

    equipes[equipe].push(
      `${g.guarda_nome} (${g.tipo})`
    );
  });

  let resposta = "👮 Plantão de hoje\n\n";

  Object.entries(equipes).forEach(([equipe, guardas]) => {
    resposta += `🚔 ${equipe}\n`;
    resposta += guardas.join("\n");
    resposta += "\n\n";
  });

  return resposta;
}