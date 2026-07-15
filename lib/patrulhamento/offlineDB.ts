export type PontoPatrulhamentoOffline = {
  id_local: string;
  municipio_id: number;
  patrulhamento_id: number;
  latitude: number;
  longitude: number;
  precisao: number | null;
  velocidade: number | null;
  registrado_em: string;
  sincronizado: boolean;
};

const NOME_BANCO = "sig-gcm-offline";
const VERSAO_BANCO = 1;
const LOJA_PONTOS = "pontos_patrulhamento";

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const requisicao = indexedDB.open(
      NOME_BANCO,
      VERSAO_BANCO
    );

    requisicao.onupgradeneeded = () => {
      const banco = requisicao.result;

      if (
        !banco.objectStoreNames.contains(
          LOJA_PONTOS
        )
      ) {
        const loja = banco.createObjectStore(
          LOJA_PONTOS,
          {
            keyPath: "id_local",
          }
        );

        loja.createIndex(
          "por_sincronizado",
          "sincronizado",
          {
            unique: false,
          }
        );

        loja.createIndex(
          "por_patrulhamento",
          "patrulhamento_id",
          {
            unique: false,
          }
        );
      }
    };

    requisicao.onsuccess = () => {
      resolve(requisicao.result);
    };

    requisicao.onerror = () => {
      reject(
        new Error(
          "Não foi possível abrir o banco offline do patrulhamento."
        )
      );
    };
  });
}

function gerarIdLocal() {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export async function salvarPontoOffline(
  ponto: Omit<
    PontoPatrulhamentoOffline,
    "id_local" | "sincronizado"
  >
) {
  const banco = await abrirBanco();

  const registro: PontoPatrulhamentoOffline = {
    ...ponto,
    id_local: gerarIdLocal(),
    sincronizado: false,
  };

  return new Promise<PontoPatrulhamentoOffline>(
    (resolve, reject) => {
      const transacao = banco.transaction(
        LOJA_PONTOS,
        "readwrite"
      );

      const loja = transacao.objectStore(
        LOJA_PONTOS
      );

      loja.put(registro);

      transacao.oncomplete = () => {
        banco.close();
        resolve(registro);
      };

      transacao.onerror = () => {
        banco.close();

        reject(
          new Error(
            "Não foi possível salvar o ponto GPS offline."
          )
        );
      };
    }
  );
}

export async function listarPontosPendentes(
  patrulhamentoId?: number
) {
  const banco = await abrirBanco();

  return new Promise<
    PontoPatrulhamentoOffline[]
  >((resolve, reject) => {
    const transacao = banco.transaction(
      LOJA_PONTOS,
      "readonly"
    );

    const loja = transacao.objectStore(
      LOJA_PONTOS
    );

    const requisicao = loja.getAll();

    requisicao.onsuccess = () => {
      const registros = (
        requisicao.result as PontoPatrulhamentoOffline[]
      ).filter((registro) => {
        const pendente =
          registro.sincronizado === false;

        const mesmoPatrulhamento =
          patrulhamentoId
            ? registro.patrulhamento_id ===
              patrulhamentoId
            : true;

        return (
          pendente &&
          mesmoPatrulhamento
        );
      });

      banco.close();
      resolve(registros);
    };

    requisicao.onerror = () => {
      banco.close();

      reject(
        new Error(
          "Não foi possível listar os pontos offline."
        )
      );
    };
  });
}

export async function marcarPontoSincronizado(
  idLocal: string
) {
  const banco = await abrirBanco();

  return new Promise<void>(
    (resolve, reject) => {
      const transacao = banco.transaction(
        LOJA_PONTOS,
        "readwrite"
      );

      const loja = transacao.objectStore(
        LOJA_PONTOS
      );

      const requisicao = loja.get(idLocal);

      requisicao.onsuccess = () => {
        const registro =
          requisicao.result as
            | PontoPatrulhamentoOffline
            | undefined;

        if (registro) {
          loja.put({
            ...registro,
            sincronizado: true,
          });
        }
      };

      transacao.oncomplete = () => {
        banco.close();
        resolve();
      };

      transacao.onerror = () => {
        banco.close();

        reject(
          new Error(
            "Não foi possível atualizar o ponto sincronizado."
          )
        );
      };
    }
  );
}

export async function removerPontosSincronizados() {
  const banco = await abrirBanco();

  return new Promise<void>(
    (resolve, reject) => {
      const transacao = banco.transaction(
        LOJA_PONTOS,
        "readwrite"
      );

      const loja = transacao.objectStore(
        LOJA_PONTOS
      );

      const requisicao = loja.getAll();

      requisicao.onsuccess = () => {
        const registros =
          requisicao.result as PontoPatrulhamentoOffline[];

        for (const registro of registros) {
          if (registro.sincronizado) {
            loja.delete(
              registro.id_local
            );
          }
        }
      };

      transacao.oncomplete = () => {
        banco.close();
        resolve();
      };

      transacao.onerror = () => {
        banco.close();

        reject(
          new Error(
            "Não foi possível limpar os pontos sincronizados."
          )
        );
      };
    }
  );
}