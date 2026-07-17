"use client";

import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  Clock3,
  FileText,
  HeartPulse,
  Medal,
  RefreshCw,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigActionCard from "@/components/sig/SigActionCard";
import SigButton from "@/components/sig/SigButton";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigStatCard from "@/components/sig/SigStatCard";
import {
  lerMunicipioContextoLocal,
  obterMunicipioIdEfetivo,
} from "@/lib/contextoMunicipio";
import { supabase } from "@/lib/supabase";

type UsuarioLocal = {
  id?: string | number;
  perfil?: string;
  municipio_id?: number;
};

type Guarda = {
  id: number;
  nome: string;
  status: string | null;
  ativo: boolean | null;
  data_nascimento: string | null;
};

type EscalaServico = {
  id: number;
  guarda_nome: string | null;
  equipe: string | null;
  funcao: string | null;
};

type RegistroStatus = {
  id: number;
  status?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
};

type DadosRH = {
  guardas: Guarda[];
  escalaHoje: EscalaServico[];
  atestados: RegistroStatus[];
  feriasLicencas: RegistroStatus[];
  permutas: RegistroStatus[];
};

const inicial: DadosRH = {
  guardas: [],
  escalaHoje: [],
  atestados: [],
  feriasLicencas: [],
  permutas: [],
};

const cards = [
  { titulo: "Novo Guarda", icone: UserPlus, href: "/sistema/guardas/novo", descricao: "Cadastro de novo guarda municipal.", detalhe: "Cadastrar servidor" },
  { titulo: "Guardas", icone: Users, href: "/sistema/guardas", descricao: "Lista, consulta e gestão completa do efetivo.", detalhe: "Gerenciar efetivo" },
  { titulo: "Escalas", icone: CalendarDays, href: "/sistema/escalas", descricao: "Escalas de serviço, modelos e configurações.", detalhe: "Abrir escalas" },
  { titulo: "Guarnições", icone: ShieldCheck, href: "/sistema/escalas/guarnicoes", descricao: "Gestão das equipes e guarnições de serviço.", detalhe: "Gerenciar equipes" },
  { titulo: "Gestão Funcional", icone: Medal, href: "/sistema/central-rh/gestao-funcional", descricao: "Elogios, advertências, cursos, avaliações e condecorações.", detalhe: "Abrir gestão funcional" },
  { titulo: "Registro de Ponto", icone: Clock3, href: "/sistema/registro-ponto", descricao: "Controle de frequência e ponto funcional.", detalhe: "Abrir frequência" },
  { titulo: "Banco de Horas", icone: Clock3, href: "/sistema/banco-horas", descricao: "Controle de saldo, extras e compensações.", detalhe: "Consultar saldos" },
  { titulo: "Atestados", icone: HeartPulse, href: "/sistema/atestados", descricao: "Registro e acompanhamento de atestados médicos.", detalhe: "Gerenciar atestados" },
  { titulo: "Férias e Licenças", icone: CalendarDays, href: "/sistema/ferias-licencas", descricao: "Controle de férias, licenças e afastamentos.", detalhe: "Gerenciar afastamentos" },
  { titulo: "Documentos do Guarda", icone: FileText, href: "/sistema/central-rh/documentos", descricao: "CNH, RG, certificados e documentos funcionais.", detalhe: "Abrir documentos" },
  { titulo: "Datas Institucionais", icone: CalendarDays, href: "/sistema/central-rh/datas", descricao: "Aniversários, campanhas e datas comemorativas.", detalhe: "Ver calendário" },
  { titulo: "Estatísticas de RH", icone: BarChart3, href: "/sistema/central-rh/estatisticas", descricao: "Indicadores do efetivo, férias, licenças e banco de horas.", detalhe: "Abrir indicadores" },
];

function dataBahia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizar(valor: unknown) {
  return String(valor || "").trim().toUpperCase().replace(/\s+/g, "_");
}

function usuarioLocal(): UsuarioLocal | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "null");
  } catch {
    return null;
  }
}

