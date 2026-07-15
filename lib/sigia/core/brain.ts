import {
  responderAgente,
  querOcorrenciasHoje,
  querPlantaoHoje,
} from "@/lib/sigia/agentes";
import { buscarConhecimentoSIGIA } from "@/lib/sigia/baseConhecimento";
import {
  consultarOcorrenciasHoje,
  consultarPlantaoHoje,
} from "@/lib/sigia/consultas";
import { buscarPromptPrincipal } from "@/lib/sigia/prompts";
import { criarContextoSIGIA, UsuarioSIGIA } from "./contexto";
import { criarMemoriaTemporaria } from "./memoria";
import { rotearMensagemSIGIA } from "./roteador";
import { salvarLogSIGIA } from "../logs";
import { buscarConhecimentoWebSIGIA } from "../webConhecimento";
import { buscarConhecimentoDocumentosSIGIA } from "../conhecimentoDocumentos";
import { responderComBibliotecaSIGIA } from "../responderBiblioteca";
import { executarConsultaSIGIA } from "./executor";

export async function processarMensagemSIGIA({
  mensagem,
  usuario,
}: {
  mensagem: string;
  usuario?: UsuarioSIGIA | null;
}) {
  const contexto = criarContextoSIGIA(usuario);
  const promptSistema = await buscarPromptPrincipal();

  const respostaSIG = await executarConsultaSIGIA(
  mensagem,
  contexto.municipioId
);

if (respostaSIG) {
  await salvarLogSIGIA(
    usuario?.id,
    mensagem,
    respostaSIG,
    "consulta_sig"
  );

  return {
    agente: "consulta_sig",
    resposta: respostaSIG,
    contexto,
    memoria: criarMemoriaTemporaria(
      mensagem,
      "consulta_sig"
    ),
    promptCarregado: Boolean(promptSistema),
  };
}

  if (querPlantaoHoje(mensagem)) {
  const resposta =
    await consultarPlantaoHoje();

  await salvarLogSIGIA(
    usuario?.id,
    mensagem,
    resposta,
    "operacional"
  );

  return {
    agente: "operacional",
    resposta,
    contexto,
    memoria:
      criarMemoriaTemporaria(
        mensagem,
        "operacional"
      ),
    promptCarregado:
      Boolean(promptSistema),
  };
}

  if (querOcorrenciasHoje(mensagem)) {
    const resposta = await consultarOcorrenciasHoje();

    await salvarLogSIGIA(usuario?.id, mensagem, resposta, "estatisticas");

    return {
      agente: "estatisticas",
      resposta,
      contexto,
      memoria: criarMemoriaTemporaria(mensagem, "estatisticas"),
      promptCarregado: Boolean(promptSistema),
    };
  }

  const conhecimento = await buscarConhecimentoSIGIA(
  mensagem,
  contexto.municipioId
);

if (!respostaSIG && conhecimento) {
  await salvarLogSIGIA(usuario?.id, mensagem, conhecimento, "conhecimento");

  return {
    agente: "conhecimento",
    resposta: conhecimento,
    contexto,
    memoria: criarMemoriaTemporaria(mensagem, "conhecimento"),
    promptCarregado: Boolean(promptSistema),
  };
}

  const conhecimentoDocumentos = await buscarConhecimentoDocumentosSIGIA(
  mensagem,
  contexto.municipioId
);

const conhecimentoWeb = await buscarConhecimentoWebSIGIA(mensagem);

if (
  !respostaSIG &&
  (conhecimentoDocumentos || conhecimentoWeb)
) {
  const resposta = await responderComBibliotecaSIGIA({
  pergunta: mensagem,
  conhecimentoDocumentos,
  conhecimentoWeb,
});

  await salvarLogSIGIA(usuario?.id, mensagem, resposta, "biblioteca_web");

  return {
    agente: "biblioteca_web",
    resposta,
    contexto,
    memoria: criarMemoriaTemporaria(mensagem, "biblioteca_web"),
    promptCarregado: Boolean(promptSistema),
  };
}

  const agente = rotearMensagemSIGIA(mensagem);
  const resposta = responderAgente(agente, mensagem);

  await salvarLogSIGIA(usuario?.id, mensagem, resposta, agente);

  return {
    agente,
    resposta,
    contexto,
    memoria: criarMemoriaTemporaria(mensagem, agente),
    promptCarregado: Boolean(promptSistema),
  };
}