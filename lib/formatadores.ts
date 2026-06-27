export function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

export function formatarCPF(valor: string) {
  return somenteNumeros(valor)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function limparCPF(valor: string) {
  return somenteNumeros(valor).slice(0, 11);
}

export function formatarTelefone(valor: string) {
  return somenteNumeros(valor)
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function formatarCEP(valor: string) {
  return somenteNumeros(valor)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function formatarRG(valor: string) {
  return valor
    .replace(/[^0-9A-Za-z]/g, "")
    .slice(0, 20);
}

export function formatarCNH(valor: string) {
  return somenteNumeros(valor)
    .slice(0, 11);
}

export function formatarPlaca(valor: string) {
  return valor
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
}

export function formatarRenavam(valor: string) {
  return somenteNumeros(valor)
    .slice(0, 11);
}

export function formatarChassi(valor: string) {
  return valor
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 17);
}

export function formatarDocumentoCondutor(
  tipo: string,
  valor: string
) {
  switch (tipo) {
    case "CPF":
      return formatarCPF(valor);

    case "CNH":
      return formatarCNH(valor);

    case "RG":
      return formatarRG(valor);

    default:
      return valor;
  }
}