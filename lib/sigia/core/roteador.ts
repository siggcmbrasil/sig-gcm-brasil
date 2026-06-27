import { identificarAgente } from "@/lib/sigia/agentes";

export function rotearMensagemSIGIA(mensagem: string) {
  return identificarAgente(mensagem);
}