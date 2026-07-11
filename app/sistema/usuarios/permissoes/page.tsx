"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  LoaderCircle,
  LockKeyhole,
  Pencil,
  PlusCircle,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import {
  CampoPermissao,
  GRUPOS_MODULOS,
  Perfil,
} from "@/lib/permissoes/catalogo";

type Permissao = {
  id: number;
  municipio_id: number;
  perfil: Perfil;
  modulo: string;
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

type Municipio = {
  id: number;
  nome: string;
};

type Contexto = {
  gestor_perfil: Perfil;
  municipios: Municipio[];
  perfis: Perfil[];
  municipio_selecionado: number;
  perfil_selecionado: Perfil;
};

type RespostaLista = {
  ok?: boolean;
  erro?: string;
  contexto?: Contexto;
  permissoes?: Permissao[];
  modulos_disponiveis?: string[];
};

type RespostaAlteracao = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
  permissao?: Permissao;
};

const campos: {
  campo: CampoPermissao;
  titulo: string;
  icone: React.ReactNode;
  cor: string;
}[] = [
  {
    campo: "pode_ver",
    titulo: "Ver",
    icone: <Eye className="h-4 w-4" />,
    cor: "text-cyan-400",
  },
  {
    campo: "pode_criar",
    titulo: "Criar",
    icone: <PlusCircle className="h-4 w-4" />,
    cor: "text-emerald-400",
  },
  {
    campo: "pode_editar",
    titulo: "Editar",
    icone: <Pencil className="h-4 w-4" />,
    cor: "text-blue-400",
  },
  {
    campo: "pode_excluir",
    titulo: "Excluir",
    icone: <Trash2 className="h-4 w-4" />,
    cor: "text-red-400",
  },
];

function nomeModulo(modulo: string) {
  return modulo
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letra) =>
      letra.toUpperCase()
    );
}

async function obterAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error(
      "Sua sessão expirou. Entre novamente no sistema."
    );
  }

  return session.access_token;
}

async function lerResposta<T>(
  resposta: Response
): Promise<T> {
  const texto = await resposta.text();

  if (!texto) return {} as T;

  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new Error(
      "O servidor retornou uma resposta inválida."
    );
  }
}

