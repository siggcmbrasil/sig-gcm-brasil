import { consultarPlantaoHoje } from "../consultas/consultarPlantao";
import { consultarOcorrencias } from "../consultas/consultarOcorrencias";
import { consultarViaturas } from "../consultas/consultarViaturas";
import { consultarGuardas } from "../consultas/consultarGuardas";
import { consultarEscalas } from "../consultas/consultarEscalas";
import { consultarChamados } from "../consultas/consultarChamados";
import { consultarPatrulhamento } from "../consultas/consultarPatrulhamento";
import { consultarVisitas } from "../consultas/consultarVisitas";
import { consultarArmamento } from "../consultas/consultarArmamento";
import { consultarPatrimonio } from "../consultas/consultarPatrimonio";
import { consultarUsuarios } from "../consultas/consultarUsuarios";
import { consultarRH } from "../consultas/consultarRH";
import { consultarMapa } from "../consultas/consultarMapa";
import { consultarEstatisticas } from "../consultas/consultarEstatisticas";
import { consultarFeed } from "../consultas/consultarFeed";
import { consultarMunicipio } from "../consultas/consultarMunicipio";

function normalizar(valor: string) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extrairPerguntaAtual(valor: string) {
  const textoCompleto = String(valor || "");

  const marcadores = [
    "SOLICITAÇÃO ATUAL DO USUÁRIO",
    "SOLICITACAO ATUAL DO USUARIO",
    "SOLICITAÇÃO DO USUÁRIO",
    "SOLICITACAO DO USUARIO",
  ];

  for (const marcador of marcadores) {
    const indice = textoCompleto.lastIndexOf(marcador);

    if (indice >= 0) {
      return textoCompleto
        .slice(indice + marcador.length)
        .trim();
    }
  }

  return textoCompleto.trim();
}

function contemFrase(
  texto: string,
  frases: string[]
) {
  return frases.some((frase) =>
    texto.includes(normalizar(frase))
  );
}

function contemPalavra(
  texto: string,
  palavras: string[]
) {
  const tokens = texto.split(" ");

  return palavras.some((palavra) =>
    tokens.includes(normalizar(palavra))
  );
}

