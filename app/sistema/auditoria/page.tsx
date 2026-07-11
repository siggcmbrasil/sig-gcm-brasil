"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Eye,
  FileKey,
  Filter,
  KeyRound,
  Lock,
  LogIn,
  RefreshCcw,
  Search,
  Shield,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import ProtecaoModulo from "@/components/ProtecaoModulo";

type Municipio = {
  id: number;
  nome: string;
};

type RegistroAuditoria = {
  fonte:
    | "ACESSOS"
    | "AUDITORIA"
    | "CONSULTAS"
    | "PERMISSOES";
  registro_id: string;
  municipio_id: number;
  municipio_nome: string | null;
  usuario_id: string | null;
  usuario_nome: string;
  usuario_email: string | null;
  perfil: string | null;
  modulo: string;
  acao: string;
  descricao: string;
  status: string;
  ip: string | null;
  dispositivo: string | null;
  dados: Record<string, unknown> | null;
  criado_em: string | null;
};

type Filtros = {
  busca: string;
  fonte: string;
  modulo: string;
  acao: string;
  status: string;
  data_inicio: string;
  data_fim: string;
};

const FILTROS_INICIAIS: Filtros = {
  busca: "",
  fonte: "",
  modulo: "",
  acao: "",
  status: "",
  data_inicio: "",
  data_fim: "",
};

const FONTES = [
  {
    valor: "ACESSOS",
    titulo: "Acessos",
    icone: LogIn,
  },
  {
    valor: "AUDITORIA",
    titulo: "Auditoria",
    icone: Activity,
  },
  {
    valor: "CONSULTAS",
    titulo: "Consultas",
    icone: Search,
  },
  {
    valor: "PERMISSOES",
    titulo: "Permissões",
    icone: FileKey,
  },
] as const;

function formatarData(valor: string | null) {
  if (!valor) {
    return "-";
  }

  return new Date(valor).toLocaleString("pt-BR");
}

