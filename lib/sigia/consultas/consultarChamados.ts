import { supabase } from "@/lib/supabase";

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hojeISO() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

export async function consultarChamados(
  mensagem: string,
  municipioId?: number
) {
  if (!municipioId) {
    return "Município não identificado para consultar os chamados.";
  }

  const texto = normalizar(mensagem);

  let consulta = supabase
    .from("chamados")
    .select(
      "id, protocolo, tipo, local, bairro, prioridade, status, solicitante, telefone, created_at"
    )
    .eq("municipio_id", municipioId)
    .order("created_at", {
      ascending: false,
    })
    .limit(30);

  if (
    texto.includes("hoje") ||
    texto.includes("do dia")
  ) {
    const hoje = hojeISO();

    consulta = consulta
      .gte(
        "created_at",
        `${hoje}T00:00:00`
      )
      .lte(
        "created_at",
        `${hoje}T23:59:59`
      );
  }

  const protocoloMatch =
    mensagem.match(
      /(?:protocolo|chamado)\s*[:#-]?\s*([A-Za-z0-9_-]+)/i
    );

  if (protocoloMatch?.[1]) {
    consulta = consulta.ilike(
      "protocolo",
      `%${protocoloMatch[1].trim()}%`
    );
  }

  if (
    texto.includes("aberto") ||
    texto.includes("pendente")
  ) {
    consulta = consulta.in(
      "status",
      [
        "ABERTO",
        "PENDENTE",
        "EM ANDAMENTO",
        "Em andamento",
        "Aberto",
      ]
    );
  }

  if (
    texto.includes("finalizado") ||
    texto.includes("encerrado")
  ) {
    consulta = consulta.in(
      "status",
      [
        "FINALIZADO",
        "ENCERRADO",
        "Finalizado",
        "Encerrado",
      ]
    );
  }

  if (
    texto.includes("alta prioridade") ||
    texto.includes("prioridade alta")
  ) {
    consulta = consulta.eq(
      "prioridade",
      "ALTA"
    );
  }

  const { data, error } =
    await consulta;

  if (error) {
    console.error(
      "Erro ao consultar chamados na SIGIA:",
      error
    );

    return "Não consegui consultar os chamados do município.";
  }

  if (!data || data.length === 0) {
    return "Nenhum chamado foi encontrado com os critérios informados.";
  }

  if (
    protocoloMatch ||
    data.length === 1
  ) {
    const chamado = data[0];

    return `Chamado encontrado

Protocolo: ${chamado.protocolo || chamado.id}
Tipo: ${chamado.tipo || "Não informado"}
Status: ${chamado.status || "Não informado"}
Prioridade: ${chamado.prioridade || "Não informada"}
Local: ${chamado.local || "Não informado"}
Bairro: ${chamado.bairro || "Não informado"}
Solicitante: ${chamado.solicitante || "Não informado"}
Telefone: ${chamado.telefone || "Não informado"}
Data: ${
      chamado.created_at
        ? new Date(
            chamado.created_at
          ).toLocaleString(
            "pt-BR"
          )
        : "Não informada"
    }`;
  }

  return `Chamados encontrados: ${data.length}

${data
  .map((chamado) => {
    const identificador =
      chamado.protocolo ||
      chamado.id;

    return `• ${identificador} — ${chamado.tipo || "Tipo não informado"} — ${chamado.status || "Status não informado"} — ${chamado.prioridade || "Prioridade não informada"} — ${chamado.local || "Local não informado"}`;
  })
  .join("\n")}`;
}