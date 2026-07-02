export function getUsuarioLogado() {
  if (typeof window === "undefined") {
    return {};
  }

  return JSON.parse(
    localStorage.getItem("usuarioLogado") || "{}"
  );
}

export function getMunicipioNome() {
  const usuario = getUsuarioLogado();
  return usuario?.municipio_nome || "-";
}

export function getMunicipioId() {
  const usuario = getUsuarioLogado();
  return usuario?.municipio_id || null;
}