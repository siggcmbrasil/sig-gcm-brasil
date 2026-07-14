"use client";

import Link from "next/link";
import {
  Bell,
  ClipboardCheck,
  Landmark,
  MapPin,
  RefreshCw,
  Settings,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigActionCard from "@/components/sig/SigActionCard";
import SigButton from "@/components/sig/SigButton";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigStatCard from "@/components/sig/SigStatCard";

import { registrarAuditoria } from "@/lib/auditoria";
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

type UsuarioSistema = {
  id: number;
  nome: string | null;
  perfil: string | null;
  status: string | null;
};

type Guarda = {
  id: number;
  nome: string;
  ativo: boolean | null;
  status: string | null;
};

type Aviso = {
  id: number;
  titulo: string;
};

type Notificacao = {
  id: number;
  lida: boolean | null;
};

type LogAcesso = {
  id: number;
  acao: string | null;
  status: string | null;
  criado_em: string | null;
};

const cards = [
  {
    titulo: "Usuários do Município",
    icone: UserCog,
    href: "/sistema/usuarios",
    descricao: "Aprovação, perfis, status e controle dos usuários locais.",
    detalhe: "Gerenciar usuários",
  },
  {
    titulo: "Guardas",
    icone: UsersRound,
    href: "/sistema/guardas",
    descricao: "Cadastro, situação funcional e gestão do efetivo municipal.",
    detalhe: "Gerenciar guardas",
  },
  {
    titulo: "Locais",
    icone: MapPin,
    href: "/sistema/locais",
    descricao: "Ruas, bairros, escolas, órgãos e pontos estratégicos.",
    detalhe: "Gerenciar locais",
  },
  {
    titulo: "Dados Institucionais",
    icone: Landmark,
    href: "/sistema/administracao/institucional",
    descricao: "Brasões, comandante e informações oficiais da Guarda.",
    detalhe: "Abrir dados oficiais",
  },
  {
    titulo: "Avisos",
    icone: Bell,
    href: "/sistema/avisos",
    descricao: "Comunicados internos e orientações institucionais.",
    detalhe: "Gerenciar avisos",
  },
  {
    titulo: "Notificações",
    icone: Bell,
    href: "/sistema/notificacoes",
    descricao: "Alertas operacionais e notificações do município.",
    detalhe: "Abrir notificações",
  },
  {
    titulo: "Permissões",
    icone: ShieldCheck,
    href: "/sistema/usuarios/permissoes",
    descricao: "Controle de acesso por perfil e por módulo.",
    detalhe: "Gerenciar permissões",
    perfis: ["ADMIN", "DESENVOLVEDOR"],
  },
  {
    titulo: "Auditoria / Logs",
    icone: ClipboardCheck,
    href: "/sistema/administracao/auditoria",
    descricao: "Histórico de ações realizadas pelos usuários.",
    detalhe: "Abrir auditoria",
    perfis: ["ADMIN", "COMANDANTE", "DESENVOLVEDOR"],
  },
  {
    titulo: "Configurações do Município",
    icone: Settings,
    href: "/sistema/configuracoes",
    descricao: "Parâmetros locais, identidade visual e preferências.",
    detalhe: "Abrir configurações",
    perfis: ["ADMIN", "COMANDANTE", "DESENVOLVEDOR"],
  },
];

function obterUsuarioLocal(): UsuarioLocal | null {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "null"
    ) as UsuarioLocal | null;
  } catch {
    return null;
  }
}

function normalizar(valor: unknown) {
  return String(valor || "").trim().toUpperCase();
}

