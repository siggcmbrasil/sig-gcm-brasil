import imageCompression from "browser-image-compression";

export async function prepararFotoGuarda(
  arquivo: File
): Promise<File> {
  if (!arquivo.type.startsWith("image/")) {
    throw new Error(
      "Selecione um arquivo de imagem válido."
    );
  }

  if (arquivo.size > 12 * 1024 * 1024) {
    throw new Error(
      "A imagem original deve ter no máximo 12 MB."
    );
  }

  const comprimida =
    await imageCompression(arquivo, {
      maxSizeMB: 0.35,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      fileType: "image/webp",
      initialQuality: 0.85,
      preserveExif: false,
    });

  return new File(
    [comprimida],
    "foto-guarda.webp",
    {
      type: "image/webp",
      lastModified: Date.now(),
    }
  );
}

export function criarPreviewFoto(
  arquivo: File
) {
  return URL.createObjectURL(arquivo);
}

export function liberarPreviewFoto(
  url?: string | null
) {
  if (
    url &&
    url.startsWith("blob:")
  ) {
    URL.revokeObjectURL(url);
  }
}

export function caminhoFotoGuarda({
  municipioId,
  guardaId,
}: {
  municipioId: number;
  guardaId: number;
}) {
  return `${municipioId}/guardas/${guardaId}.webp`;
}

export function adicionarVersaoFoto(
  fotoUrl?: string | null,
  versao?: string | number
) {
  if (!fotoUrl) {
    return "";
  }

  const separador =
    fotoUrl.includes("?") ? "&" : "?";

  return `${fotoUrl}${separador}v=${
    versao || Date.now()
  }`;
}