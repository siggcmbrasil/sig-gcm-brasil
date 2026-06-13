"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";

const MapaOperacional = dynamic(
  () => import("@/components/MapaOperacional"),
  { ssr: false }
);

type Municipio = {
  id: number;
  nome: string;
  estado: string;
  brasao: string | null;
  cor_principal: string | null;
  ativo: boolean;
};

type Ocorrencia = {
  id: number;
  protocolo: string;
  tipo: string;
  local: string;
  bairro: string | null;
  data: string;
  hora: string;
  status: string;
};

type Guarda = {
  id: number;
  nome: string;
  status: string;
  data_nascimento: string | null;
  foto_url: string | null;
};

type Viatura = {
  id: number;
  prefixo: string;
  modelo: string;
  placa: string;
  status: string;
  combustivel: string | null;
  quilometragem: string | null;
};

type Aviso = {
  id: number;
  titulo: string;
  descricao: string;
};

type Permuta = {
  id: number;
  status: string;
};

type Guarnicao = {
  id: number;
  nome: string;
  comandante_id: number | null;
  viatura_id: number | null;
  ativa: boolean;
};

type MembroGuarnicao = {
  id: number;
  guarnicao_id: number;
  guarda_id: number;
};

type EscalaHoje = {
  id: number;
  data_servico: string;
  guarda_nome: string;
  matricula: string;
  tipo: string;
  turno: string;
  equipe: string;
};

type ConfigEscalaOperacional = {
  id: number;
  municipio_id: number;
  modelo_escala_id: number;
  data_base: string;
  guarnicao_base_id: number;
  ordem_guarnicoes: number[];
  ativo: boolean;
};

type Atividade = {
  titulo: string;
  detalhe: string;
  hora: string;
  icone: string;
  cor: string;
};

