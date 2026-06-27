import { supabase } from "@/lib/supabase";

function hojeInicioEFim() {
  const agora = new Date();

  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);

  const fim = new Date(agora);
  fim.setHours(23, 59, 59, 999);

  return {
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
  };
}

export async function consultarOcorrenciasHoje() {
  const { inicio, fim } = hojeInicioEFim();

  const { data, error } = await supabase
    .from("ocorrencias")
    .select("id, tipo, local, data")
    .gte("data", inicio)
    .lte("data", fim);

  if (error) {
    console.error("Erro ao consultar ocorrências:", error);

    return "Não consegui consultar as ocorrências de hoje no banco de dados.";
  }

  const total = data?.length || 0;

  if (total === 0) {
    return "Hoje ainda não há ocorrências registradas no sistema.";
  }

  const tipos: Record<string, number> = {};

  data?.forEach((ocorrencia) => {
    const tipo = ocorrencia.tipo || "Não informado";
    tipos[tipo] = (tipos[tipo] || 0) + 1;
  });

  const listaTipos = Object.entries(tipos)
    .map(([tipo, quantidade]) => `• ${tipo}: ${quantidade}`)
    .join("\n");

  return `📊 Ocorrências de hoje

Total registrado: ${total}

Tipos:
${listaTipos}`;
}