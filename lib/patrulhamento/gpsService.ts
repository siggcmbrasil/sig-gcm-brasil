import { supabase } from "@/lib/supabase";

export type TipoPontoGPS =
  | "INICIAL"
  | "AUTOMATICO"
  | "MANUAL"
  | "FINAL";

export type PontoGPS = {
  municipio_id: number;
  patrulhamento_id: number;
  latitude: number;
  longitude: number;
  velocidade?: number | null;
  precisao?: number | null;
  tipo: TipoPontoGPS;
  observacao?: string | null;
  criado_em?: string;
};

type PontoGPSOffline = Omit<
  PontoGPS,
  "municipio_id"
> & {
  criado_em: string;
};

type RespostaGPS = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
  quantidade?: number;
};

const CHAVE_OFFLINE =
  "patrulhamento_gps_offline_v2";

const LIMITE_FILA_LOCAL = 5000;
const LIMITE_LOTE_API = 200;

function normalizarNumero(
  valor: unknown
) {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : null;
}

function validarPonto(
  ponto: PontoGPS
) {
  const latitude =
    normalizarNumero(
      ponto.latitude
    );

  const longitude =
    normalizarNumero(
      ponto.longitude
    );

  if (
    latitude === null ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error(
      "Latitude do ponto GPS inválida."
    );
  }

  if (
    longitude === null ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      "Longitude do ponto GPS inválida."
    );
  }

  const patrulhamentoId =
    Number(
      ponto.patrulhamento_id
    );

  if (
    !Number.isSafeInteger(
      patrulhamentoId
    ) ||
    patrulhamentoId <= 0
  ) {
    throw new Error(
      "Patrulhamento inválido para o ponto GPS."
    );
  }

  return {
    patrulhamento_id:
      patrulhamentoId,
    latitude,
    longitude,
    precisao:
      normalizarNumero(
        ponto.precisao
      ),
    velocidade:
      normalizarNumero(
        ponto.velocidade
      ),
    tipo: ponto.tipo,
    observacao:
      ponto.observacao ??
      null,
    criado_em:
      ponto.criado_em ||
      new Date().toISOString(),
  } satisfies PontoGPSOffline;
}

function lerFilaOffline() {
  if (
    typeof window === "undefined"
  ) {
    return [] as PontoGPSOffline[];
  }

  try {
    const valor =
      localStorage.getItem(
        CHAVE_OFFLINE
      );

    if (!valor) {
      return [];
    }

    const fila = JSON.parse(
      valor
    );

    return Array.isArray(fila)
      ? fila
      : [];
  } catch (error) {
    console.error(
      "Erro ao ler fila offline do GPS:",
      error
    );

    return [];
  }
}

function salvarFilaOffline(
  fila: PontoGPSOffline[]
) {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  const limitada =
    fila.slice(
      -LIMITE_FILA_LOCAL
    );

  if (
    limitada.length === 0
  ) {
    localStorage.removeItem(
      CHAVE_OFFLINE
    );
    return;
  }

  localStorage.setItem(
    CHAVE_OFFLINE,
    JSON.stringify(limitada)
  );
}

function adicionarFilaOffline(
  ponto: PontoGPSOffline
) {
  const fila =
    lerFilaOffline();

  fila.push(ponto);

  salvarFilaOffline(fila);
}

async function obterAccessToken() {
  const {
    data: { session },
    error,
  } =
    await supabase.auth.getSession();

  if (
    error ||
    !session?.access_token
  ) {
    throw new Error(
      "Sessão indisponível para registrar o GPS."
    );
  }

  return session.access_token;
}

async function enviarPontos({
  patrulhamentoId,
  pontos,
}: {
  patrulhamentoId: number;
  pontos: PontoGPSOffline[];
}) {
  const accessToken =
    await obterAccessToken();

  const resposta = await fetch(
    "/api/patrulhamento/gps",
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
        "Content-Type":
          "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        patrulhamento_id:
          patrulhamentoId,
        pontos,
      }),
    }
  );

  const dados = (await resposta
    .json()
    .catch(
      () => null
    )) as RespostaGPS | null;

  if (
    !resposta.ok ||
    !dados?.ok
  ) {
    const erro = new Error(
      dados?.erro ||
        "Não foi possível registrar o ponto GPS."
    ) as Error & {
      status?: number;
    };

    erro.status =
      resposta.status;

    throw erro;
  }

  return dados;
}