function escaparCsv(valor: unknown) {
  const texto =
    typeof valor === "string"
      ? valor
      : JSON.stringify(valor ?? "");

  return `"${texto.replace(/"/g, '""')}"`;
}

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState<
    RegistroAuditoria[]
  >([]);
  const [municipios, setMunicipios] = useState<
    Municipio[]
  >([]);
  const [
    municipioSelecionado,
    setMunicipioSelecionado,
  ] = useState<number | null>(null);
  const [perfil, setPerfil] = useState("");
  const [resumo, setResumo] = useState<
    Record<string, number>
  >({});
  const [filtros, setFiltros] =
    useState<Filtros>(FILTROS_INICIAIS);
  const [filtrosAplicados, setFiltrosAplicados] =
    useState<Filtros>(FILTROS_INICIAIS);
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] =
    useState(1);
  const [carregando, setCarregando] =
    useState(true);
  const [erro, setErro] = useState("");
  const [bloqueado, setBloqueado] =
    useState(false);
  const [detalhe, setDetalhe] =
    useState<RegistroAuditoria | null>(null);

  const acessoRegistradoRef = useRef(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        setBloqueado(true);
        setErro(
          "Sua sessão expirou. Entre novamente."
        );
        return;
      }

      const parametros = new URLSearchParams({
        pagina: String(pagina),
        limite: String(limite),
      });

      if (municipioSelecionado) {
        parametros.set(
          "municipio_id",
          String(municipioSelecionado)
        );
      }

      for (const [chave, valor] of Object.entries(
        filtrosAplicados
      )) {
        if (valor) {
          parametros.set(chave, valor);
        }
      }

      const resposta = await fetch(
        `/api/auditoria/central?${parametros.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const retorno = await resposta
        .json()
        .catch(() => null);

      if (!resposta.ok) {
        if (
          resposta.status === 401 ||
          resposta.status === 403
        ) {
          setBloqueado(true);
        }

        setErro(
          retorno?.erro ||
            "Não foi possível carregar a auditoria."
        );
        return;
      }

      setBloqueado(false);
      setRegistros(
        Array.isArray(retorno?.registros)
          ? retorno.registros
          : []
      );
      setResumo(retorno?.resumo || {});
      setTotal(Number(retorno?.total || 0));
      setTotalPaginas(
        Number(retorno?.total_paginas || 1)
      );
      setPerfil(String(retorno?.perfil || ""));

      if (Array.isArray(retorno?.municipios)) {
        setMunicipios(retorno.municipios);
      }

      const municipioRetornado = Number(
        retorno?.municipio_selecionado
      );

      if (
        municipioRetornado > 0 &&
        municipioRetornado !==
          municipioSelecionado
      ) {
        setMunicipioSelecionado(
          municipioRetornado
        );
      }
    } catch (error) {
      console.error(
        "Erro ao carregar a Central de Auditoria:",
        error
      );

      setErro(
        "Não foi possível carregar a Central de Auditoria."
      );
    } finally {
      setCarregando(false);
    }
  }, [
    filtrosAplicados,
    limite,
    municipioSelecionado,
    pagina,
  ]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (acessoRegistradoRef.current) {
      return;
    }

    acessoRegistradoRef.current = true;

    void registrarAuditoria({
      modulo: "Auditoria",
      acao: "ACESSO",
      descricao:
        "Acessou a Central de Auditoria unificada.",
      tabela: "central_auditoria_unificada",
    });
  }, []);

  const fonteSelecionada = useMemo(
    () =>
      FONTES.find(
        (item) =>
          item.valor === filtrosAplicados.fonte
      ),
    [filtrosAplicados.fonte]
  );

  function aplicarFiltros() {
    setPagina(1);
    setFiltrosAplicados({ ...filtros });
  }

  function limparFiltros() {
    setPagina(1);
    setFiltros(FILTROS_INICIAIS);
    setFiltrosAplicados(FILTROS_INICIAIS);
  }

  function exportarPagina() {
    if (registros.length === 0) {
      alert("Não há registros para exportar.");
      return;
    }

    const cabecalho = [
      "Fonte",
      "Município",
      "Usuário",
      "E-mail",
      "Perfil",
      "Módulo",
      "Ação",
      "Descrição",
      "Status",
      "IP",
      "Data",
    ];

    const linhas = registros.map((item) => [
      item.fonte,
      item.municipio_nome ||
        String(item.municipio_id),
      item.usuario_nome,
      item.usuario_email || "",
      item.perfil || "",
      item.modulo,
      item.acao,
      item.descricao,
      item.status,
      item.ip || "",
      formatarData(item.criado_em),
    ]);

    const csv = [
      cabecalho.map(escaparCsv).join(";"),
      ...linhas.map((linha) =>
        linha.map(escaparCsv).join(";")
      ),
    ].join("\n");

    const arquivo = new Blob(
      [`\uFEFF${csv}`],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");

    link.href = url;
    link.download = `auditoria-pagina-${pagina}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

if (bloqueado) {
  return (
    <ProtecaoModulo modulo="auditoria">
      <div className="p-4 md:p-6 pb-24 space-y-6">
        <SigPageHeader
          titulo="Acesso Restrito"
          subtitulo="Você não possui permissão para acessar a Central de Auditoria."
          icone={Lock}
        />

        <SigCard>
          <div className="py-14 text-center">
            <Lock className="mx-auto mb-4 h-16 w-16 text-red-400" />

            <h2 className="text-2xl font-black text-white">
              Acesso negado
            </h2>

            <p className="mt-2 text-slate-400">
              {erro ||
                "Apenas perfis autorizados podem visualizar a auditoria."}
            </p>
          </div>
        </SigCard>
            </div>
    </ProtecaoModulo>
  );
}

return (
  <ProtecaoModulo modulo="auditoria">
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Central de Auditoria"
        subtitulo="Acessos, ações, consultas e alterações de permissões em uma visão unificada."
        icone={Shield}
      />

      {erro ? (
        <SigCard>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {erro}
          </div>
        </SigCard>
      ) : null}

      {perfil === "DESENVOLVEDOR" &&
      municipios.length > 0 ? (
        <SigCard>
          <div className="max-w-xl">
            <label className="label">
              Município auditado
            </label>

            <select
              className="input"
              value={
                municipioSelecionado
                  ? String(municipioSelecionado)
                  : ""
              }
              onChange={(event) => {
                setPagina(1);
                setMunicipioSelecionado(
                  Number(event.target.value)
                );
              }}
            >
              {municipios.map((municipio) => (
                <option
                  key={municipio.id}
                  value={municipio.id}
                >
                  {municipio.nome}
                </option>
              ))}
            </select>
          </div>
        </SigCard>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <ResumoCard
          titulo="Total"
          valor={Number(resumo.TOTAL || 0)}
          icone={Database}
        />

        {FONTES.map((item) => (
          <ResumoCard
            key={item.valor}
            titulo={item.titulo}
            valor={Number(
              resumo[item.valor] || 0
            )}
            icone={item.icone}
          />
        ))}
      </div>

      <SigCard>
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-cyan-400" />

          <h2 className="text-xl font-black text-white">
            Filtros
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <label className="label">
              Pesquisa geral
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                className="input pl-10"
                placeholder="Usuário, e-mail, descrição, módulo, ação ou IP..."
                value={filtros.busca}
                maxLength={80}
                onChange={(event) =>
                  setFiltros((anterior) => ({
                    ...anterior,
                    busca: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    aplicarFiltros();
                  }
                }}
              />
            </div>
          </div>

          <div>
            <label className="label">Fonte</label>

            <select
              className="input"
              value={filtros.fonte}
              onChange={(event) =>
                setFiltros((anterior) => ({
                  ...anterior,
                  fonte: event.target.value,
                }))
              }
            >
              <option value="">
                Todas as fontes
              </option>

              {FONTES.map((item) => (
                <option
                  key={item.valor}
                  value={item.valor}
                >
                  {item.titulo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Status</label>

            <input
              className="input"
              placeholder="Ex: SUCESSO"
              value={filtros.status}
              maxLength={50}
              onChange={(event) =>
                setFiltros((anterior) => ({
                  ...anterior,
                  status: event.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="label">Módulo</label>

            <input
              className="input"
              placeholder="Ex: Ocorrências"
              value={filtros.modulo}
              maxLength={80}
              onChange={(event) =>
                setFiltros((anterior) => ({
                  ...anterior,
                  modulo: event.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="label">Ação</label>

            <input
              className="input"
              placeholder="Ex: CONSULTAR"
              value={filtros.acao}
              maxLength={80}
              onChange={(event) =>
                setFiltros((anterior) => ({
                  ...anterior,
                  acao: event.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="label">
              Data inicial
            </label>

            <input
              type="date"
              className="input"
              value={filtros.data_inicio}
              onChange={(event) =>
                setFiltros((anterior) => ({
                  ...anterior,
                  data_inicio:
                    event.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="label">
              Data final
            </label>

            <input
              type="date"
              className="input"
              value={filtros.data_fim}
              onChange={(event) =>
                setFiltros((anterior) => ({
                  ...anterior,
                  data_fim: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={aplicarFiltros}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Aplicar filtros
          </button>

          <button
            type="button"
            onClick={limparFiltros}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 font-bold text-slate-200 transition hover:border-cyan-500/50"
          >
            <X className="h-4 w-4" />
            Limpar
          </button>

          <button
            type="button"
            onClick={() => void carregar()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 font-bold text-slate-200 transition hover:border-cyan-500/50"
          >
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </button>

          <button
            type="button"
            onClick={exportarPagina}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 font-bold text-slate-200 transition hover:border-cyan-500/50"
          >
            <Download className="h-4 w-4" />
            Exportar página
          </button>
        </div>
      </SigCard>

      <SigCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white">
              Registros
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {total} registro(s) encontrado(s)
              {fonteSelecionada
                ? ` em ${fonteSelecionada.titulo}`
                : ""}
              .
            </p>
          </div>

          <select
            className="input w-auto min-w-28"
            value={limite}
            onChange={(event) => {
              setPagina(1);
              setLimite(
                Number(event.target.value)
              );
            }}
          >
            <option value={10}>10 por página</option>
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>
              100 por página
            </option>
          </select>
        </div>

        {carregando ? (
          <div className="py-14 text-center text-slate-400">
            Carregando registros...
          </div>
        ) : registros.length === 0 ? (
          <div className="py-14 text-center">
            <Shield className="mx-auto mb-4 h-14 w-14 text-slate-600" />

            <h3 className="text-xl font-black text-white">
              Nenhum registro encontrado
            </h3>

            <p className="mt-2 text-slate-500">
              Ajuste os filtros e tente novamente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {registros.map((item) => (
              <article
                key={`${item.fonte}-${item.registro_id}`}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-cyan-500/30"
              >
                <div className="flex flex-col justify-between gap-4 xl:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Badge
                        texto={item.fonte}
                        tipo="fonte"
                      />

                      <Badge
                        texto={item.acao}
                        tipo="acao"
                      />

                      <Badge
                        texto={item.status}
                        tipo={
                          item.status === "ERRO"
                            ? "erro"
                            : "status"
                        }
                      />

                      {item.perfil ? (
                        <Badge
                          texto={item.perfil}
                          tipo="perfil"
                        />
                      ) : null}
                    </div>

                    <h3 className="font-black text-white">
                      {item.usuario_nome}
                    </h3>

                    <p className="mt-1 text-sm text-cyan-300">
                      {item.modulo}
                    </p>

                    <p className="mt-3 leading-relaxed text-slate-300">
                      {item.descricao}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                      <span>
                        Data:{" "}
                        {formatarData(
                          item.criado_em
                        )}
                      </span>

                      <span>
                        IP:{" "}
                        {item.ip ||
                          "Não informado"}
                      </span>

                      {item.usuario_email ? (
                        <span>
                          E-mail:{" "}
                          {item.usuario_email}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDetalhe(item)
                    }
                    className="inline-flex h-fit items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-black text-cyan-300 transition hover:bg-cyan-500/20"
                  >
                    <Eye className="h-4 w-4" />
                    Detalhes
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5">
          <p className="text-sm text-slate-500">
            Página {pagina} de {totalPaginas}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={
                carregando || pagina <= 1
              }
              onClick={() =>
                setPagina((valor) =>
                  Math.max(1, valor - 1)
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 font-bold text-slate-200 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            <button
              type="button"
              disabled={
                carregando ||
                pagina >= totalPaginas
              }
              onClick={() =>
                setPagina((valor) =>
                  Math.min(
                    totalPaginas,
                    valor + 1
                  )
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 font-bold text-slate-200 disabled:opacity-40"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SigCard>

      {detalhe ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setDetalhe(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-cyan-500/30 bg-slate-950 p-5 shadow-2xl md:p-7"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge
                    texto={detalhe.fonte}
                    tipo="fonte"
                  />

                  <Badge
                    texto={detalhe.status}
                    tipo={
                      detalhe.status === "ERRO"
                        ? "erro"
                        : "status"
                    }
                  />
                </div>

                <h2 className="text-2xl font-black text-white">
                  Detalhes da auditoria
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setDetalhe(null)}
                className="rounded-xl border border-slate-700 p-2 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Info
                titulo="Usuário"
                valor={detalhe.usuario_nome}
              />

              <Info
                titulo="Perfil"
                valor={
                  detalhe.perfil ||
                  "Não informado"
                }
              />

              <Info
                titulo="Módulo"
                valor={detalhe.modulo}
              />

              <Info
                titulo="Ação"
                valor={detalhe.acao}
              />

              <Info
                titulo="Município"
                valor={
                  detalhe.municipio_nome ||
                  String(
                    detalhe.municipio_id
                  )
                }
              />

              <Info
                titulo="IP"
                valor={
                  detalhe.ip ||
                  "Não informado"
                }
              />

              <Info
                titulo="Data"
                valor={formatarData(
                  detalhe.criado_em
                )}
              />

              <Info
                titulo="Registro"
                valor={detalhe.registro_id}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Descrição
              </p>

              <p className="mt-2 text-slate-200">
                {detalhe.descricao}
              </p>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
                Dados técnicos
              </p>

              <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-black/40 p-4 text-xs leading-relaxed text-cyan-200">
                {JSON.stringify(
                  {
                    email:
                      detalhe.usuario_email,
                    dispositivo:
                      detalhe.dispositivo,
                    dados: detalhe.dados,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
        </div>
  </ProtecaoModulo>
  );
}

function ResumoCard({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: number;
  icone: typeof KeyRound;
}) {
  return (
    <div className="min-h-[112px] rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">
            {titulo}
          </p>

          <h2 className="mt-1 text-3xl font-black text-white">
            {valor}
          </h2>
        </div>

        <Icone className="h-7 w-7 text-cyan-400" />
      </div>
    </div>
  );
}

function Badge({
  texto,
  tipo,
}: {
  texto: string;
  tipo:
    | "fonte"
    | "acao"
    | "status"
    | "erro"
    | "perfil";
}) {
  const estilos = {
    fonte:
      "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    acao:
      "border-blue-500/30 bg-blue-500/10 text-blue-300",
    status:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    erro:
      "border-red-500/30 bg-red-500/10 text-red-300",
    perfil:
      "border-violet-500/30 bg-violet-500/10 text-violet-300",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black ${estilos[tipo]}`}
    >
      {texto}
    </span>
  );
}

function Info({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {titulo}
      </p>

      <p className="mt-2 break-words font-bold text-white">
        {valor}
      </p>
    </div>
  );
}
