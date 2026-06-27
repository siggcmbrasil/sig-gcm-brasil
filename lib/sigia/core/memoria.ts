export type MemoriaSIGIA = {
  ultimaMensagem?: string;
  ultimoAgente?: string;
};

export function criarMemoriaTemporaria(
  mensagem: string,
  agente: string
): MemoriaSIGIA {
  return {
    ultimaMensagem: mensagem,
    ultimoAgente: agente,
  };
}