function deveGuardarOffline(
  error: unknown
) {
  if (
    typeof navigator !==
      "undefined" &&
    !navigator.onLine
  ) {
    return true;
  }

  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error
      ? Number(
          (
            error as {
              status?: unknown;
            }
          ).status
        )
      : 0;

  return (
    status === 0 ||
    status === 401 ||
    status >= 500
  );
}

export async function salvarPontoGPS(
  ponto: PontoGPS
) {
  const validado =
    validarPonto(ponto);

  if (
    typeof navigator !==
      "undefined" &&
    !navigator.onLine
  ) {
    adicionarFilaOffline(
      validado
    );

    return {
      ok: true,
      offline: true,
      mensagem:
        "Ponto GPS guardado para sincronização.",
    };
  }

  try {
    const dados =
      await enviarPontos({
        patrulhamentoId:
          validado.patrulhamento_id,
        pontos: [
          validado,
        ],
      });

    void sincronizarPontosGPSOffline();

    return {
      ...dados,
      offline: false,
    };
  } catch (error) {
    if (
      deveGuardarOffline(
        error
      )
    ) {
      adicionarFilaOffline(
        validado
      );

      console.warn(
        "Ponto GPS guardado offline:",
        {
          patrulhamento_id:
            validado.patrulhamento_id,
          tipo:
            validado.tipo,
          error,
        }
      );

      return {
        ok: true,
        offline: true,
        mensagem:
          "Ponto GPS guardado para sincronização.",
      };
    }

    throw error;
  }
}

export async function sincronizarPontosGPSOffline() {
  if (
    typeof window ===
      "undefined" ||
    !navigator.onLine
  ) {
    return {
      sincronizados: 0,
      pendentes:
        lerFilaOffline()
          .length,
    };
  }

  let fila =
    lerFilaOffline();

  if (
    fila.length === 0
  ) {
    return {
      sincronizados: 0,
      pendentes: 0,
    };
  }

  let sincronizados = 0;

  const patrulhamentos =
    Array.from(
      new Set(
        fila.map(
          (ponto) =>
            ponto.patrulhamento_id
        )
      )
    );

  for (
    const patrulhamentoId of
    patrulhamentos
  ) {
    let pontosDoPatrulhamento =
      fila.filter(
        (ponto) =>
          ponto.patrulhamento_id ===
          patrulhamentoId
      );

    while (
      pontosDoPatrulhamento.length >
      0
    ) {
      const lote =
        pontosDoPatrulhamento.slice(
          0,
          LIMITE_LOTE_API
        );

      try {
        await enviarPontos({
          patrulhamentoId,
          pontos: lote,
        });

        sincronizados +=
          lote.length;

        const chavesRemovidas =
          new Set(
            lote.map(
              (ponto) =>
                [
                  ponto.patrulhamento_id,
                  ponto.criado_em,
                  ponto.latitude,
                  ponto.longitude,
                  ponto.tipo,
                ].join("|")
            )
          );

        fila = fila.filter(
          (ponto) =>
            !chavesRemovidas.has(
              [
                ponto.patrulhamento_id,
                ponto.criado_em,
                ponto.latitude,
                ponto.longitude,
                ponto.tipo,
              ].join("|")
            )
        );

        salvarFilaOffline(
          fila
        );

        pontosDoPatrulhamento =
          pontosDoPatrulhamento.slice(
            lote.length
          );
      } catch (error) {
        console.warn(
          "Não foi possível sincronizar a fila GPS:",
          {
            patrulhamento_id:
              patrulhamentoId,
            quantidade:
              lote.length,
            error,
          }
        );

        return {
          sincronizados,
          pendentes:
            fila.length,
        };
      }
    }
  }

  return {
    sincronizados,
    pendentes:
      fila.length,
  };
}

export function quantidadePontosGPSOffline() {
  return lerFilaOffline()
    .length;
}

if (
  typeof window !==
  "undefined"
) {
  const globalComMarcador =
    window as typeof window & {
      __sigGpsOnlineListener?: boolean;
    };

  if (
    !globalComMarcador.__sigGpsOnlineListener
  ) {
    window.addEventListener(
      "online",
      () => {
        void sincronizarPontosGPSOffline();
      }
    );

    globalComMarcador.__sigGpsOnlineListener =
      true;
  }
}