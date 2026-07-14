"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Copy,
  Link2,
  Plus,
  RefreshCw,
  ShieldX,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";

const PERFIS = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "CMT_GUARNICAO",
  "PLANTONISTA",
  "GUARDA",
  "CONSULTA",
] as const;

type Perfil = (typeof PERFIS)[number];

type Municipio = {
  id: number;
  nome: string;
  estado: string;
};

type Convite = {
  id: number;
  municipio_id: number;
  token: string;
  perfil: Perfil;
  email_destino: string | null;
  expira_em: string;
  limite_uso: number;
  usos: number;
  ativo: boolean;
  criado_em: string;
  desativado_em: string | null;
};

type RespostaConvites = {
  ok?: boolean;
  erro?: string;
  perfil_atual?: Perfil;
  perfis_permitidos?: Perfil[];
  municipios?: Municipio[];
  municipio_selecionado?: number;
  convites?: Convite[];
  convite?: Convite;
};

type EstadoConvite =
  | "ATIVO"
  | "EXPIRADO"
  | "ESGOTADO"
  | "INATIVO";

function mensagemErro(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Erro desconhecido.";
}

function emailValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

async function obterAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("Sessão inválida ou expirada.");
  }

  return session.access_token;
}

function estadoConvite(convite: Convite): EstadoConvite {
  if (!convite.ativo) return "INATIVO";
  if (convite.usos >= convite.limite_uso) return "ESGOTADO";

  const expiracao = new Date(convite.expira_em);

  if (
    Number.isNaN(expiracao.getTime()) ||
    expiracao.getTime() <= Date.now()
  ) {
    return "EXPIRADO";
  }

  return "ATIVO";
}

function formatarData(valor: string | null) {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "-";

  return data.toLocaleString("pt-BR");
}