export default function Dashboard() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [viatura, setViatura] = useState<Viatura | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [permutas, setPermutas] = useState<Permuta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [guarnicoes, setGuarnicoes] = useState<Guarnicao[]>([]);
  const [membrosGuarnicao, setMembrosGuarnicao] = useState<MembroGuarnicao[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [escalaHoje, setEscalaHoje] = useState<EscalaHoje[]>([]);
  const [municipioAtivo, setMunicipioAtivo] = useState<Municipio | null>(null);
  const [modeloEscalaAtivo, setModeloEscalaAtivo] = useState<string>("");
  const [configEscala, setConfigEscala] = useState<ConfigEscalaOperacional | null>(null);
 
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [mostrarMensagens, setMostrarMensagens] = useState(false);
  
  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";
  const ehDesenvolvedor = perfilUsuario === "DESENVOLVEDOR";
  const ehAdmin = perfilUsuario === "ADMIN";
  const ehComandante = perfilUsuario === "COMANDANTE";
  const ehDiretor = perfilUsuario === "DIRETOR";
  const ehPlantonista = perfilUsuario === "PLANTONISTA";
  const ehConsulta = perfilUsuario === "CONSULTA";
  const ehCmtGuarnicao = perfilUsuario === "CMT_GUARNICAO";
  const podeOperar = perfilUsuario !== "CONSULTA";

  async function carregarDashboard() {
    setCarregando(true);

    const { data: configData } = await supabase
      .from("configuracoes_sistema")
      .select("municipio_padrao_id")
      .order("id", { ascending: true })
      .limit(1)
      .single();

    const municipioId = configData?.municipio_padrao_id || 1;

    const { data: municipioData } = await supabase
      .from("municipios")
      .select("*")
      .eq("id", municipioId)
      .single();

    const { data: modeloData } = await supabase
      .from("escala_modelos")
      .select("nome")
      .eq("municipio_id", municipioId)
      .eq("ativo", true)
      .limit(1)
      .single();

    const { data: configEscalaData } = await supabase
      .from("escala_operacional_config")
      .select("*")
      .eq("municipio_id", municipioId)
      .eq("ativo", true)
      .order("id", { ascending: false })
      .limit(1)
      .single();

    const { data: ocorrenciasData } = await supabase
      .from("ocorrencias")
      .select("id, protocolo, tipo, local, bairro, data, hora, status")
      .eq("municipio_id", municipioId)
      .order("id", { ascending: false });

    const { data: guardasData } = await supabase
      .from("guardas")
.select("id, nome, status, data_nascimento, foto_url")
      .eq("municipio_id", municipioId);

    const { data: viaturaData } = await supabase
      .from("viaturas")
      .select("*")
      .eq("municipio_id", municipioId)
      .order("id", { ascending: true })
      .limit(1)
      .single();

    const { data: avisosData } = await supabase
      .from("avisos")
      .select("*")
      .order("id", { ascending: false });

    const { data: permutasData } = await supabase
      .from("permutas_plantao")
      .select("id, status");

    const { data: guarnicoesData } = await supabase
      .from("guarnicoes")
      .select("*")
      .eq("municipio_id", municipioId)
      .eq("ativa", true)
      .order("id");

    const { data: membrosGuarnicaoData } = await supabase
      .from("guarnicao_membros")
      .select("id, guarnicao_id, guarda_id");

    const { data: viaturasData } = await supabase
      .from("viaturas")
      .select("*")
      .eq("municipio_id", municipioId);

    const hojeData = new Date().toISOString().split("T")[0];

    const { data: escalaHojeData } = await supabase
      .from("escalas_servico")
      .select("*")
      .eq("data_servico", hojeData);

    setMunicipioAtivo(municipioData || null);
    setModeloEscalaAtivo(modeloData?.nome || "Não configurado");
    setConfigEscala((configEscalaData as ConfigEscalaOperacional) || null);
    setOcorrencias(ocorrenciasData || []);
    setGuardas(guardasData || []);
    setViatura(viaturaData || null);
    setAvisos(avisosData || []);
    setEscalaHoje(escalaHojeData || []);
    setViaturas(viaturasData || []);
    setPermutas(permutasData || []);
    setGuarnicoes(guarnicoesData || []);
    setMembrosGuarnicao(membrosGuarnicaoData || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];

  const dataBR = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const horaBR = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const ocorrenciasHoje = ocorrencias.filter((o) => o.data === hoje).length;
  const abertas = ocorrencias.filter((o) => o.status === "Aberta").length;
  const finalizadas = ocorrencias.filter((o) => o.status === "Finalizada").length;
  const guardasServico = guardas.filter((g) => g.status === "Em serviço").length;
  const guardasFolga = guardas.filter((g) => g.status === "Folga").length;
const hojeAniversario = new Date();
const diaHoje = String(hojeAniversario.getDate()).padStart(2, "0");
const mesHoje = String(hojeAniversario.getMonth() + 1).padStart(2, "0");

const aniversariantesHoje = guardas.filter((g) => {
  if (!g.data_nascimento) return false;

  const [, mes, dia] = g.data_nascimento.split("-");

  return dia === diaHoje && mes === mesHoje;
});
  
 const permutasPendentes = permutas.filter(
    (p) => p.status === "PENDENTE" || p.status === "ACEITA"
  ).length;

  function calcularGuarnicaoPlantaoConfigurada() {
    if (!configEscala || !configEscala.ordem_guarnicoes?.length) return null;

    const dataBase = new Date(`${configEscala.data_base}T07:00:00`);
    const agora = new Date();
    const diferencaMs = agora.getTime() - dataBase.getTime();
    const diasPassados = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
    const ordem = configEscala.ordem_guarnicoes;

    const indiceBase = ordem.findIndex(
      (id) => Number(id) === Number(configEscala.guarnicao_base_id)
    );

    if (indiceBase === -1) return null;

    const indiceAtual =
      ((indiceBase + diasPassados) % ordem.length + ordem.length) %
      ordem.length;

    const guarnicaoIdAtual = ordem[indiceAtual];

    return (
      guarnicoes.find((g) => Number(g.id) === Number(guarnicaoIdAtual)) || null
    );
  }

  const guarnicaoAtual = calcularGuarnicaoPlantaoConfigurada();
  const guarnicaoPlantaoHoje = guarnicaoAtual?.nome || "Escala não configurada";

  const membrosGuarnicaoAtual = guarnicaoAtual
    ? membrosGuarnicao.filter(
        (m) => Number(m.guarnicao_id) === Number(guarnicaoAtual.id)
      )
    : [];

  const comandantePlantao = guarnicaoAtual
    ? guardas.find(
        (g) => Number(g.id) === Number(guarnicaoAtual.comandante_id)
      )
    : null;

  const viaturaPlantao = guarnicaoAtual
    ? viaturas.find((v) => Number(v.id) === Number(guarnicaoAtual.viatura_id))
    : null;

  const nomesMembrosPlantao = membrosGuarnicaoAtual.map((membro) => {
    const guarda = guardas.find(
      (g) => Number(g.id) === Number(membro.guarda_id)
    );

    return guarda?.nome || "Guarda não encontrado";
  });

  const ultimasAtividades: Atividade[] = [
    ...ocorrencias.slice(0, 4).map((o) => ({
      titulo: "Nova ocorrência registrada",
      detalhe: `${o.tipo} - ${o.local}`,
      hora: o.hora || "--:--",
      icone: "🚨",
      cor: "text-red-400",
    })),
    ...permutas.slice(0, 2).map((p) => ({
      titulo: "Permuta registrada",
      detalhe: `Status: ${p.status}`,
      hora: "--:--",
      icone: "🔁",
      cor: "text-yellow-400",
    })),
  ].slice(0, 5);

  return (
    <main className="min-h-screen text-white relative overflow-hidden pb-6">

  <div className="fixed inset-0 bg-[#020b1c]" />

  <div
    className="
    fixed inset-0
    bg-[radial-gradient(circle_at_top,#0f3a73,transparent_60%)]
    opacity-40
    "
  />

  <div className="relative z-10">
      <div className="p-4 md:p-5 pb-6 space-y-4">
        <PainelTopo
  municipio={municipioAtivo}
  guarnicao={guarnicaoPlantaoHoje}
  escala={modeloEscalaAtivo}
  data={dataBR}
  hora={horaBR}
  avisos={avisos}
  mostrarNotificacoes={mostrarNotificacoes}
  setMostrarNotificacoes={setMostrarNotificacoes}
  mostrarMensagens={mostrarMensagens}
  setMostrarMensagens={setMostrarMensagens}
/>



        {carregando ? (
  <div className="painel-premium p-10 text-center text-slate-300">
    Carregando painel operacional...
  </div>
) : (
  <>
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-5">
      <CardComando
  titulo="Plantão Ativo"
  valor={guarnicaoAtual?.nome?.replace("Guarnição ", "") || "Ativo"}
  detalhe="Em andamento"
  icone="✅"
  cor="green"
/>
      <CardComando titulo="Ocorrências Pendentes" valor={String(ocorrenciasHoje)} detalhe="Aguardando atendimento" icone="🚨" cor="blue" />
      <CardComando titulo="Chamados Abertos" valor="0" detalhe="Em atendimento" icone="📞" cor="cyan" />
      <CardComando titulo="Viaturas em Serviço" valor={String(viaturas.length)} detalhe="Frota operacional" icone="🚓" cor="purple" />
      <CardComando titulo="Sincronização" valor="Online" detalhe="Sistema atualizado" icone="☁️" cor="gold" />
    </section>

    <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-5">
      <div className="xl:col-span-7 xl:row-span-2">
        <PainelMapa ocorrencias={ocorrencias} />
      </div>

      <div className="xl:col-span-3">
        <PainelGuarnicao
          guarnicao={guarnicaoPlantaoHoje}
          comandante={comandantePlantao?.nome || "Não informado"}
          viatura={viaturaPlantao?.prefixo || "Não definida"}
          membros={membrosGuarnicaoAtual.map((membro) => {
            const guarda = guardas.find(
              (g) => Number(g.id) === Number(membro.guarda_id)
            );

            return guarda?.nome || "Guarda não encontrado";
          })}
        />
      </div>

      <div className="xl:col-span-2">
        <div className="painel-premium p-5 h-full">
          <TituloPainel icone="🎂" titulo="Aniversariantes do Dia" />

          <div className="mt-4 space-y-4">
            {aniversariantesHoje.length === 0 ? (
              <p className="text-slate-400 text-sm">Nenhum aniversariante hoje.</p>
            ) : (
              aniversariantesHoje.slice(0, 3).map((guarda) => (
                <div key={guarda.id} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-800 border border-blue-500/40 flex items-center justify-center">
                    👮
                  </div>

                  <div>
                    <p className="font-bold text-white text-sm">{guarda.nome}</p>
                    <p className="text-xs text-slate-400">Aniversariante do dia</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="xl:col-span-3">
        <PainelAlertas avisos={avisos} />
      </div>

      <div className="xl:col-span-2">
        <PainelUltimasOcorrencias ocorrencias={ocorrencias} />
      </div>
    </section>

    <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      <div className="xl:col-span-5 painel-premium p-5">
        <TituloPainel icone="⚡" titulo="Ações Rápidas" />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <AtalhoPremium href="/sistema/ocorrencias/nova" titulo="Nova Ocorrência" icone="🚨" />
          <AtalhoPremium href="/sistema/chamados" titulo="Novo Chamado" icone="📞" />
          <AtalhoPremium href="/sistema/patrulhamento" titulo="Patrulhamento" icone="🚔" />
          <AtalhoPremium href="/sistema/relatorios" titulo="Relatório" icone="📄" />
          <AtalhoPremium href="/sistema/ia" titulo="IA Operacional" icone="🤖" />
        </div>
      </div>

      <div className="xl:col-span-7">
        <PainelResumo
          finalizadas={finalizadas}
          abertas={abertas}
          guardasServico={guardasServico}
          guardasFolga={guardasFolga}
        />
      </div>
    </section>
  </>
)}

        {podeOperar && (
          <Link
            href="/sistema/ocorrencias/expressa"
            className="fixed bottom-6 right-6 md:hidden bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-xl z-50"
          >
            +
          </Link>
        )}
      </div>
    </div>
  </main>
  );
}

function PainelUltimasOcorrencias({
  ocorrencias,
}: {
  ocorrencias: Ocorrencia[];
}) {
  return (
    <div className="painel-premium p-5 h-full">
      <TituloPainel icone="📋" titulo="Últimas Ocorrências" />

      <div className="mt-4 space-y-3">
        {ocorrencias.length === 0 ? (
          <p className="text-slate-400 text-sm">
            Nenhuma ocorrência recente.
          </p>
        ) : (
          ocorrencias.slice(0, 3).map((o) => (
            <div
              key={o.id}
              className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex justify-between gap-3"
            >
              <div>
                <p className="font-bold text-white text-sm">
                  {o.tipo}
                </p>

                <p className="text-xs text-slate-400">
                  {o.local}
                </p>
              </div>

              <span className="text-blue-400 text-sm font-bold">
                {o.hora || "--:--"}
              </span>
            </div>
          ))
        )}
      </div>

      <Link
        href="/sistema/ocorrencias"
        className="text-blue-400 text-sm font-bold mt-4 block"
      >
        Ver todas →
      </Link>
    </div>
  );
}

function PainelTopo({
  municipio,
  avisos,
  mostrarNotificacoes,
  setMostrarNotificacoes,
  mostrarMensagens,
  setMostrarMensagens,
}: any) {
  return (
    <header className="h-24 rounded-3xl border border-blue-500/20 bg-slate-950/60 backdrop-blur-xl px-8 flex items-center justify-between shadow-[0_0_30px_rgba(0,80,255,.15)]">
      <div className="flex items-center gap-4 min-w-[300px]">
        <img
          src="/brasao-gcm-v2.png"
          alt="SIG-GCM Brasil"
          className="w-16 h-16 rounded-2xl object-contain"
        />

        <div>
          <h1 className="text-4xl font-black tracking-tight">
            SIG-GCM BRASIL
          </h1>

          <p className="text-base text-slate-400">
            Sistema Integrado de Gestão
          </p>

          <p className="text-sm text-white font-bold mt-1">
            📍 {municipio ? `${municipio.nome} - ${municipio.estado}` : "Biritinga - BA"}
          </p>
        </div>
      </div>

      <div className="hidden xl:flex items-center bg-slate-950/90 border border-blue-500/20 rounded-2xl px-5 h-14 w-[620px] shadow-[0_0_25px_rgba(0,80,255,.12)]">
        <span className="text-slate-400">🔍</span>

        <input
          placeholder="Buscar no sistema..."
          className="bg-transparent outline-none ml-3 flex-1 text-white placeholder:text-slate-500"
        />

        <span className="text-xs text-slate-400 border border-slate-700 rounded-lg px-3 py-1">
          Ctrl + K
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)}
          className="w-12 h-12 rounded-full border border-blue-500/20 bg-slate-950/40 flex items-center justify-center hover:bg-blue-500/10 transition relative"
        >
          🔔

          {avisos.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {avisos.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setMostrarMensagens(!mostrarMensagens)}
          className="w-12 h-12 rounded-full border border-blue-500/20 bg-slate-950/40 flex items-center justify-center hover:bg-blue-500/10 transition"
        >
          ✉️
        </button>

        <div className="flex items-center gap-4 px-4 py-2 rounded-2xl border border-blue-500/20 bg-slate-950/40">
          <div className="w-14 h-14 rounded-full bg-slate-800 border border-blue-500/30 flex items-center justify-center text-xl">
            👤
          </div>

          <div className="hidden md:block">
            <p className="font-bold text-white text-lg">
              CMT João Silva
            </p>

            <p className="text-slate-400 text-sm">
              Comandante
            </p>
          </div>

          <span className="text-slate-400">
            ⌄
          </span>
        </div>
      </div>
    </header>
  );
}

function InfoTopo({
  rotulo,
  valor,
  icone,
  destaque,
}: {
  rotulo: string;
  valor: string;
  icone: string;
  destaque?: boolean;
}) {
  return (
    <div className="border-l border-blue-800/80 pl-4">
      <p className="text-slate-400 flex items-center gap-2">
        {icone} {rotulo}
      </p>

      <p
        className={`font-black text-lg ${
          destaque ? "text-green-400" : "text-white"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

function CardComando({
  titulo,
  valor,
  detalhe,
  icone,
  cor,
}: any) {
  const cores = {
    blue: {
      titulo: "text-red-400",
      glow: "shadow-red-500/20",
      icone: "bg-red-500/15 border-red-500/30",
    },

    gold: {
      titulo: "text-blue-400",
      glow: "shadow-blue-500/20",
      icone: "bg-blue-500/15 border-blue-500/30",
    },

    green: {
      titulo: "text-green-400",
      glow: "shadow-green-500/20",
      icone: "bg-green-500/15 border-green-500/30",
    },

    purple: {
      titulo: "text-purple-400",
      glow: "shadow-purple-500/20",
      icone: "bg-purple-500/15 border-purple-500/30",
    },

    cyan: {
      titulo: "text-cyan-400",
      glow: "shadow-cyan-500/20",
      icone: "bg-cyan-500/15 border-cyan-500/30",
    },

    indigo: {
      titulo: "text-yellow-400",
      glow: "shadow-yellow-500/20",
      icone: "bg-yellow-500/15 border-yellow-500/30",
    },
  };

  const estilo = cores[cor as keyof typeof cores];

  return (
    <div className="painel-premium relative p-5 min-h-[130px] overflow-hidden hover:scale-[1.01] transition-all duration-300">

      <div className="absolute top-3 right-3">
        <span className="w-3 h-3 bg-green-400 rounded-full block shadow-lg shadow-green-500/70" />
      </div>

      <div className="flex justify-between items-start">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border ${estilo.icone}`}
        >
          {icone}
        </div>
      </div>

      <p
        className={`uppercase text-xs font-black tracking-wider mt-3 ${estilo.titulo}`}
      >
        {titulo}
      </p>

      <h2 className="text-3xl font-black text-white mt-1 leading-none">
        {valor}
      </h2>

      <p className="text-sm text-slate-400 mt-3">
        {detalhe}
      </p>
    </div>
  );
}

function PainelOcorrenciasTipo({
  ocorrencias,
}: {
  ocorrencias: Ocorrencia[];
}) {
  const total = ocorrencias.length;

  const tipos = ocorrencias.reduce((acc: Record<string, number>, item) => {
    const tipo = item.tipo || "Não informado";
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  const lista = Object.entries(tipos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="painel-premium p-5 min-h-[300px]">
      <TituloPainel icone="📊" titulo="Ocorrências por Tipo" />

      <div className="mt-6">
        {total === 0 ? (
          <p className="text-slate-400">
            Nenhuma ocorrência registrada.
          </p>
        ) : (
          <>
            <div className="mb-5">
              <p className="text-slate-400 text-sm">Total de ocorrências</p>
              <h2 className="text-4xl font-black text-white">{total}</h2>
            </div>

            <div className="space-y-4">
              {lista.map(([tipo, quantidade]) => {
                const percentual = Math.round((quantidade / total) * 100);

                return (
                  <div key={tipo}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-slate-200">
                        {tipo}
                      </span>
                      <span className="text-blue-400 font-bold">
                        {quantidade} • {percentual}%
                      </span>
                    </div>

                    <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PainelGuarnicao({
  guarnicao,
  comandante,
  viatura,
  membros,
}: {
  guarnicao: string;
  comandante: string;
  viatura: string;
  membros: string[];
}) {
  return (
    <div className="painel-premium p-6 min-h-[330px] border border-yellow-600/70">
      <TituloPainel icone="🚔" titulo="Guarnição de Serviço" />

      <div className="border border-blue-600 rounded-2xl p-5 mt-4 relative bg-slate-950/40">

        <div
  className="
    absolute top-4 right-4
    bg-green-500/15
    border border-green-500/50
    backdrop-blur-md
    rounded-xl
    px-4 py-2
    text-center
  "
>
          <p className="text-green-400 font-black text-lg">● EM SERVIÇO</p>
          <p className="text-xs text-white">Plantão Ativo</p>
        </div>

        <h2 className="text-4xl font-black text-green-400 mb-5 pr-32 leading-none">
          {guarnicao}
        </h2>

        <div className="grid md:grid-cols-3 gap-4 mb-5">
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700">
            <p className="text-slate-400 text-sm">👮 Comandante</p>
            <p className="font-bold">
              {comandante || "Não informado"}
            </p>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700">
            <p className="text-slate-400 text-sm">🚓 Viatura</p>
            <p className="font-bold">
              {viatura || "Não definida"}
            </p>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700">
            <p className="text-slate-400 text-sm">👥 Efetivo</p>
            <p className="font-bold">
              {membros.length} integrante(s)
            </p>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <h3 className="text-blue-400 text-lg font-black mb-3">
            👥 Equipe de Serviço
          </h3>

          {membros.length === 0 ? (
            <div className="bg-slate-900/50 rounded-xl p-4 text-slate-400">
              Nenhum integrante cadastrado.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-2">
              {membros.map((nome) => (
                <div
                  key={nome}
                  className="bg-slate-900/50 border border-slate-800 rounded-xl p-3"
                >
                  👮 {nome}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-700 mt-5 pt-4">
          <p className="text-blue-400 font-bold text-center">
            🛡️ Guarnição operacional destacada automaticamente pela escala ativa
          </p>
        </div>

      </div>
    </div>
  );
}

function PainelMapa({ ocorrencias }: { ocorrencias: Ocorrencia[] }) {
  return (
    <div className="painel-premium p-3 h-[500px] relative overflow-hidden">
      <TituloPainel icone="🗺️" titulo="Mapa Operacional" />

      <div className="flex gap-3 text-xs mb-3 mt-2 text-slate-300">
        <span>🔴 Ocorrências</span>
        <span>🔵 Chamados</span>
        <span>🟢 Viaturas</span>
        <span>🟣 Patrulhamento</span>
      </div>

      <div className="absolute left-3 right-3 top-24 bottom-3 rounded-2xl overflow-hidden border border-slate-700 z-0">
  <MapaOperacional />


  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[999]">
    <Link
      href="/sistema/locais"
      className="bg-slate-900/90 border border-blue-500 rounded-xl px-6 py-3 font-bold text-white"
    >
      ⛶ Ver mapa expandido
    </Link>
  </div>
</div>
    </div>
  );
}

function PainelEscalaHoje({ escalaHoje }: { escalaHoje: EscalaHoje[] }) {
  return (
    <div className="painel-premium p-5 min-h-75 flex flex-col">
      <TituloPainel icone="📅" titulo="Escalas de Hoje" />

      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
        {escalaHoje.length === 0 ? (
          <>
            <div className="w-24 h-24 rounded-full border border-blue-700 flex items-center justify-center text-5xl mb-5 bg-blue-950/40">
              📅
            </div>

            <p className="text-slate-300">Nenhum plantão cadastrado para hoje.</p>
            <p className="text-slate-400 mt-2 text-sm">A escala automática está ativa.</p>

            <Link href="/sistema/escalas" className="botao-azul mt-6">
              Ver escala mensal
            </Link>
          </>
        ) : (
          <div className="w-full space-y-3">
            {escalaHoje.slice(0, 5).map((escala) => (
              <div key={escala.id} className="linha-painel">
                <span>{escala.turno}</span>
                <strong>{escala.guarda_nome}</strong>
                <span className="text-green-400">{escala.tipo}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PainelAtividades({ atividades }: { atividades: Atividade[] }) {
  return (
    <div className="painel-premium p-5">
      <TituloPainel icone="📋" titulo="Atividades Recentes" />

      <div className="mt-4 space-y-3">
        {atividades.length === 0 ? (
          <p className="text-slate-400">Nenhuma atividade recente.</p>
        ) : (
          atividades.map((item, index) => (
            <div
              key={`${item.titulo}-${index}`}
              className="flex items-center gap-3 border-b border-slate-800 pb-3"
            >
              <span className={`text-2xl ${item.cor}`}>{item.icone}</span>

              <div className="flex-1">
                <p className="font-bold">{item.titulo}</p>
                <p className="text-sm text-slate-400">{item.detalhe}</p>
              </div>

              <span className="text-sm text-slate-300">{item.hora}</span>
            </div>
          ))
        )}
      </div>

      <Link
        href="/sistema/relatorios"
        className="botao-azul mt-5 block text-center"
      >
        Ver todas as atividades
      </Link>
    </div>
  );
}

function PainelViaturas({
  viaturas,
  viaturaPrincipal,
}: {
  viaturas: Viatura[];
  viaturaPrincipal: Viatura | null;
}) {
  const lista = viaturas.length
    ? viaturas.slice(0, 4)
    : viaturaPrincipal
      ? [viaturaPrincipal]
      : [];

  return (
    <div className="painel-premium p-5">
      <TituloPainel icone="🚓" titulo="Viaturas em Serviço" />

      <div className="mt-4 space-y-3">
        {lista.length === 0 ? (
          <p className="text-slate-400">Nenhuma viatura cadastrada.</p>
        ) : (
          lista.map((v) => (
            <div key={v.id} className="linha-painel">
              <strong>{v.prefixo}</strong>
              <span>{v.modelo}</span>
              <span className="badge-verde">{v.status || "Ativa"}</span>
            </div>
          ))
        )}
      </div>

      <Link href="/sistema/viatura" className="botao-azul mt-5 block text-center">
        Ver todas as viaturas
      </Link>
    </div>
  );
}

function PainelResumo({
  finalizadas,
  abertas,
  guardasServico,
  guardasFolga,
}: any) {
  return (
    <div className="painel-premium p-5 h-full">
      <TituloPainel icone="📊" titulo="Estatísticas do Dia" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
        <ResumoMini titulo="Ocorrências" valor={abertas} />
        <ResumoMini titulo="Chamados" valor={0} />
        <ResumoMini titulo="Patrulhamentos" valor={guardasServico} />
        <ResumoMini titulo="Averiguações" valor={finalizadas} />
      </div>

      <div className="h-24 mt-6 rounded-xl bg-slate-950/70 border border-slate-800 relative overflow-hidden">
        <div className="absolute bottom-6 left-0 w-full h-[2px] bg-blue-500" />
        <div className="absolute bottom-10 left-0 w-full h-[2px] bg-green-500" />
        <div className="absolute bottom-16 left-0 w-full h-[2px] bg-purple-500" />
      </div>
    </div>
  );
}

function PainelAlertas({ avisos }: { avisos: Aviso[] }) {
  return (
    <div className="painel-premium p-5">
      <TituloPainel icone="🔔" titulo="Alertas e Comunicados" />

      <div className="mt-4 space-y-3">
        {avisos.length === 0 ? (
          <>
            <AlertaLinha
              icone="ℹ️"
              titulo="Sistema operacional"
              detalhe="Nenhum aviso crítico cadastrado"
            />

            <AlertaLinha
              icone="🛡️"
              titulo="Segurança ativa"
              detalhe="Painel em funcionamento normal"
            />

            <AlertaLinha
              icone="📅"
              titulo="Escala automática"
              detalhe="Rodízio operacional ativo"
            />
          </>
        ) : (
          avisos.slice(0, 4).map((aviso) => (
            <AlertaLinha
              key={aviso.id}
              icone="🔔"
              titulo={aviso.titulo}
              detalhe={aviso.descricao}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TituloPainel({ icone, titulo }: { icone: string; titulo: string }) {
  return (
    <h2 className="text-sm md:text-base font-black uppercase tracking-wide text-slate-200 border-b border-slate-800 pb-2">
      <span className="mr-2">{icone}</span>
      {titulo}
    </h2>
  );
}

function Legenda({
  cor,
  nome,
  valor,
}: {
  cor: string;
  nome: string;
  valor: string;
}) {
  return (
    <div className="flex justify-between items-center gap-3">
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${cor}`} />
        <span className="text-slate-300">{nome}</span>
      </div>

      <strong>{valor}</strong>
    </div>
  );
}

function ResumoMini({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h3 className="text-3xl font-black">{valor}</h3>
    </div>
  );
}

function AlertaLinha({
  icone,
  titulo,
  detalhe,
}: {
  icone: string;
  titulo: string;
  detalhe: string;
}) {
  return (
    <div className="flex gap-3 items-start border-b border-slate-800 pb-3">
      <span className="text-2xl">{icone}</span>

      <div>
        <p className="font-bold">{titulo}</p>
        <p className="text-sm text-slate-400">{detalhe}</p>
      </div>
    </div>
  );
}

function Beneficio({
  icone,
  titulo,
  texto,
}: {
  icone: string;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="painel-premium p-5 flex items-center gap-4">
      <span className="text-5xl text-yellow-400">{icone}</span>

      <div>
        <h3 className="text-yellow-400 font-black text-xl">{titulo}</h3>
        <p className="text-slate-300">{texto}</p>
      </div>
    </div>
  );
}

function AtalhoPremium({ href, titulo, icone }: any) {
  return (
    <Link
      href={href}
      className="
        h-36 rounded-2xl border border-blue-500/30
        bg-slate-950/70 hover:bg-blue-950/50
        flex flex-col items-center justify-center gap-3
        text-center font-bold transition
      "
    >
      <span className="text-5xl">{icone}</span>
      <span>{titulo}</span>
    </Link>
  );
}
