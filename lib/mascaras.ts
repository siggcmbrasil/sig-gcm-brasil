export function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

export function formatarCPF(valor: string) {
  const v = somenteNumeros(valor).slice(0, 11);

  return v
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatarCNH(valor: string) {
  return somenteNumeros(valor).slice(0, 11);
}

export function formatarRG(valor: string) {
  return valor.toUpperCase().replace(/[^0-9X]/g, "").slice(0, 12);
}

export function formatarDocumentoCondutor(tipo: string, valor: string) {
  if (tipo === "CPF") return formatarCPF(valor);
  if (tipo === "CNH") return formatarCNH(valor);
  if (tipo === "RG") return formatarRG(valor);

  return valor.toUpperCase().slice(0, 20);
}

export function formatarRENAVAM(valor: string) {
  return somenteNumeros(valor).slice(0, 11);
}

export function formatarPlaca(valor: string) {
  return valor
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
}