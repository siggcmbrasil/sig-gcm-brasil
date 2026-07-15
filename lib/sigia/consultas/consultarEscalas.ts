import { supabase } from "@/lib/supabase";

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function dataHojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function consultarEscalas(
  mensagem: string,
  municipioId?: number
) {
  if (!municipioId) {
    return "Município não identificado para consultar as escalas.";
  }

  const texto = normalizar(mensagem);

  let dataConsulta = dataHojeISO();

  const dataMatch = mensagem.match(
    /\b(\d{2})\/(\d{2})\/(\d{4})\b/
  );

  if (dataMatch) {
    dataConsulta =
      `${dataMatch[3]}-${dataMatch[2]}-${dataMatch[1]}`;
  } else if (
    texto.includes("amanha")
  ) {
    const amanha = new Date();
    amanha.setDate(
      amanha.getDate() + 1
    );

    dataConsulta =
      amanha.toISOString().slice(0, 10);
  } else if (
    texto.includes("ontem")
  ) {
    const ontem = new Date();
    ontem.setDate(
      ontem.getDate() - 1
    );

    dataConsulta =
      ontem.toISOString().slice(0, 10);
  }

  let consulta = supabase
    .from("escalas_servico")
    .select(
      "id, data_servico, guarda_nome, matricula, tipo, turno, equipe, observacao"
    )
    .eq("municipio_id", municipioId)
    .eq("data_servico", dataConsulta)
    .order("equipe", {
      ascending: true,
    })
    .order("guarda_nome", {
      ascending: true,
    });

  const equipeMatch =
    mensagem.match(
      /(?:equipe|guarnicao|guarnição)\s+([A-Za-zÀ-ÿ0-9_-]+)/i
    );

  if (equipeMatch?.[1]) {
    consulta = consulta.ilike(
      "equipe",
      `%${equipeMatch[1].trim()}%`
    );
  }

  const matriculaMatch =
    mensagem.match(
      /(?:matricula|matrícula)\s+([A-Za-z0-9_-]+)/i
    );

  if (matriculaMatch?.[1]) {
    consulta = consulta.eq(
      "matricula",
      matriculaMatch[1].trim()
    );
  }

  const { data, error } =
    await consulta;

  if (error) {
    console.error(
      "Erro ao consultar escalas na SIGIA:",
      error
    );

    return "Não consegui consultar as escalas de serviço.";
  }

  const dataFormatada =
    new Date(
      `${dataConsulta}T12:00:00`
    ).toLocaleDateString("pt-BR");

  if (!data || data.length === 0) {
    return `Nenhuma escala foi encontrada para ${dataFormatada}.`;
  }

  const equipes = data.reduce<
    Record<
      string,
      Array<{
        nome: string;
        matricula: string;
        tipo: string;
        turno: string;
        observacao: string;
      }>
    >
  >((acumulador, registro) => {
    const equipe =
      registro.equipe ||
      "Equipe não informada";

    if (!acumulador[equipe]) {
      acumulador[equipe] = [];
    }

    acumulador[equipe].push({
      nome:
        registro.guarda_nome ||
        "Guarda não informado",
      matricula:
        registro.matricula || "",
      tipo:
        registro.tipo || "",
      turno:
        registro.turno || "",
      observacao:
        registro.observacao || "",
    });

    return acumulador;
  }, {});

  const blocos = Object.entries(
    equipes
  ).map(
    ([equipe, integrantes]) => {
      const lista = integrantes
        .map((integrante) => {
          const detalhes = [
            integrante.matricula
              ? `Matrícula ${integrante.matricula}`
              : "",
            integrante.tipo,
            integrante.turno,
          ]
            .filter(Boolean)
            .join(" • ");

          return detalhes
            ? `• ${integrante.nome} — ${detalhes}`
            : `• ${integrante.nome}`;
        })
        .join("\n");

      return `Guarnição ${equipe}\n${lista}`;
    }
  );

  return `Escala de ${dataFormatada}

${blocos.join("\n\n")}`;
}