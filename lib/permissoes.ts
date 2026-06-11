export const HIERARQUIA = {
  DESENVOLVEDOR: 100,
  ADMIN: 90,
  COMANDANTE: 80,
  DIRETOR: 70,
  CMT_GUARNICAO: 60,
  PLANTONISTA: 50,
  GUARDA: 40,
  CONSULTA: 10,
};

export function temPermissao(
  perfilUsuario: string,
  perfilMinimo: string
) {
  const nivelUsuario =
    HIERARQUIA[perfilUsuario as keyof typeof HIERARQUIA] || 0;

  const nivelMinimo =
    HIERARQUIA[perfilMinimo as keyof typeof HIERARQUIA] || 0;

  return nivelUsuario >= nivelMinimo;
}

export function ehDesenvolvedor(perfil: string) {
  return perfil === "DESENVOLVEDOR";
}