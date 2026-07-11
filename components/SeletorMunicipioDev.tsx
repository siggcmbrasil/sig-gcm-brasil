"use client";

import {
  Building2,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type Usuario = {
  perfil: string;
};

type Municipio = {
  id: number;
  nome: string | null;
  estado: string | null;
  brasao_gcm: string | null;
  ativo: boolean | null;
};

type RespostaContexto = {
  ok?: boolean;
  erro?: string;
  municipio_atual?: Municipio;
  municipios?: Municipio[];
};

function nomeMunicipio(
  municipio: Municipio
) {
  const nome =
    String(
      municipio.nome || ""
    ).trim() ||
    `Município ${municipio.id}`;

  const estado =
    String(
      municipio.estado || ""
    ).trim();

  return estado
    ? `${nome} - ${estado}`
    : nome;
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
      "Sessão inválida ou expirada."
    );
  }

  return session.access_token;
}

function atualizarCacheVisual(
  municipio: Municipio
) {
  try {
    const usuarioSalvo =
      localStorage.getItem(
        "usuarioLogado"
      );

    if (usuarioSalvo) {
      const usuario =
        JSON.parse(usuarioSalvo) as
          Record<string, unknown>;

      usuario.municipio_id =
        municipio.id;
      usuario.municipio_nome =
        municipio.nome || "";

      localStorage.setItem(
        "usuarioLogado",
        JSON.stringify(usuario)
      );
    }

    localStorage.setItem(
      "sig_municipio_contexto",
      JSON.stringify({
        id: municipio.id,
        nome: municipio.nome,
        estado: municipio.estado,
      })
    );
  } catch (error) {
    console.error(
      "Erro ao atualizar cache visual do município:",
      {
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
      }
    );
  }
}

export default function SeletorMunicipioDev({
  usuario,
}: {
  usuario: Usuario;
}) {
  const perfil =
    String(
      usuario.perfil || ""
    ).toUpperCase();

  const [municipios, setMunicipios] =
    useState<Municipio[]>([]);

  const [
    municipioId,
    setMunicipioId,
  ] = useState("");

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    alterando,
    setAlterando,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    if (
      perfil !== "DESENVOLVEDOR"
    ) {
      setCarregando(false);
      return;
    }

    let ativo = true;

    async function carregar() {
      try {
        setCarregando(true);
        setErro("");

        const accessToken =
          await obterAccessToken();

        const resposta =
          await fetch(
            "/api/contexto-municipio",
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
              cache: "no-store",
            }
          );

        const dados =
          (await resposta
            .json()
            .catch(() => ({}))) as
            RespostaContexto;

        if (
          !resposta.ok ||
          !dados.ok
        ) {
          throw new Error(
            dados.erro ||
              "Não foi possível carregar os municípios."
          );
        }

        if (!ativo) {
          return;
        }

        const lista =
          Array.isArray(
            dados.municipios
          )
            ? dados.municipios
            : [];

        const atual =
          dados.municipio_atual ||
          lista[0];

        setMunicipios(lista);

        if (atual) {
          setMunicipioId(
            String(atual.id)
          );

          atualizarCacheVisual(
            atual
          );
        }
      } catch (error) {
        if (!ativo) {
          return;
        }

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar o contexto municipal."
        );
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, [perfil]);

  async function alterarMunicipio(
    valor: string
  ) {
    const novoId =
      Number(valor);

    if (
      !Number.isSafeInteger(
        novoId
      ) ||
      novoId <= 0 ||
      alterando
    ) {
      return;
    }

    const anterior =
      municipioId;

    setMunicipioId(valor);
    setAlterando(true);
    setErro("");

    try {
      const accessToken =
        await obterAccessToken();

      const resposta =
        await fetch(
          "/api/contexto-municipio",
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
              municipio_id:
                novoId,
            }),
          }
        );

      const dados =
        (await resposta
          .json()
          .catch(() => ({}))) as
          RespostaContexto;

      if (
        !resposta.ok ||
        !dados.ok ||
        !dados.municipio_atual
      ) {
        throw new Error(
          dados.erro ||
            "Não foi possível trocar o município."
        );
      }

      atualizarCacheVisual(
        dados.municipio_atual
      );

      window.dispatchEvent(
        new CustomEvent(
          "sig:municipio-contexto-alterado",
          {
            detail:
              dados.municipio_atual,
          }
        )
      );

      window.location.reload();
    } catch (error) {
      setMunicipioId(anterior);

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao trocar o município."
      );
    } finally {
      setAlterando(false);
    }
  }

  if (
    perfil !== "DESENVOLVEDOR"
  ) {
    return null;
  }

  const selecionado =
    municipios.find(
      (municipio) =>
        String(municipio.id) ===
        municipioId
    ) || null;

  return (
    <section className="sticky top-0 z-40 border-b border-cyan-400/20 bg-[#07192d]/95 px-4 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.25)] backdrop-blur md:px-6">
      <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
              Contexto do desenvolvedor
            </div>

            <div className="truncate text-sm font-semibold text-slate-300">
              {selecionado
                ? `Administrando ${nomeMunicipio(selecionado)}`
                : "Selecione a cidade que será administrada"}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto xl:min-w-[430px]">
          <div className="relative min-w-0 flex-1">
            <Building2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-300" />

            <select
              value={municipioId}
              onChange={(event) =>
                void alterarMunicipio(
                  event.target.value
                )
              }
              disabled={
                carregando ||
                alterando ||
                municipios.length === 0
              }
              aria-label="Município administrativo"
              className="h-12 w-full appearance-none rounded-2xl border border-slate-700 bg-slate-950/80 pl-12 pr-12 text-sm font-bold text-white outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando && (
                <option value="">
                  Carregando municípios...
                </option>
              )}

              {!carregando &&
                municipios.length === 0 && (
                  <option value="">
                    Nenhum município disponível
                  </option>
                )}

              {municipios.map(
                (municipio) => (
                  <option
                    key={municipio.id}
                    value={municipio.id}
                  >
                    {nomeMunicipio(
                      municipio
                    )}
                  </option>
                )
              )}
            </select>

            {(carregando ||
              alterando) && (
              <LoaderCircle className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-cyan-300" />
            )}
          </div>
        </div>
      </div>

      {erro && (
        <p className="mt-2 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-200">
          {erro}
        </p>
      )}
    </section>
  );
}