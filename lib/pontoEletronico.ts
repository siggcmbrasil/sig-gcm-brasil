"use client";

export type UsuarioPonto = {
  id: number | string;
  nome: string;
  perfil: string;
  municipio_id: number;
  matricula?: string;
};

export function normalizarPonto(valor: unknown) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioPonto(): UsuarioPonto | null {
  if (typeof window === "undefined") return null;

  try {
    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "null"
    ) as UsuarioPonto | null;

    if (!usuario?.id || !usuario?.municipio_id || !usuario?.perfil) {
      return null;
    }

    return {
      ...usuario,
      perfil: normalizarPonto(usuario.perfil),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarPonto(perfil: string) {
  return [
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
  ].includes(normalizarPonto(perfil));
}

export function formatarDataHoraPonto(valor?: string | null) {
  if (!valor) return "--";
  const data = new Date(valor);
  return Number.isNaN(data.getTime())
    ? valor
    : data.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      });
}

export function formatarMinutosPonto(minutos?: number | null) {
  const total = Math.max(0, Number(minutos || 0));
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  return `${horas}h ${String(resto).padStart(2, "0")}min`;
}

export function hojeBahia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function obterLocalizacaoPonto() {
  if (!navigator.geolocation) {
    throw new Error("GPS não disponível neste dispositivo.");
  }

  return new Promise<{
    latitude: number;
    longitude: number;
    precisao: number;
  }>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (posicao) =>
        resolve({
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
          precisao: posicao.coords.accuracy,
        }),
      () => reject(new Error("Não foi possível obter sua localização.")),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

export async function reduzirFotoPonto(arquivo: File) {
  return new Promise<string>((resolve, reject) => {
    const leitor = new FileReader();

    leitor.onload = () => {
      const imagem = new Image();

      imagem.onload = () => {
        const limite = 640;
        const proporcao = Math.min(1, limite / Math.max(imagem.width, imagem.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(imagem.width * proporcao);
        canvas.height = Math.round(imagem.height * proporcao);

        const contexto = canvas.getContext("2d");
        if (!contexto) {
          reject(new Error("Não foi possível processar a foto."));
          return;
        }

        contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.68));
      };

      imagem.onerror = () => reject(new Error("Foto inválida."));
      imagem.src = String(leitor.result);
    };

    leitor.onerror = () => reject(new Error("Não foi possível ler a foto."));
    leitor.readAsDataURL(arquivo);
  });
}
