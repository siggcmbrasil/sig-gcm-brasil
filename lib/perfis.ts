export function ehAdministradorGlobal(
  perfil?: string
) {
  const p = String(
    perfil || ""
  ).toUpperCase();

  return [
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
  ].includes(p);
}