export default function AdministracaoPage() {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [logs, setLogs] = useState<LogAcesso[]>([]);
  const [municipioNome, setMunicipioNome] = useState("Município");
  const [perfil, setPerfil] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const usuario = obterUsuarioLocal();

      if (!usuario?.perfil) {
        throw new Error("Usuário não identificado.");
      }

      const contexto = lerMunicipioContextoLocal();

      const municipioId = obterMunicipioIdEfetivo({
        perfil: usuario.perfil,
        municipioIdUsuario: usuario.municipio_id,
      });

      if (!municipioId) {
        throw new Error("Município não identificado.");
      }

      const [
        municipioResposta,
        usuariosResposta,
        guardasResposta,
        avisosResposta,
        notificacoesResposta,
        logsResposta,
      ] = await Promise.all([
        supabase
          .from("municipios")
          .select("nome")
          .eq("id", municipioId)
          .maybeSingle(),

        supabase
          .from("usuarios")
          .select("id,nome,perfil,status")
          .eq("municipio_id", municipioId)
          .order("nome"),

        supabase
          .from("guardas")
          .select("id,nome,ativo,status")
          .eq("municipio_id", municipioId)
          .order("nome"),

        supabase
          .from("avisos")
          .select("id,titulo")
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false })
          .limit(20),

        supabase
          .from("notificacoes")
          .select("id,lida")
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false })
          .limit(50),

        supabase
          .from("logs_acesso")
          .select("id,acao,status,criado_em")
          .eq("municipio_id", municipioId)
          .order("criado_em", { ascending: false })
          .limit(20),
      ]);

      const falhas = [
        usuariosResposta.error,
        guardasResposta.error,
        avisosResposta.error,
        notificacoesResposta.error,
        logsResposta.error,
      ].filter(Boolean);

      for (const falha of falhas) {
        console.warn("Falha parcial na Administração:", falha?.message);
      }

      setPerfil(normalizar(usuario.perfil));
      setMunicipioNome(
        String(
          municipioResposta.data?.nome ||
            contexto?.nome ||
            "Município"
        )
      );
      setUsuarios(
        (usuariosResposta.data as UsuarioSistema[] | null) || []
      );
      setGuardas(
        (guardasResposta.data as Guarda[] | null) || []
      );
      setAvisos(
        (avisosResposta.data as Aviso[] | null) || []
      );
      setNotificacoes(
        (notificacoesResposta.data as Notificacao[] | null) || []
      );
      setLogs(
        (logsResposta.data as LogAcesso[] | null) || []
      );

      await registrarAuditoria({
        modulo: "Administração",
        acao: "ACESSO",
        descricao: "Acessou a Administração da Guarda.",
      });
    } catch (error) {
      console.error("Erro ao carregar Administração:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Administração."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const metricas = useMemo(() => {
    const usuariosAtivos = usuarios.filter(
      (item) => normalizar(item.status) === "ATIVO"
    ).length;

    const usuariosPendentes = usuarios.filter(
      (item) => normalizar(item.status) === "PENDENTE"
    ).length;

    const guardasAtivos = guardas.filter((item) => {
      const status = normalizar(item.status);
      return item.ativo !== false && status !== "INATIVO";
    }).length;

    const notificacoesNaoLidas = notificacoes.filter(
      (item) => item.lida !== true
    ).length;

    return {
      usuarios: usuarios.length,
      usuariosAtivos,
      usuariosPendentes,
      guardasAtivos,
      avisos: avisos.length,
      notificacoesNaoLidas,
      logs: logs.length,
    };
  }, [usuarios, guardas, avisos, notificacoes, logs]);

  const cardsFiltrados = useMemo(
    () =>
      cards.filter(
        (card) =>
          !card.perfis ||
          card.perfis.includes(perfil)
      ),
    [perfil]
  );

  return (
    <ProtecaoModulo modulo="administracao">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Administração da Guarda"
            subtitulo={`${municipioNome} • Usuários, permissões, auditoria, avisos, dados institucionais e configurações.`}
            detalhe="Gestão local"
            icone={ShieldCheck}
            acoes={
              <SigButton
                type="cyan"
                icon={RefreshCw}
                size="sm"
                loading={carregando}
                onClick={() => void carregar()}
              >
                Atualizar
              </SigButton>
            }
          />

          {erro ? <div className="sig-error">{erro}</div> : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
            <SigStatCard
              titulo="Usuários"
              valor={metricas.usuarios}
              subtitulo={`${metricas.usuariosAtivos} ativos`}
              icone={UserCog}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Pendentes"
              valor={metricas.usuariosPendentes}
              subtitulo="Aguardando aprovação"
              icone={UsersRound}
              destaque="amber"
            />

            <SigStatCard
              titulo="Guardas ativos"
              valor={metricas.guardasAtivos}
              subtitulo="Efetivo disponível"
              icone={UsersRound}
              destaque="green"
            />

            <SigStatCard
              titulo="Avisos"
              valor={metricas.avisos}
              subtitulo="Comunicados recentes"
              icone={Bell}
              destaque="blue"
            />

            <SigStatCard
              titulo="Não lidas"
              valor={metricas.notificacoesNaoLidas}
              subtitulo="Notificações pendentes"
              icone={Bell}
              destaque="red"
            />

            <SigStatCard
              titulo="Logs recentes"
              valor={metricas.logs}
              subtitulo="Atividades carregadas"
              icone={ClipboardCheck}
              destaque="slate"
            />

            <SigStatCard
              titulo="Perfil atual"
              valor={perfil || "-"}
              subtitulo="Nível administrativo"
              icone={ShieldCheck}
              destaque="cyan"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                <p className="mt-4 text-slate-400">
                  Carregando dados administrativos...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Situação administrativa"
                    subtitulo="Resumo dos principais controles do município"
                    icone={Settings}
                  />

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <PainelResumo
                      titulo="Usuários ativos"
                      valor={metricas.usuariosAtivos}
                    />
                    <PainelResumo
                      titulo="Usuários pendentes"
                      valor={metricas.usuariosPendentes}
                    />
                    <PainelResumo
                      titulo="Guardas ativos"
                      valor={metricas.guardasAtivos}
                    />
                    <PainelResumo
                      titulo="Notificações não lidas"
                      valor={metricas.notificacoesNaoLidas}
                    />
                  </div>
                </SigCard>

                <SigCard className="xl:col-span-5">
                  <CabecalhoSecao
                    titulo="Atividade recente"
                    subtitulo="Últimos registros de acesso"
                    icone={ClipboardCheck}
                  />

                  <div className="mt-5 space-y-3">
                    {logs.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        Nenhum log recente encontrado.
                      </p>
                    ) : (
                      logs.slice(0, 6).map((log) => (
                        <div
                          key={log.id}
                          className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-black text-white">
                              {log.acao || "Ação registrada"}
                            </p>

                            <span className="text-[10px] font-black uppercase text-cyan-300">
                              {log.status || "REGISTRADO"}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {log.criado_em
                              ? new Date(log.criado_em).toLocaleString(
                                  "pt-BR"
                                )
                              : "Data não informada"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Ferramentas Administrativas
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Acesse os recursos disponíveis para o seu perfil.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {cardsFiltrados.map((card) => (
                    <SigActionCard
                      key={card.href}
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
  icone: typeof ShieldCheck;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300">
        <Icone className="h-5 w-5" />
      </div>

      <div>
        <h2 className="font-black text-white">{titulo}</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {subtitulo}
        </p>
      </div>
    </div>
  );
}

function PainelResumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
      <p className="text-sm text-slate-400">{titulo}</p>
      <p className="mt-2 text-3xl font-black text-white">
        {valor}
      </p>
    </div>
  );
}