export async function executarConsultaSIGIA(
  mensagem: string,
  municipioId?: number
) {
  const perguntaAtual =
  extrairPerguntaAtual(mensagem);

const t = normalizar(perguntaAtual);

  if (!t) {
    return false;
  }

  if (
  (
    t.includes("amanha") ||
    t.includes("ontem") ||
    /\b\d{2}\/\d{2}\/\d{4}\b/.test(
      perguntaAtual
    )
  ) &&
  (
    t.includes("escala") ||
    t.includes("plantao") ||
    t.includes("servico") ||
    t.includes("guarnicao")
  )
) {
  return consultarEscalas(
    perguntaAtual,
    municipioId
  );
}

  if (
    contemFrase(t, [
      "quem está de plantão",
      "quem esta de plantao",
      "plantão de hoje",
      "plantao de hoje",
      "quem está de serviço",
      "quem esta de servico",
      "equipe de hoje",
      "guarnição de hoje",
      "guarnicao de hoje",
    ])
  ) {
    return consultarPlantaoHoje(
      municipioId
    );
  }

  if (
    contemPalavra(t, [
      "viatura",
      "viaturas",
      "frota",
      "prefixo",
    ]) ||
    contemFrase(t, [
      "placa da viatura",
      "viatura disponível",
      "viaturas disponíveis",
      "qual viatura",
      "consultar viatura",
    ])
  ) {
  return consultarViaturas(
  perguntaAtual,
  municipioId
);
  }

  if (
    contemPalavra(t, [
      "escala",
      "escalas",
    ]) ||
    contemFrase(t, [
      "escala de amanhã",
      "escala de amanha",
      "escala de ontem",
      "escala do dia",
    ])
  ) {
    return consultarEscalas(
      mensagem,
      municipioId
    );
  }

  if (
    contemPalavra(t, [
      "chamado",
      "chamados",
    ])
  ) {
    return consultarChamados(
      mensagem,
      municipioId
    );
  }

  if (
    contemPalavra(t, [
      "patrulhamento",
      "patrulhamentos",
    ])
  ) {
    return consultarPatrulhamento(
      mensagem,
      municipioId
    );
  }

  if (
    contemPalavra(t, [
      "visita",
      "visitas",
      "checkin",
    ]) ||
    contemFrase(t, [
      "qr code",
      "ponto visitado",
    ])
  ) {
    return consultarVisitas(
      mensagem,
      municipioId
    );
  }

  if (
    contemPalavra(t, [
      "armamento",
      "armamentos",
      "cautela",
      "munição",
      "municao",
      "pistola",
      "revólver",
      "revolver",
    ])
  ) {
    return consultarArmamento(
      mensagem,
      municipioId
    );
  }

  if (
    contemPalavra(t, [
      "patrimônio",
      "patrimonio",
      "tombamento",
      "inventário",
      "inventario",
    ]) ||
    contemFrase(t, [
      "bem patrimonial",
    ])
  ) {
    return consultarPatrimonio(
      mensagem,
      municipioId
    );
  }

  if (
    contemPalavra(t, [
      "férias",
      "ferias",
      "atestado",
      "afastamento",
    ]) ||
    contemFrase(t, [
      "banco de horas",
      "recursos humanos",
    ])
  ) {
    return consultarRH(
      mensagem,
      municipioId
    );
  }

  if (
    contemPalavra(t, [
      "usuário",
      "usuario",
      "usuários",
      "usuarios",
      "login",
    ]) ||
    contemFrase(t, [
      "perfil de acesso",
      "usuário bloqueado",
      "usuario bloqueado",
      "usuário pendente",
      "usuario pendente",
    ])
  ) {
    return consultarUsuarios(
      mensagem,
      municipioId
    );
  }

  if (
    contemPalavra(t, [
      "guarda",
      "guardas",
      "gcm",
      "matrícula",
      "matricula",
      "efetivo",
    ])
  ) {
    return consultarGuardas(
      mensagem,
      municipioId
    );
  }

  if (
    contemPalavra(t, [
      "estatística",
      "estatistica",
      "estatísticas",
      "estatisticas",
      "ranking",
      "indicador",
      "indicadores",
    ]) ||
    contemFrase(t, [
      "quantas ocorrências",
      "quantas ocorrencias",
      "total de ocorrências",
      "total de ocorrencias",
      "analisar estatísticas",
      "analisar estatisticas",
    ])
  ) {
    return consultarEstatisticas(
      mensagem,
      municipioId
    );
  }

  if (
    contemPalavra(t, [
      "ocorrência",
      "ocorrencia",
      "ocorrências",
      "ocorrencias",
    ]) ||
    contemFrase(t, [
      "boletim de ocorrência",
      "boletim de ocorrencia",
      "registro de ocorrência",
      "registro de ocorrencia",
    ])
  ) {
    return consultarOcorrencias(
      mensagem,
      municipioId
    );
  }

  if (
    contemPalavra(t, [
      "mapa",
    ]) ||
    contemFrase(t, [
      "mapa operacional",
      "localização da equipe",
      "localizacao da equipe",
      "posição da viatura",
      "posicao da viatura",
    ])
  ) {
    return consultarMapa(
      mensagem,
      municipioId
    );
  }

  if (
    contemPalavra(t, [
      "feed",
      "publicação",
      "publicacao",
      "publicações",
      "publicacoes",
      "comunicado",
      "comunicados",
    ])
  ) {
    return consultarFeed(
      mensagem,
      municipioId
    );
  }

  if (
    contemPalavra(t, [
      "município",
      "municipio",
      "cidade",
    ]) ||
    contemFrase(t, [
      "dados municipais",
      "nome da guarda",
      "comandante municipal",
    ])
  ) {
    return consultarMunicipio(
      mensagem,
      municipioId
    );
  }

  return false;
}