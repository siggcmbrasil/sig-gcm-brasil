import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const BUCKET_RECUPERACAO = "recuperacao-senha";
export const LIMITE_ARQUIVO = 5 * 1024 * 1024;
export const DURACAO_SESSAO_MINUTOS = 20;

const MIME_DOCUMENTO = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MIME_SELFIE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function responderPublico(
  corpo: Record<string, unknown>,
  status: number
) {
  return NextResponse.json(corpo, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function normalizarEmail(valor: unknown) {
  return String(valor || "").trim().toLowerCase();
}

export function normalizarCpf(valor: unknown) {
  return String(valor || "").replace(/\D/g, "").slice(0, 11);
}

export function normalizarMatricula(valor: unknown) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/[^\p{L}\p{N}._/-]/gu, "")
    .slice(0, 40);
}

export function normalizarTelefone(valor: unknown) {
  return String(valor || "").replace(/\D/g, "").slice(0, 11);
}

export function emailValido(email: string) {
  return (
    email.length <= 160 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

export function cpfValido(cpf: string) {
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcular = (quantidade: number) => {
    let soma = 0;

    for (let indice = 0; indice < quantidade; indice += 1) {
      soma += Number(cpf[indice]) * (quantidade + 1 - indice);
    }

    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return (
    calcular(9) === Number(cpf[9]) &&
    calcular(10) === Number(cpf[10])
  );
}

export function obterIp(request: NextRequest) {
  const ip =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "0.0.0.0";

  return ip.split(",")[0].trim().slice(0, 64);
}

export function obterUserAgent(request: NextRequest) {
  return String(
    request.headers.get("user-agent") || "Não identificado"
  ).slice(0, 500);
}

export function identificarNavegador(userAgent: string) {
  if (userAgent.includes("Edg/")) return "Edge";
  if (userAgent.includes("OPR/")) return "Opera";
  if (userAgent.includes("Firefox/")) return "Firefox";
  if (userAgent.includes("SamsungBrowser/")) {
    return "Samsung Internet";
  }
  if (userAgent.includes("Chrome/")) return "Chrome";

  if (
    userAgent.includes("Safari/") &&
    !userAgent.includes("Chrome/")
  ) {
    return "Safari";
  }

  return "Outro";
}

export function origemPermitida(request: NextRequest) {
  const origem = request.headers.get("origin");

  if (!origem) return false;

  const permitidas = new Set<string>([
    request.nextUrl.origin.replace(/\/+$/, ""),
    "capacitor://localhost",
    "http://localhost",
    "https://localhost",
  ]);

  const site = String(
    process.env.NEXT_PUBLIC_SITE_URL || ""
  )
    .trim()
    .replace(/\/+$/, "");

  if (site) permitidas.add(site);

  const extras = String(
    process.env.RECUPERACAO_ORIGENS_PERMITIDAS || ""
  )
    .split(",")
    .map((item) => item.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  for (const extra of extras) {
    permitidas.add(extra);
  }

  return permitidas.has(origem.replace(/\/+$/, ""));
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function extensaoPorMime(mime: string) {
  const mapa: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };

  return mapa[mime] || "bin";
}

export function arquivoDeclaradoValido(
  mime: string,
  tamanho: number,
  tipo: "documento" | "selfie"
) {
  if (
    !Number.isSafeInteger(tamanho) ||
    tamanho <= 0 ||
    tamanho > LIMITE_ARQUIVO
  ) {
    return false;
  }

  return tipo === "documento"
    ? MIME_DOCUMENTO.has(mime)
    : MIME_SELFIE.has(mime);
}

export function assinaturaCompativel(
  mime: string,
  bytes: Uint8Array
) {
  if (mime === "application/pdf") {
    return (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46
    );
  }

  if (mime === "image/jpeg") {
    return (
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (mime === "image/png") {
    const assinatura = [
      0x89, 0x50, 0x4e, 0x47,
      0x0d, 0x0a, 0x1a, 0x0a,
    ];

    return assinatura.every(
      (valor, indice) => bytes[indice] === valor
    );
  }

  if (mime === "image/webp") {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }

  return false;
}