export default function ConvitesUsuariosPage() {
  const [convites, setConvites] = useState<Convite[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [perfisPermitidos, setPerfisPermitidos] = useState<Perfil[]>([]);
  const [municipioId, setMunicipioId] = useState("");
  const [perfil, setPerfil] = useState<Perfil>("GUARDA");
  const [emailDestino, setEmailDestino] = useState("");
  const [validadeDias, setValidadeDias] = useState("7");
  const [limiteUso, setLimiteUso] = useState("1");
  const [origem, setOrigem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [acaoEmAndamento, setAcaoEmAndamento] =
    useState<number | null>(null);

  const carregarConvites = useCallback(
    async (municipioEscolhido?: number) => {
      setCarregando(true);

      try {
        const accessToken = await obterAccessToken();
        const query = municipioEscolhido
          ? `?municipio_id=${municipioEscolhido}`
          : "";

        const resposta = await fetch(
          `/api/usuarios/convites${query}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
          }
        );

        const dados = (await resposta.json()) as RespostaConvites;

        if (!resposta.ok) {
          throw new Error(
            dados.erro || "Não foi possível carregar os convites."
          );
        }

        const listaPerfis = dados.perfis_permitidos || [];
        const listaMunicipios = dados.municipios || [];

        setPerfisPermitidos(listaPerfis);
        setMunicipios(listaMunicipios);
        setConvites(dados.convites || []);

        const perfilInicial = listaPerfis.includes("GUARDA")
          ? "GUARDA"
          : listaPerfis[0];

        if (perfilInicial && !listaPerfis.includes(perfil)) {
          setPerfil(perfilInicial);
        }

        if (dados.municipio_selecionado) {
          setMunicipioId(
            String(dados.municipio_selecionado)
          );
        }
      } catch (error) {
        console.error(
          `Erro ao carregar convites: ${mensagemErro(error)}`
        );
        alert(mensagemErro(error));
      } finally {
        setCarregando(false);
      }
    },
    [perfil]
  );

  useEffect(() => {
    setOrigem(window.location.origin);
    void carregarConvites();
  }, [carregarConvites]);

  const municipioSelecionado = useMemo(
    () =>
      municipios.find(
        (item) => item.id === Number(municipioId)
      ) || null,
    [municipioId, municipios]
  );

  async function gerarConvite(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (salvando) return;

    const email = emailDestino.trim().toLowerCase();
    const dias = Number(validadeDias);
    const limite = Number(limiteUso);
    const idMunicipio = Number(municipioId);

    if (
      !Number.isSafeInteger(idMunicipio) ||
      idMunicipio <= 0 ||
      !municipioSelecionado
    ) {
      alert("Selecione um município válido.");
      return;
    }

    if (!perfisPermitidos.includes(perfil)) {
      alert("O perfil escolhido não é permitido.");
      return;
    }

    if (email && !emailValido(email)) {
      alert("Informe um e-mail de destino válido.");
      return;
    }

    if (![1, 2, 7, 15, 30].includes(dias)) {
      alert("A validade informada é inválida.");
      return;
    }

    if (
      !Number.isSafeInteger(limite) ||
      limite < 1 ||
      limite > 20
    ) {
      alert("O limite de uso deve ficar entre 1 e 20.");
      return;
    }

    setSalvando(true);

    try {
      const accessToken = await obterAccessToken();

      const resposta = await fetch(
        "/api/usuarios/convites",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            municipio_id: idMunicipio,
            perfil,
            email_destino: email || null,
            validade_dias: dias,
            limite_uso: limite,
          }),
        }
      );

      const dados = (await resposta.json()) as RespostaConvites;

      if (!resposta.ok || !dados.convite) {
        throw new Error(
          dados.erro || "Não foi possível gerar o convite."
        );
      }

      try {
        await registrarAuditoria({
          modulo: "Usuários",
          acao: "GERAR_CONVITE",
          descricao: `Gerou convite para o perfil ${perfil} no município ${municipioSelecionado.nome}.`,
        });
      } catch (auditoriaError) {
        console.error(
          `Auditoria complementar não registrada: ${mensagemErro(
            auditoriaError
          )}`
        );
      }

      setConvites((lista) => [
        dados.convite as Convite,
        ...lista,
      ]);
      setEmailDestino("");
      setValidadeDias("7");
      setLimiteUso("1");

      alert("Convite gerado com sucesso.");
    } catch (error) {
      console.error(
        `Erro ao gerar convite: ${mensagemErro(error)}`
      );
      alert(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  function linkConvite(token: string) {
    return `${origem}/cadastro?convite=${token}`;
  }

  async function copiar(token: string) {
    try {
      const link = linkConvite(token);

      if (!origem) {
        throw new Error("Endereço do sistema ainda não disponível.");
      }

      await navigator.clipboard.writeText(link);
      alert("Link copiado.");
    } catch (error) {
      console.error(
        `Erro ao copiar convite: ${mensagemErro(error)}`
      );
      alert("Não foi possível copiar o link.");
    }
  }

  async function desativarConvite(convite: Convite) {
    if (
      !window.confirm(
        `Deseja desativar o convite do perfil ${convite.perfil}?`
      )
    ) {
      return;
    }

    setAcaoEmAndamento(convite.id);

    try {
      const accessToken = await obterAccessToken();

      const resposta = await fetch(
        "/api/usuarios/convites",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            id: convite.id,
            acao: "DESATIVAR",
          }),
        }
      );

      const dados = (await resposta.json()) as RespostaConvites;

      if (!resposta.ok || !dados.convite) {
        throw new Error(
          dados.erro ||
            "Não foi possível desativar o convite."
        );
      }

      try {
        await registrarAuditoria({
          modulo: "Usuários",
          acao: "DESATIVAR_CONVITE",
          descricao: `Desativou o convite ID ${convite.id}, perfil ${convite.perfil}.`,
        });
      } catch (auditoriaError) {
        console.error(
          `Auditoria complementar não registrada: ${mensagemErro(
            auditoriaError
          )}`
        );
      }

      setConvites((lista) =>
        lista.map((item) =>
          item.id === convite.id
            ? (dados.convite as Convite)
            : item
        )
      );

      alert("Convite desativado.");
    } catch (error) {
      console.error(
        `Erro ao desativar convite: ${mensagemErro(error)}`
      );
      alert(mensagemErro(error));
    } finally {
      setAcaoEmAndamento(null);
    }
  }

  return (
    <ProtecaoModulo modulo="usuarios">
      <div className="space-y-6 p-4 pb-24 md:p-6">
        <section className="painel-premium p-6">
          <h1 className="flex items-center gap-3 text-3xl font-black text-white md:text-4xl">
            <Link2 className="text-cyan-400" />
            Convites por Link
          </h1>

          <p className="mt-2 text-slate-400">
            Gere links controlados por município, perfil, prazo e
            limite de uso.
          </p>
        </section>

        <form
          onSubmit={gerarConvite}
          className="painel-premium space-y-4 p-6"
        >
          <h2 className="text-xl font-black text-white">
            Novo convite
          </h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="label">Município</label>

              <select
                className="input"
                value={municipioId}
                onChange={(event) => {
                  const novoMunicipio = event.target.value;
                  setMunicipioId(novoMunicipio);

                  if (novoMunicipio) {
                    void carregarConvites(
                      Number(novoMunicipio)
                    );
                  }
                }}
                disabled={municipios.length <= 1}
                required
              >
                <option value="">Selecione</option>

                {municipios.map((municipio) => (
                  <option
                    key={municipio.id}
                    value={municipio.id}
                  >
                    {municipio.nome} - {municipio.estado}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                E-mail de destino
              </label>

              <input
                className="input"
                type="email"
                placeholder="Opcional"
                value={emailDestino}
                onChange={(event) =>
                  setEmailDestino(event.target.value)
                }
                maxLength={160}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Perfil</label>

              <select
                className="input"
                value={perfil}
                onChange={(event) =>
                  setPerfil(event.target.value as Perfil)
                }
                required
              >
                {perfisPermitidos.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Validade</label>

              <select
                className="input"
                value={validadeDias}
                onChange={(event) =>
                  setValidadeDias(event.target.value)
                }
              >
                <option value="1">24 horas</option>
                <option value="2">48 horas</option>
                <option value="7">7 dias</option>
                <option value="15">15 dias</option>
                <option value="30">30 dias</option>
              </select>
            </div>

            <div>
              <label className="label">
                Limite de uso
              </label>

              <input
                className="input"
                type="number"
                min={1}
                max={20}
                step={1}
                value={limiteUso}
                onChange={(event) =>
                  setLimiteUso(event.target.value)
                }
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={
              salvando ||
              carregando ||
              !municipioId ||
              perfisPermitidos.length === 0
            }
            className="flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={18} />
            {salvando ? "Gerando..." : "Gerar convite"}
          </button>
        </form>

        <section className="painel-premium p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">
                Convites gerados
              </h2>

              {municipioSelecionado && (
                <p className="mt-1 text-sm text-slate-400">
                  {municipioSelecionado.nome} -{" "}
                  {municipioSelecionado.estado}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                void carregarConvites(
                  municipioId
                    ? Number(municipioId)
                    : undefined
                )
              }
              disabled={carregando}
              className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 font-bold text-white hover:bg-blue-600 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={carregando ? "animate-spin" : ""}
              />
              Atualizar
            </button>
          </div>

          {carregando ? (
            <p className="text-slate-400">
              Carregando convites...
            </p>
          ) : convites.length === 0 ? (
            <p className="text-slate-400">
              Nenhum convite encontrado.
            </p>
          ) : (
            <div className="space-y-3">
              {convites.map((convite) => {
                const estado = estadoConvite(convite);
                const permiteCopiar = estado === "ATIVO";

                return (
                  <article
                    key={convite.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-white">
                            Perfil: {convite.perfil}
                          </p>

                          <BadgeEstado estado={estado} />
                        </div>

                        <p className="mt-2 text-sm text-slate-400">
                          Usos: {convite.usos}/
                          {convite.limite_uso} • Expira em:{" "}
                          {formatarData(convite.expira_em)}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Destino:{" "}
                          {convite.email_destino ||
                            "qualquer e-mail"}
                        </p>

                        <p className="mt-2 break-all text-xs text-slate-500">
                          {linkConvite(convite.token)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void copiar(convite.token)
                          }
                          disabled={!permiteCopiar}
                          className="flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Copy size={14} />
                          Copiar
                        </button>

                        {convite.ativo && (
                          <button
                            type="button"
                            onClick={() =>
                              void desativarConvite(convite)
                            }
                            disabled={
                              acaoEmAndamento === convite.id
                            }
                            className="flex items-center gap-1 rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
                          >
                            <ShieldX size={14} />
                            {acaoEmAndamento === convite.id
                              ? "Desativando..."
                              : "Desativar"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </ProtecaoModulo>
  );
}

function BadgeEstado({
  estado,
}: {
  estado: EstadoConvite;
}) {
  const cores: Record<EstadoConvite, string> = {
    ATIVO: "bg-green-700 text-green-100",
    EXPIRADO: "bg-yellow-700 text-yellow-100",
    ESGOTADO: "bg-orange-700 text-orange-100",
    INATIVO: "bg-red-700 text-red-100",
  };

  return (
    <span
      className={`${cores[estado]} rounded-full px-3 py-2 text-xs font-bold`}
    >
      {estado}
    </span>
  );
}
