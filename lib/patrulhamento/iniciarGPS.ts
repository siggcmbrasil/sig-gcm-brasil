import { salvarPontoGPS } from "./gpsService";
import {
  listarPontosPendentes,
  marcarPontoSincronizado,
  removerPontosSincronizados,
  salvarPontoOffline,
} from "./offlineDB";

const CHAVE_WATCH =
  "patrulhamento_v2_watch_id";

const CHAVE_ATIVO =
  "patrulhamentoAtivoId";

const CHAVE_ULTIMO =
  "patrulhamento_v2_ultimo_ponto";

const CHAVE_SINCRONIZANDO =
  "patrulhamento_v2_sincronizando";

function distanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const raioTerra = 6371000;

  const dLat =
    ((lat2 - lat1) * Math.PI) /
    180;

  const dLon =
    ((lon2 - lon1) * Math.PI) /
    180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      (lat1 * Math.PI) / 180
    ) *
      Math.cos(
        (lat2 * Math.PI) / 180
      ) *
      Math.sin(dLon / 2) ** 2;

  return (
    raioTerra *
    (2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      ))
  );
}

function deveSalvar(
  latitude: number,
  longitude: number
) {
  const salvo =
    localStorage.getItem(
      CHAVE_ULTIMO
    );

  if (!salvo) {
    return true;
  }

  try {
    const ultimo = JSON.parse(
      salvo
    ) as {
      latitude?: number;
      longitude?: number;
      data?: string;
    };

    const latitudeAnterior =
      Number(
        ultimo.latitude
      );

    const longitudeAnterior =
      Number(
        ultimo.longitude
      );

    if (
      !Number.isFinite(
        latitudeAnterior
      ) ||
      !Number.isFinite(
        longitudeAnterior
      )
    ) {
      return true;
    }

    const distancia =
      distanciaMetros(
        latitudeAnterior,
        longitudeAnterior,
        latitude,
        longitude
      );

    return distancia >= 5;
  } catch {
    return true;
  }
}

function atualizarUltimo(
  latitude: number,
  longitude: number
) {
  localStorage.setItem(
    CHAVE_ULTIMO,
    JSON.stringify({
      latitude,
      longitude,
      data:
        new Date().toISOString(),
    })
  );
}

async function sincronizarPontosPendentes(
  patrulhamentoId?: number
) {
  if (
    typeof navigator ===
      "undefined" ||
    !navigator.onLine
  ) {
    return;
  }

  if (
    localStorage.getItem(
      CHAVE_SINCRONIZANDO
    ) === "1"
  ) {
    return;
  }

  localStorage.setItem(
    CHAVE_SINCRONIZANDO,
    "1"
  );

  try {
    const pendentes =
      await listarPontosPendentes(
        patrulhamentoId
      );

    for (const ponto of pendentes) {
      try {
        await salvarPontoGPS({
          municipio_id:
            ponto.municipio_id,
          patrulhamento_id:
            ponto.patrulhamento_id,
          latitude:
            ponto.latitude,
          longitude:
            ponto.longitude,
          precisao:
            ponto.precisao,
          velocidade:
            ponto.velocidade,
          tipo: "AUTOMATICO",
          observacao:
            "Ponto sincronizado após período offline",
        });

        await marcarPontoSincronizado(
          ponto.id_local
        );
      } catch (error) {
        console.warn(
          "Ponto offline ainda não sincronizado:",
          {
            id_local:
              ponto.id_local,
            error,
          }
        );

        break;
      }
    }

    await removerPontosSincronizados();
  } finally {
    localStorage.removeItem(
      CHAVE_SINCRONIZANDO
    );
  }
}

async function registrarPonto({
  municipio_id,
  patrulhamento_id,
  latitude,
  longitude,
  precisao,
  velocidade,
}: {
  municipio_id: number;
  patrulhamento_id: number;
  latitude: number;
  longitude: number;
  precisao: number | null;
  velocidade: number | null;
}) {
  const registradoEm =
    new Date().toISOString();

  await salvarPontoOffline({
    municipio_id,
    patrulhamento_id,
    latitude,
    longitude,
    precisao,
    velocidade,
    registrado_em:
      registradoEm,
  });

  atualizarUltimo(
    latitude,
    longitude
  );

  if (navigator.onLine) {
    await sincronizarPontosPendentes(
      patrulhamento_id
    );
  }
}

export function iniciarGPSPatrulhamento({
  municipio_id,
  patrulhamento_id,
}: {
  municipio_id: number;
  patrulhamento_id: number;
}) {
  if (
    typeof navigator ===
      "undefined" ||
    !navigator.geolocation
  ) {
    throw new Error(
      "GPS não disponível neste dispositivo."
    );
  }

  const antigo =
    localStorage.getItem(
      CHAVE_WATCH
    );

  if (antigo) {
    navigator.geolocation.clearWatch(
      Number(antigo)
    );
  }

  localStorage.setItem(
    CHAVE_ATIVO,
    String(patrulhamento_id)
  );

  const aoVoltarInternet = () => {
    void sincronizarPontosPendentes(
      patrulhamento_id
    );
  };

  window.addEventListener(
    "online",
    aoVoltarInternet
  );

  void sincronizarPontosPendentes(
    patrulhamento_id
  );

  const watchId =
    navigator.geolocation.watchPosition(
      (posicao) => {
        const latitude = Number(
          posicao.coords.latitude
        );

        const longitude = Number(
          posicao.coords.longitude
        );

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return;
        }

        if (
          !deveSalvar(
            latitude,
            longitude
          )
        ) {
          return;
        }

        void registrarPonto({
          municipio_id,
          patrulhamento_id,
          latitude,
          longitude,
          precisao:
            Number.isFinite(
              posicao.coords
                .accuracy
            )
              ? posicao.coords
                  .accuracy
              : null,
          velocidade:
            typeof posicao.coords
              .speed ===
              "number" &&
            Number.isFinite(
              posicao.coords.speed
            )
              ? posicao.coords
                  .speed
              : null,
        }).catch((error) => {
          console.error(
            "Erro ao registrar ponto GPS do patrulhamento:",
            error
          );
        });
      },
      (erro) => {
        console.error(
          "Erro GPS patrulhamento:",
          erro
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000,
      }
    );

  localStorage.setItem(
    CHAVE_WATCH,
    String(watchId)
  );

  return watchId;
}

export async function sincronizarGPSOffline(
  patrulhamentoId?: number
) {
  await sincronizarPontosPendentes(
    patrulhamentoId
  );
}