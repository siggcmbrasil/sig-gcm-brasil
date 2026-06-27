import { responderAgente, querOcorrenciasHoje } from "@/lib/sigia/agentes";
import { buscarConhecimentoSIGIA } from "@/lib/sigia/baseConhecimento";
import { consultarOcorrenciasHoje } from "@/lib/sigia/consultas";
import { buscarPromptPrincipal } from "@/lib/sigia/prompts";
import { criarContextoSIGIA, UsuarioSIGIA } from "./contexto";
import { criarMemoriaTemporaria } from "./memoria";
import { rotearMensagemSIGIA } from "./roteador";
import { salvarLogSIGIA } from "../logs";
import { buscarConhecimentoWebSIGIA } from "../webConhecimento";
import { buscarConhecimentoDocumentosSIGIA } from "../conhecimentoDocumentos";
import { responderComBibliotecaSIGIA } from "../responderBiblioteca";

export async function processarMensagemSIGIA({
  mensagem,
  usuario,
}: {
  mensagem: string;
  usuario?: UsuarioSIGIA | null;
}) {
  const contexto = criarContextoSIGIA(usuario);
  const promptSistema = await buscarPromptPrincipal();

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

if (conhecimento) {
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

if (conhecimentoDocumentos || conhecimentoWeb) {
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