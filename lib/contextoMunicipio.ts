export type MunicipioContextoLocal = {
  id: number;
  nome: string;
  estado: string;
};

function numeroId(
  valor: unknown
) {
  const numero = Number(valor);

  if (
    !Number.isSafeInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

export function lerMunicipioContextoLocal():
  | MunicipioContextoLocal
  | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  try {
    const salvo =
      window.localStorage.getItem(
        "sig_municipio_contexto"
      );

    if (!salvo) {
      return null;
    }

    const dados =
      JSON.parse(salvo) as
        Record<string, unknown>;

    const id =
      numeroId(dados.id);

    if (!id) {
      return null;
    }

    return {
      id,
      nome:
        String(
          dados.nome || ""
        ).trim(),
      estado:
        String(
          dados.estado || ""
        ).trim(),
    };
  } catch {
    return null;
  }
}

export function obterMunicipioIdEfetivo({
  perfil,
  municipioIdUsuario,
}: {
  perfil: unknown;
  municipioIdUsuario: unknown;
}) {
  const perfilNormalizado =
    String(perfil || "")
      .trim()
      .toUpperCase();

  if (
    perfilNormalizado ===
    "DESENVOLVEDOR"
  ) {
    const contexto =
      lerMunicipioContextoLocal();

    if (contexto) {
      return contexto.id;
    }
  }

  return numeroId(
    municipioIdUsuario
  );
}

export function montarUrlComMunicipioContexto({
  url,
  perfil,
  municipioIdUsuario,
}: {
  url: string;
  perfil: unknown;
  municipioIdUsuario: unknown;
}) {
  const perfilNormalizado =
    String(perfil || "")
      .trim()
      .toUpperCase();

  if (
    perfilNormalizado !==
    "DESENVOLVEDOR"
  ) {
    return url;
  }

  const municipioId =
    obterMunicipioIdEfetivo({
      perfil,
      municipioIdUsuario,
    });

  if (!municipioId) {
    return url;
  }

  const separador =
    url.includes("?")
      ? "&"
      : "?";

  return (
    `${url}${separador}` +
    `municipio_id=${encodeURIComponent(
      String(municipioId)
    )}`
  );
}