export default function CentralRHPage() {
  const [dados, setDados] = useState<DadosRH>(inicial);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [municipioNome, setMunicipioNome] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const usuario = usuarioLocal();
      if (!usuario?.perfil) throw new Error("Usuário não identificado.");

      const contexto = lerMunicipioContextoLocal();
      const municipioId = obterMunicipioIdEfetivo({
        perfil: usuario.perfil,
        municipioIdUsuario: usuario.municipio_id,
      });

      if (!municipioId) throw new Error("Município não identificado.");

      const hoje = dataBahia();

      const [
        municipioResposta,
        guardasResposta,
        escalaResposta,
        atestadosResposta,
        feriasResposta,
        permutasResposta,
      ] = await Promise.all([
        supabase.from("municipios").select("nome").eq("id", municipioId).maybeSingle(),
        supabase.from("guardas").select("id,nome,status,ativo,data_nascimento").eq("municipio_id", municipioId).order("nome"),
        supabase.from("escalas_servico").select("id,guarda_nome,equipe,funcao").eq("municipio_id", municipioId).eq("data_servico", hoje).order("equipe").order("guarda_nome"),
       supabase.from("atestados").select("id,data_inicio,data_fim").eq("municipio_id", municipioId).order("id", { ascending: false }).limit(100),
        supabase.from("ferias_licencas").select("id,status,data_inicio,data_fim").eq("municipio_id", municipioId).order("id", { ascending: false }).limit(100),
        supabase.from("permutas_plantao").select("id,status").eq("municipio_id", municipioId).order("id", { ascending: false }).limit(100),
      ]);

const falhas = [
  {
    origem: "guardas",
    erro: guardasResposta.error,
  },
  {
    origem: "escalas_servico",
    erro: escalaResposta.error,
  },
  {
    origem: "atestados",
    erro: atestadosResposta.error,
  },
  {
    origem: "ferias_licencas",
    erro: feriasResposta.error,
  },
  {
    origem: "permutas_plantao",
    erro: permutasResposta.error,
  },
].filter(
  (
    item
  ): item is {
    origem: string;
    erro: NonNullable<typeof guardasResposta.error>;
  } => Boolean(item.erro)
);

if (falhas.length > 0) {
  for (const falha of falhas) {
    console.warn(
      `Falha parcial em ${falha.origem}:`,
      {
        message: falha.erro.message,
        details: falha.erro.details,
        hint: falha.erro.hint,
        code: falha.erro.code,
      }
    );
  }
}

      setMunicipioNome(
        String(municipioResposta.data?.nome || contexto?.nome || "Município")
      );

      setDados({
        guardas: (guardasResposta.data as Guarda[] | null) || [],
        escalaHoje: (escalaResposta.data as EscalaServico[] | null) || [],
        atestados: (atestadosResposta.data as RegistroStatus[] | null) || [],
        feriasLicencas: (feriasResposta.data as RegistroStatus[] | null) || [],
        permutas: (permutasResposta.data as RegistroStatus[] | null) || [],
      });
    } catch (error) {
      console.error("Erro ao carregar Central de RH:", error);
      setErro(error instanceof Error ? error.message : "Não foi possível carregar a Central de RH.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const hoje = dataBahia();

  const metricas = useMemo(() => {
    const ativos = dados.guardas.filter((guarda) => {
      const status = normalizar(guarda.status);
      return guarda.ativo !== false && !["INATIVO", "DESLIGADO", "EXONERADO"].includes(status);
    }).length;

    const afastados = dados.feriasLicencas.filter((item) => {
      const status = normalizar(item.status);
      return ["ATIVO", "EM_ANDAMENTO", "APROVADO", "APROVADA"].includes(status) &&
        (!item.data_inicio || item.data_inicio <= hoje) &&
        (!item.data_fim || item.data_fim >= hoje);
    }).length;

const atestadosAtivos = dados.atestados.filter((item) => {
  return (
    (!item.data_inicio || item.data_inicio <= hoje) &&
    (!item.data_fim || item.data_fim >= hoje)
  );
}).length;

    const permutasPendentes = dados.permutas.filter((item) =>
      ["AGUARDANDO_SUBSTITUTO", "ACEITA_PELO_SUBSTITUTO"].includes(normalizar(item.status))
    ).length;

    const equipes = new Set(
      dados.escalaHoje.map((item) => item.equipe?.trim()).filter((item): item is string => Boolean(item))
    );

    return {
      total: dados.guardas.length,
      ativos,
      escaladosHoje: dados.escalaHoje.length,
      equipesHoje: equipes.size,
      afastados,
      atestadosAtivos,
      permutasPendentes,
    };
  }, [dados, hoje]);

  const aniversariantes = useMemo(() => {
    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, "0");
    const mes = String(agora.getMonth() + 1).padStart(2, "0");

    return dados.guardas.filter((guarda) => {
      if (!guarda.data_nascimento) return false;
      const [, m, d] = guarda.data_nascimento.split("-");
      return d === dia && m === mes;
    });
  }, [dados.guardas]);

  const equipesHoje = useMemo(() => {
    const grupos = new Map<string, EscalaServico[]>();

    for (const item of dados.escalaHoje) {
      const equipe = item.equipe?.trim() || "Equipe não informada";
      const lista = grupos.get(equipe) || [];
      lista.push(item);
      grupos.set(equipe, lista);
    }

    return Array.from(grupos.entries());
  }, [dados.escalaHoje]);

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central de Recursos Humanos"
            subtitulo={`${municipioNome} • Gestão do efetivo, escalas, frequência, afastamentos, documentos e vida funcional.`}
            detalhe="Gestão de pessoas"
            icone={UserCog}
            acoes={
              <>
                <Link href="/sistema/guardas/novo">
                  <SigButton type="primary" icon={UserPlus} size="sm">
                    Novo guarda
                  </SigButton>
                </Link>

                <SigButton
                  type="cyan"
                  icon={RefreshCw}
                  size="sm"
                  loading={carregando}
                  onClick={() => void carregar()}
                >
                  Atualizar
                </SigButton>
              </>
            }
          />

          {erro ? <div className="sig-error">{erro}</div> : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
            <SigStatCard titulo="Efetivo total" valor={metricas.total} subtitulo={`${metricas.ativos} ativos`} icone={Users} destaque="cyan" />
            <SigStatCard titulo="Em serviço hoje" valor={metricas.escaladosHoje} subtitulo={`${metricas.equipesHoje} equipes`} icone={ShieldCheck} destaque="green" />
            <SigStatCard titulo="Férias e licenças" valor={metricas.afastados} subtitulo="Afastamentos vigentes" icone={CalendarDays} destaque="amber" />
            <SigStatCard titulo="Atestados ativos" valor={metricas.atestadosAtivos} subtitulo="Em acompanhamento" icone={HeartPulse} destaque="red" />
            <SigStatCard titulo="Permutas pendentes" valor={metricas.permutasPendentes} subtitulo="Dependem de ação" icone={Clock3} destaque="blue" />
            <SigStatCard titulo="Aniversariantes hoje" valor={aniversariantes.length} subtitulo="Datas institucionais" icone={CalendarDays} destaque="slate" />
            <SigStatCard titulo="Efetivo disponível" valor={Math.max(metricas.ativos - metricas.afastados, 0)} subtitulo="Base ativa estimada" icone={BarChart3} destaque="cyan" />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                <p className="mt-4 text-slate-400">Carregando informações do RH...</p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Efetivo em serviço"
                    subtitulo="Equipes identificadas pela escala operacional de hoje"
                    icone={ShieldCheck}
                  />

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {equipesHoje.length === 0 ? (
                      <div className="col-span-full rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
                        Nenhuma equipe escalada para hoje.
                      </div>
                    ) : (
                      equipesHoje.map(([equipe, membros]) => (
                        <article key={equipe} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-black text-cyan-300">{equipe}</h3>
                            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black text-emerald-300">
                              EM SERVIÇO
                            </span>
                          </div>

                          <div className="mt-4 space-y-2">
                            {membros.map((membro) => (
                              <div key={membro.id} className="flex items-center justify-between gap-3 text-sm">
                                <span className="truncate text-slate-300">
                                  {membro.guarda_nome || "Guarda não identificado"}
                                </span>
                                <span className="shrink-0 text-xs text-slate-500">
                                  {membro.funcao || "Sem função"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </SigCard>

                <div className="space-y-4 xl:col-span-5">
                  <SigCard>
                    <CabecalhoSecao
                      titulo="Alertas do RH"
                      subtitulo="Situações que merecem acompanhamento"
                      icone={HeartPulse}
                    />

                    <div className="mt-5 space-y-3">
                      <AlertaRH titulo="Atestados em andamento" detalhe={`${metricas.atestadosAtivos} registro(s) ativo(s)`} destaque={metricas.atestadosAtivos > 0} />
                      <AlertaRH titulo="Férias e licenças vigentes" detalhe={`${metricas.afastados} afastamento(s)`} destaque={metricas.afastados > 0} />
                      <AlertaRH titulo="Permutas pendentes" detalhe={`${metricas.permutasPendentes} solicitação(ões)`} destaque={metricas.permutasPendentes > 0} />
                    </div>
                  </SigCard>

                  <SigCard destaque>
                    <CabecalhoSecao
                      titulo="Aniversariantes de hoje"
                      subtitulo="Reconhecimento institucional"
                      icone={CalendarDays}
                    />

                    <div className="mt-5 space-y-3">
                      {aniversariantes.length === 0 ? (
                        <p className="text-sm text-slate-500">Nenhum aniversariante hoje.</p>
                      ) : (
                        aniversariantes.map((guarda) => (
                          <div key={guarda.id} className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] p-4">
                            <p className="font-black text-white">{guarda.nome}</p>
                            <p className="mt-1 text-sm text-slate-400">Integrante do efetivo municipal</p>
                          </div>
                        ))
                      )}
                    </div>
                  </SigCard>
                </div>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">Módulos de Recursos Humanos</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Acesse as ferramentas de gestão funcional e administrativa.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {cards.map((card) => (
                    <SigActionCard
                      key={`${card.href}-${card.titulo}`}
                      titulo={card.titulo}
                      descricao={card.descricao}
                      href={card.href}
                      icone={card.icone}
                      detalhe={card.detalhe}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function CabecalhoSecao({
  titulo,
  subtitulo,
  icone: Icone,
}: {
  titulo: string;
  subtitulo: string;
  icone: typeof UserCog;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300">
        <Icone className="h-5 w-5" />
      </div>

      <div>
        <h2 className="font-black text-white">{titulo}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{subtitulo}</p>
      </div>
    </div>
  );
}

function AlertaRH({
  titulo,
  detalhe,
  destaque,
}: {
  titulo: string;
  detalhe: string;
  destaque: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${
      destaque
        ? "border-amber-400/20 bg-amber-400/[0.05]"
        : "border-slate-800 bg-slate-950/35"
    }`}>
      <p className={`font-black ${destaque ? "text-amber-200" : "text-white"}`}>
        {titulo}
      </p>
      <p className="mt-1 text-sm text-slate-400">{detalhe}</p>
    </div>
  );
}