export default function PermissoesPage() {
  const [contexto, setContexto] =
    useState<Contexto | null>(null);
  const [perfilSelecionado, setPerfilSelecionado] =
    useState<Perfil>("GUARDA");
  const [municipioSelecionado, setMunicipioSelecionado] =
    useState<number | null>(null);
  const [permissoes, setPermissoes] = useState<
    Permissao[]
  >([]);
  const [modulosDisponiveis, setModulosDisponiveis] =
    useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [salvandoChave, setSalvandoChave] =
    useState("");
  const [erroTela, setErroTela] = useState("");

  const carregarPermissoes = useCallback(
    async (
      municipioId?: number | null,
      perfil?: Perfil
    ) => {
      setCarregando(true);
      setErroTela("");

      try {
        const accessToken =
          await obterAccessToken();

        const parametros =
          new URLSearchParams();

        if (municipioId) {
          parametros.set(
            "municipio_id",
            String(municipioId)
          );
        }

        if (perfil) {
          parametros.set("perfil", perfil);
        }

        const resposta = await fetch(
          `/api/permissoes?${parametros.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
          }
        );

        const corpo =
          await lerResposta<RespostaLista>(
            resposta
          );

        if (
          !resposta.ok ||
          !corpo.ok ||
          !corpo.contexto
        ) {
          throw new Error(
            corpo.erro ||
              "Não foi possível carregar as permissões."
          );
        }

        setContexto(corpo.contexto);
        setMunicipioSelecionado(
          corpo.contexto.municipio_selecionado
        );
        setPerfilSelecionado(
          corpo.contexto.perfil_selecionado
        );
        setPermissoes(
          corpo.permissoes || []
        );
        setModulosDisponiveis(
          corpo.modulos_disponiveis || []
        );
      } catch (error) {
        const mensagem =
          error instanceof Error
            ? error.message
            : "Erro desconhecido.";

        console.error(
          `Erro ao carregar matriz de permissões: ${mensagem}`
        );
        setErroTela(mensagem);
        setPermissoes([]);
      } finally {
        setCarregando(false);
      }
    },
    []
  );

  useEffect(() => {
    void carregarPermissoes(
      municipioSelecionado,
      perfilSelecionado
    );
  }, [carregarPermissoes]);

const todosModulosCatalogo = useMemo<string[]>(
  () =>
    Array.from(
      new Set<string>(
        GRUPOS_MODULOS.flatMap((grupo) =>
          grupo.modulos.map((modulo) =>
            String(modulo)
          )
        )
      )
    ),
  []
);
  const gruposComExtras = useMemo(() => {
    const extras = modulosDisponiveis.filter(
      (modulo) =>
        !todosModulosCatalogo.includes(modulo)
    );

    return [
      ...GRUPOS_MODULOS.map((grupo) => ({
        titulo: grupo.titulo,
        descricao: grupo.descricao,
        modulos: [...grupo.modulos],
      })),
      ...(extras.length
        ? [
            {
              titulo: "Outros módulos cadastrados",
              descricao:
                "Chaves existentes preservadas durante a migração.",
              modulos: extras,
            },
          ]
        : []),
    ];
  }, [
    modulosDisponiveis,
    todosModulosCatalogo,
  ]);

  const gruposFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return gruposComExtras
      .map((grupo) => ({
        ...grupo,
        modulos: grupo.modulos.filter(
          (modulo) =>
            !termo ||
            `${grupo.titulo} ${grupo.descricao} ${modulo} ${nomeModulo(
              modulo
            )}`
              .toLowerCase()
              .includes(termo)
        ),
      }))
      .filter(
        (grupo) => grupo.modulos.length > 0
      );
  }, [busca, gruposComExtras]);

  function valorPermissao(
    modulo: string,
    campo: CampoPermissao
  ) {
    const item = permissoes.find(
      (permissao) =>
        permissao.modulo === modulo
    );

    return Boolean(item?.[campo]);
  }

  async function alterarPermissao(
    modulo: string,
    campo: CampoPermissao,
    valor: boolean
  ) {
    if (!municipioSelecionado) {
      alert("Selecione um município.");
      return;
    }

    const chave = `${modulo}-${campo}`;
    setSalvandoChave(chave);

    try {
      const accessToken =
        await obterAccessToken();

      const resposta = await fetch(
        "/api/permissoes",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            municipio_id: municipioSelecionado,
            perfil: perfilSelecionado,
            modulo,
            campo,
            valor,
          }),
        }
      );

      const corpo =
        await lerResposta<RespostaAlteracao>(
          resposta
        );

      if (
        !resposta.ok ||
        !corpo.ok ||
        !corpo.permissao
      ) {
        throw new Error(
          corpo.erro ||
            "Não foi possível salvar a permissão."
        );
      }

      setPermissoes((anteriores) => {
        const existe = anteriores.some(
          (item) =>
            item.modulo ===
            corpo.permissao?.modulo
        );

        if (!existe) {
          return [
            ...anteriores,
            corpo.permissao as Permissao,
          ];
        }

        return anteriores.map((item) =>
          item.modulo ===
          corpo.permissao?.modulo
            ? (corpo.permissao as Permissao)
            : item
        );
      });
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro desconhecido.";

      console.warn(
        `Permissão não alterada: ${mensagem}`
      );
      alert(mensagem);
    } finally {
      setSalvandoChave("");
    }
  }

  const totalMarcadas = permissoes.reduce(
    (total, item) =>
      total +
      Number(item.pode_ver) +
      Number(item.pode_criar) +
      Number(item.pode_editar) +
      Number(item.pode_excluir),
    0
  );

  const modulosLiberados = permissoes.filter(
    (item) => item.pode_ver
  ).length;

  return (
    <ProtecaoModulo modulo="permissoes">
      <div className="space-y-6 p-4 pb-24 md:p-6">
        <SigPageHeader
          titulo="Permissões de Acesso"
          subtitulo="Controle seguro e separado por município e hierarquia."
          icone={LockKeyhole}
        />

        {erroTela && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
            <AlertTriangle
              className="mt-0.5 shrink-0"
              size={20}
            />
            <div>
              <p className="font-black">
                Não foi possível carregar
              </p>
              <p className="mt-1 text-sm">
                {erroTela}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <SigCard>
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-500/30 bg-cyan-500/10">
                  <UserCog className="h-9 w-9 text-cyan-400" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
                    Central de Segurança
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-white md:text-3xl">
                    Matriz de Permissões
                  </h2>

                  <p className="mt-2 leading-relaxed text-slate-400">
                    Cada alteração é validada no
                    servidor, limitada pela hierarquia
                    e registrada em auditoria.
                  </p>
                </div>
              </div>
            </SigCard>
          </div>

          <ResumoCard
            titulo="Módulos com acesso"
            valor={modulosLiberados}
            detalhe={`${modulosDisponiveis.length} módulos mapeados`}
            cor="text-cyan-400"
          />

          <ResumoCard
            titulo="Permissões ativas"
            valor={totalMarcadas}
            detalhe="Ver, criar, editar e excluir"
            cor="text-emerald-400"
          />
        </div>

        <SigCard>
          <div className="grid items-end gap-4 lg:grid-cols-4">
            <div>
              <label className="label">
                Município
              </label>

              <select
                className="input"
                value={
                  municipioSelecionado || ""
                }
                disabled={
                  carregando ||
                  !contexto ||
                  contexto.municipios.length <= 1
                }
                onChange={(event) => {
                  const novoMunicipio = Number(
                    event.target.value
                  );

                  setMunicipioSelecionado(
                    novoMunicipio
                  );

                  void carregarPermissoes(
                    novoMunicipio,
                    perfilSelecionado
                  );
                }}
              >
                {(contexto?.municipios || []).map(
                  (municipio) => (
                    <option
                      key={municipio.id}
                      value={municipio.id}
                    >
                      {municipio.nome}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="label">
                Perfil
              </label>

              <select
                className="input"
                value={perfilSelecionado}
                disabled={carregando || !contexto}
                onChange={(event) => {
                  const novoPerfil =
                    event.target.value as Perfil;

                  setPerfilSelecionado(
                    novoPerfil
                  );

                  void carregarPermissoes(
                    municipioSelecionado,
                    novoPerfil
                  );
                }}
              >
                {(contexto?.perfis || []).map(
                  (perfil) => (
                    <option
                      key={perfil}
                      value={perfil}
                    >
                      {perfil}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="label">
                Pesquisar módulo
              </label>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                <input
                  className="input pl-12"
                  placeholder="Ocorrência, patrulhamento, IA, relatórios..."
                  value={busca}
                  onChange={(event) =>
                    setBusca(event.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </SigCard>

        <div className="grid gap-4 md:grid-cols-4">
          {campos.map((item) => (
            <SigCard key={item.campo}>
              <div className="flex items-center gap-3">
                <div className={item.cor}>
                  {item.icone}
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">
                    {item.titulo}
                  </h3>

                  <p className="text-sm text-slate-400">
                    Permissão de{" "}
                    {item.titulo.toLowerCase()}.
                  </p>
                </div>
              </div>
            </SigCard>
          ))}
        </div>

        {carregando ? (
          <SigCard>
            <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
              <LoaderCircle
                className="animate-spin"
                size={22}
              />
              Carregando permissões...
            </div>
          </SigCard>
        ) : (
          <div className="space-y-5">
            {gruposFiltrados.map((grupo) => (
              <SigCard key={grupo.titulo}>
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white">
                      {grupo.titulo}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      {grupo.descricao}
                    </p>
                  </div>

                  <span className="rounded-full border border-slate-700 bg-slate-950/60 px-4 py-2 text-xs font-bold text-slate-300">
                    {grupo.modulos.length} módulo(s)
                  </span>
                </div>

                <div className="grid gap-3">
                  {grupo.modulos.map((modulo) => (
                    <div
                      key={modulo}
                      className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-cyan-500/40"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                          <p className="font-black text-cyan-300">
                            {nomeModulo(modulo)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            chave: {modulo}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          {campos.map((item) => {
                            const chave = `${modulo}-${item.campo}`;
                            const checked =
                              valorPermissao(
                                modulo,
                                item.campo
                              );

                            return (
                              <label
                                key={item.campo}
                                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
                              >
                                <span className="flex items-center gap-2 text-sm font-bold text-slate-300">
                                  <span
                                    className={
                                      item.cor
                                    }
                                  >
                                    {item.icone}
                                  </span>
                                  {item.titulo}
                                </span>

                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={
                                    salvandoChave !== ""
                                  }
                                  onChange={(event) =>
                                    void alterarPermissao(
                                      modulo,
                                      item.campo,
                                      event.target
                                        .checked
                                    )
                                  }
                                  className="h-5 w-5 accent-cyan-500"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SigCard>
            ))}
          </div>
        )}

        <SigCard>
          <div className="flex items-start gap-4">
            <CheckCircle className="h-8 w-8 shrink-0 text-emerald-400" />

            <div>
              <h3 className="text-lg font-black text-white">
                Salvamento automático com auditoria
              </h3>

              <p className="mt-1 text-slate-400">
                A API impede alteração de município
                indevido, perfil igual ou superior e
                permissões incoerentes.
              </p>
            </div>
          </div>
        </SigCard>
      </div>
    </ProtecaoModulo>
  );
}

function ResumoCard({
  titulo,
  valor,
  detalhe,
  cor,
}: {
  titulo: string;
  valor: number;
  detalhe: string;
  cor: string;
}) {
  return (
    <SigCard>
      <ShieldCheck
        className={`mb-3 h-8 w-8 ${cor}`}
      />
      <p className="text-sm text-slate-400">
        {titulo}
      </p>
      <h2
        className={`mt-1 text-4xl font-black ${cor}`}
      >
        {valor}
      </h2>
      <p className="mt-2 text-xs text-slate-500">
        {detalhe}
      </p>
    </SigCard>
  );
}
