"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import dynamic from "next/dynamic";
import TelaMobile from "@/components/TelaMobile";
import CardNoticiasClima from "@/components/dashboard/CardNoticiasClima";

import {
  Shield,
  CarFront,
  PhoneCall,
  Cloud,
  AlertTriangle,
CheckCircle,
Search,
Bell,
Mail,
User,
ChevronDown,
Settings,
LogOut,
MapPin,
} from "lucide-react";

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
  bairro?: string;
  data?: string;
  hora?: string;
  status: string;
  local_id?: number;
  locais?: any;
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
  const [fraseDoDia, setFraseDoDia] = useState<any>(null);
  const [busca, setBusca] = useState("");
  const [viatura, setViatura] = useState<Viatura | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [permutas, setPermutas] = useState<Permuta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [guarnicoes, setGuarnicoes] = useState<Guarnicao[]>([]);
  const [guarnicoesPlantao, setGuarnicoesPlantao] = useState<any[]>([]);
  const [membrosGuarnicao, setMembrosGuarnicao] = useState<MembroGuarnicao[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [escalaHoje, setEscalaHoje] = useState<EscalaHoje[]>([]);
  const [municipioAtivo, setMunicipioAtivo] = useState<Municipio | null>(null);
  const [modeloEscalaAtivo, setModeloEscalaAtivo] = useState<string>("");
  const [configEscala, setConfigEscala] = useState<ConfigEscalaOperacional | null>(null);
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  const [rondas, setRondas] = useState<any[]>([]);
  const [agora, setAgora] = useState(new Date());
  const [datasHoje, setDatasHoje] = useState<any[]>([]);
  const [chamados, setChamados] = useState<any[]>([]);

  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [mostrarMensagens, setMostrarMensagens] = useState(false);
  
function obterUsuarioLogado() {
  try {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) return null;

    const usuario = JSON.parse(salvo);

    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) {
      return null;
    }

    return usuario;
  } catch {
    return null;
  }
}

const usuarioLogado = obterUsuarioLogado();

const municipioId = usuarioLogado?.municipio_id;

  const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";
  const ehDesenvolvedor = perfilUsuario === "DESENVOLVEDOR";
  const ehAdmin = perfilUsuario === "ADMIN";
  const ehComandante = perfilUsuario === "COMANDANTE";
  const ehDiretor = perfilUsuario === "DIRETOR";
  const ehPlantonista = perfilUsuario === "PLANTONISTA";
  const ehConsulta = perfilUsuario === "CONSULTA";
  const ehCmtGuarnicao = perfilUsuario === "CMT_GUARNICAO";
  const podeOperar = perfilUsuario !== "CONSULTA";


  async function carregarMensagemDoDia() {
  const hoje = new Date();

  const inicioAno = new Date(
    hoje.getFullYear(),
    0,
    0
  );

  const diff = hoje.getTime() - inicioAno.getTime();

  const diaAno = Math.floor(
    diff / (1000 * 60 * 60 * 24)
  );

  const { data } = await supabase
    .from("mensagens_dia")
    .select("*")
    .eq("dia", diaAno)
    .single();

  setFraseDoDia(data);
}

async function carregarDashboard() {
  setCarregando(true);

  if (!municipioId) {
  alert("Município não identificado.");
  setCarregando(false);
  return;
}

const hoje = new Date()
  .toISOString()
  .split("T")[0];

const { data: datasHoje } = await supabase
  .from("datas_comemorativas")
  .select("*")
  .eq("data_inicio", hoje)
  .eq("ativo", true);

const { data: chamadosData } = await supabase
  .from("chamados")
  .select("id, status, tipo, local, criado_em")
  .eq("municipio_id", municipioId)
  .order("id", { ascending: false })
  .limit(50);

   const { data: municipioData } = await supabase
      .from("municipios")
      .select("id, nome, estado, brasao, cor_principal, ativo")
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
      .select("id, municipio_id, modelo_escala_id, data_base, guarnicao_base_id, ordem_guarnicoes, ativo")
      .eq("municipio_id", municipioId)
      .eq("ativo", true)
      .order("id", { ascending: false })
      .limit(1)
      .single();

const { data: ocorrenciasData } = await supabase
  .from("ocorrencias")
  .select(`
    id,
    protocolo,
    tipo,
    local,
    bairro,
    data,
    hora,
    status,
    local_id,
    locais:local_id (
      id,
      nome,
      latitude,
      longitude
    )
  `)
  .eq("municipio_id", municipioId)
.order("id", { ascending: false })
.limit(50);

    const { data: guardasData } = await supabase
      .from("guardas")
.select("id, nome, status, data_nascimento, foto_url")
      .eq("municipio_id", municipioId);

    const { data: viaturaData } = await supabase
      .from("viaturas")
      .select("id, prefixo, modelo, placa, status, combustivel, quilometragem")
      .eq("municipio_id", municipioId)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: avisosData } = await supabase
      .from("avisos")
      .select("id, titulo, descricao")
      .eq("municipio_id", municipioId)
      .order("id", { ascending: false })
      .limit(10);

const { data: notificacoesData } = await supabase
      .from("notificacoes")
      .select("id, titulo, mensagem, lida, usuario_id, perfil_destino")
      .eq("municipio_id", municipioId)
      .or(
        `usuario_id.eq.${usuarioLogado?.id},usuario_id.is.null,perfil_destino.eq.${usuarioLogado?.perfil}`
      )
      .eq("lida", false)
      .order("id", { ascending: false });

    const { data: permutasData } = await supabase
      .from("permutas_plantao")
      .select("id, status")
      .eq("municipio_id", municipioId);

      const { data: rondasData } = await supabase
      .from("planos_ronda")
      .select("id, nome, status, ativo")
      .eq("municipio_id", municipioId)
      .order("id", { ascending: false })
      .limit(50);

setRondas(rondasData || []);

    const { data: guarnicoesData } = await supabase
      .from("guarnicoes")
      .select("id, nome, comandante_id, viatura_id, ativa")
      .eq("municipio_id", municipioId)
      .eq("ativa", true)
      .order("id");

      const hojePlantao = new Date().toLocaleDateString("en-CA", {
  timeZone: "America/Bahia",
});

const { data: guarnicoesPlantaoData } = await supabase
  .from("guarnicoes_plantao")
  .select(`
    id,
    tipo,
    observacao,
    guarnicoes:guarnicao_id (
      id,
      nome,
      comandante_id,
      viatura_id
    )
  `)
  .eq("municipio_id", municipioId)
  .eq("data_plantao", hojePlantao);

setGuarnicoesPlantao(guarnicoesPlantaoData || []);

    const { data: membrosGuarnicaoData } = await supabase
      .from("guarnicao_membros")
      .select("id, guarnicao_id, guarda_id")
      .eq("municipio_id", municipioId);

    const { data: viaturasData } = await supabase
      .from("viaturas")
      .select("id, prefixo, modelo, placa, status, combustivel, quilometragem")
      .eq("municipio_id", municipioId)
      .limit(100);

    const hojeData = new Date().toISOString().split("T")[0];

    const { data: escalaHojeData } = await supabase
      .from("escalas_servico")
      .select("id, data_servico, guarda_nome, matricula, tipo, turno, equipe")
      .eq("municipio_id", municipioId)
      .eq("data_servico", hojeData);

    setMunicipioAtivo(municipioData || null);
    setModeloEscalaAtivo(modeloData?.nome || "Não configurado");
    setConfigEscala((configEscalaData as ConfigEscalaOperacional) || null);
    
    setOcorrencias((ocorrenciasData as Ocorrencia[]) || []);
    setChamados(chamadosData || []);

    setGuardas(guardasData || []);
    setViatura(viaturaData || null);
    setAvisos(avisosData || []);
    setNotificacoes(notificacoesData || []);
    setEscalaHoje(escalaHojeData || []);
    setViaturas(viaturasData || []);
    setPermutas(permutasData || []);
    setGuarnicoes(guarnicoesData || []);
    setMembrosGuarnicao(membrosGuarnicaoData || []);
    setCarregando(false);
    setDatasHoje(datasHoje || []);
  }

useEffect(() => {
  if (usuarioLogado?.municipio_id) {
    void registrarAuditoria({
      modulo: "Dashboard",
      acao: "ACESSO",
      descricao: "Acessou o dashboard operacional.",
      tabela: "dashboard",
      detalhes: {
        municipio_id: usuarioLogado.municipio_id,
        usuario_id: usuarioLogado.id,
        perfil: usuarioLogado.perfil,
      },
    });
  }

  carregarDashboard();
  carregarMensagemDoDia();

  const timer = setInterval(() => {
    setAgora(new Date());
  }, 1000);

  return () => clearInterval(timer);
}, []);

  const hoje = new Date().toISOString().split("T")[0];

  const dataBR = agora.toLocaleDateString("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const horaBR = agora.toLocaleTimeString("pt-BR");

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

  const chamadosAbertos = chamados.filter(
  (c) => c.status !== "Finalizado"
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

  const rondasAtivas = rondas.filter((r) => r.status === "ATIVA").length;
  const rondasAndamento = rondas.filter((r) => r.status === "EM_ANDAMENTO").length;
  const rondasConcluidas = rondas.filter((r) => r.status === "CONCLUIDA").length;

  return (
  <>
    <div className="block md:hidden">
      <TelaMobile />
    </div>

    <div className="hidden md:block">
      <main className="min-h-screen text-white relative overflow-hidden pb-6">

  <div className="fixed inset-0 bg-[#020b1c]" />

  <div
    className="
    fixed inset-0
    bg-[radial-gradient(circle_at_top,#0f3a73,transparent_60%)]
    opacity-40
    "
  />

  <div className="relative z-0">
      <div className="p-3 md:p-4 pb-4 space-y-3">
        <PainelTopo
  fraseDoDia={fraseDoDia}
  municipio={municipioAtivo}
  guarnicao={guarnicaoPlantaoHoje}
  escala={modeloEscalaAtivo}
  data={dataBR}
  hora={horaBR}
avisos={avisos}
notificacoes={notificacoes}
usuarioLogado={usuarioLogado}
  mostrarNotificacoes={mostrarNotificacoes}
  setMostrarNotificacoes={setMostrarNotificacoes}
  mostrarMensagens={mostrarMensagens}
  setMostrarMensagens={setMostrarMensagens}
  busca={busca}
  setBusca={setBusca}
  mostrarPerfil={mostrarPerfil}
setMostrarPerfil={setMostrarPerfil}
/>



        {carregando ? (
  <div className="painel-premium p-10 text-center text-slate-300">
    Carregando painel operacional...
  </div>
) : (
  <>
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 mb-3">
      <CardComando
  titulo="Plantão Ativo"
  valor={guarnicaoAtual?.nome?.replace("Guarnição ", "") || "Ativo"}
  detalhe="Em andamento"
  icone={<Shield className="w-8 h-8" />}
  cor="green"
/>

<CardComando
  titulo="Ocorrências Pendentes"
  valor={String(abertas)}
  detalhe="Aguardando atendimento"
  icone={<AlertTriangle className="w-8 h-8" />}
  cor="blue"
/>

<Link href="/sistema/chamados">
  <CardComando
    titulo="Chamados Abertos"
    valor={String(chamadosAbertos)}
    detalhe="Clique para acessar"
    icone={<PhoneCall className="w-8 h-8" />}
    cor="cyan"
  />
</Link>

<CardComando
  titulo="Viaturas em Serviço"
  valor={String(viaturas.length)}
  detalhe="Frota operacional"
  icone={<CarFront className="w-8 h-8" />}
  cor="purple"
/>

<CardComando
  titulo="Rondas"
  valor={String(rondasAndamento)}
  detalhe={`${rondasConcluidas} concluídas • ${rondasAtivas} ativas`}
  icone="🚔"
  cor="cyan"
/>

<CardComando
  titulo="Sincronização"
  valor="Online"
  detalhe="Sistema atualizado"
  icone={<Cloud className="w-8 h-8" />}
  cor="gold"
/>

    </section>

<section className="grid grid-cols-1 xl:grid-cols-12 gap-3 mb-3">
  <Link
    href="/sistema/consultas"
    className="
      xl:col-span-4
      painel-premium
      p-5
      flex items-center gap-4
      border border-yellow-500/30
      hover:border-yellow-400
      transition-all
      hover:scale-[1.01]
    "
  >
    <div
      className="
        w-16 h-16
        rounded-2xl
        bg-yellow-500/15
        border border-yellow-500/30
        flex items-center justify-center
      "
    >
      <Search className="w-8 h-8 text-yellow-400" />
    </div>

    <div>
      <h2 className="text-xl font-black text-white">
        Consultas Integradas
      </h2>

      <p className="text-slate-400 text-sm">
        CPF, placa, RENAVAM e pesquisa global SIG Brasil.
      </p>
    </div>
  </Link>

  <div className="xl:col-span-8">
    <CardNoticiasClima />
  </div>
</section>

    <section className="grid grid-cols-1 xl:grid-cols-12 gap-3 mb-3">
  <div className="xl:col-span-7">
    <PainelMapa ocorrencias={ocorrencias} />
  </div>

  <div className="xl:col-span-5 grid grid-cols-1 gap-3">
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

    <PainelGuarnicoesPlantao
  guarnicoes={guarnicoesPlantao}
/>

    <PainelUltimasOcorrencias ocorrencias={ocorrencias} />
  </div>
</section>

<section className="grid grid-cols-1 xl:grid-cols-12 gap-3 min-h-[260px]">
  <div className="xl:col-span-4 space-y-3">
    <PainelAlertas avisos={avisos} />

    <div className="painel-premium p-3">
  <TituloPainel icone="📅" titulo="Datas Importantes de Hoje" />

  <div className="space-y-3 mt-3">
    {datasHoje.length === 0 && aniversariantesHoje.length === 0 ? (
      <p className="text-slate-400 text-sm">
        Nenhuma data importante hoje.
      </p>
    ) : (
      <>
        {aniversariantesHoje.map((guarda) => (
          <div
            key={`aniv-${guarda.id}`}
            className="bg-slate-900/50 border border-slate-800 rounded-lg p-3"
          >
            <p className="font-bold">🎂 {guarda.nome}</p>
            <p className="text-slate-400 text-sm">Aniversariante</p>
          </div>
        ))}

        {datasHoje.map((item) => (
          <div
            key={`data-${item.id}`}
            className="bg-slate-900/50 border border-slate-800 rounded-lg p-3"
          >
            <p className="font-bold">{item.titulo}</p>
            <p className="text-slate-400 text-sm">{item.categoria}</p>
          </div>
        ))}
      </>
    )}
  </div>
</div>
  </div>

  <div className="xl:col-span-8 space-y-3">
<PainelResumo
  finalizadas={finalizadas}
  abertas={abertas}
  rondasAndamento={rondasAndamento}
/>

  <PainelAtividades atividades={ultimasAtividades} />
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
    </div>
  </>
);
}

function PainelUltimasOcorrencias({
  ocorrencias,
}: {
  ocorrencias: Ocorrencia[];
}) {
  return (
    <div className="painel-premium p-4 flex-1">
      <TituloPainel
        icone="🚨"
        titulo="Últimas Ocorrências"
      />

      <div className="mt-4 space-y-3">
        {ocorrencias.length === 0 ? (
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-center text-slate-400">
            Nenhuma ocorrência recente.
          </div>
        ) : (
          ocorrencias.slice(0, 2).map((o) => (
            <div
              key={o.id}
              className="
                bg-slate-950/60
                border border-slate-800
                rounded-2xl
                p-4
                hover:border-blue-500/50
                transition-all
              "
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-lg text-white">
                    🚨 {o.tipo}
                  </h3>

                  <p className="text-slate-400 text-sm mt-1">
                    📍 {o.local}
                  </p>
                </div>

                <span className="text-cyan-400 font-bold">
                  {o.hora || "--:--"}
                </span>
              </div>

              <div className="mt-3 flex justify-between items-center">
                <span
                  className={`
                    px-3 py-1 rounded-full text-xs font-black
                    ${
                      o.status === "Finalizada"
                        ? "bg-green-500/15 text-green-400 border border-green-500/30"
                        : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                    }
                  `}
                >
                  {o.status}
                </span>

                <span className="text-slate-500 text-xs">
                  #{o.protocolo || o.id}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <Link
        href="/sistema/ocorrencias"
        className="
          mt-4 block text-center
          bg-blue-600/20
          border border-blue-500/30
          rounded-xl
          py-3
          font-bold
          text-blue-400
          hover:bg-blue-600/30
          transition
        "
      >
        Ver todas as ocorrências
      </Link>
    </div>
  );
}

function PainelTopo({
  municipio,
  avisos,
  notificacoes,
  fraseDoDia,
  usuarioLogado,
  mostrarNotificacoes,
  setMostrarNotificacoes,
  mostrarMensagens,
  setMostrarMensagens,
  mostrarPerfil,
  setMostrarPerfil,
  busca,
  setBusca,
  data,
hora,
}: any) {

  function sairSistema() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "/login";
  }

  return (
    <header className="min-h-28 rounded-2xl border border-blue-500/20 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between shadow-[0_0_30px_rgba(0,80,255,.15)] relative z-[9999] overflow-visible">
      <div className="flex items-center gap-5 min-w-[350px]">
        <img
          src={municipio?.brasao || "/brasoes/sig-gcm-logo.png"}
          alt="Brasão"
          className="w-16 h-16 object-contain"
        />

        <div>
          <h1 className="text-3xl font-black text-white">
            SIG-GCM BRASIL
          </h1>

          <p className="text-xs text-cyan-400 font-semibold mt-1">
  📅 {data} • ⏰ {hora}
</p>

                    <p className="text-sm text-white font-bold mt-1">
            <span className="flex items-center gap-1">
  <MapPin className="w-4 h-4 text-blue-400" />
  {municipio ? `${municipio.nome} - ${municipio.estado}` : "Biritinga - BA"}
</span>
          </p>
        </div>
      </div>

      <div className="hidden xl:flex items-center bg-slate-950/90 border border-blue-500/20 rounded-2xl px-5 h-14 w-[450px]">
        <Bell className="w-6 h-6 text-cyan-300" />

        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && busca.trim()) {
              window.location.href = `/sistema/busca?q=${encodeURIComponent(busca)}`;
            }
          }}
          placeholder="Buscar no sistema..."
          className="bg-transparent outline-none ml-3 flex-1 text-white placeholder:text-slate-500"
        />
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 bottom-2 w-[450px] overflow-hidden">
  <div className="animate-marquee whitespace-nowrap">
    <span className="text-yellow-400 font-bold text-sm">
      💬 {fraseDoDia?.texto || "Carregando..."}
📖 {fraseDoDia?.referencia || ""}
    </span>
  </div>
</div>

      <div className="flex items-center gap-3 shrink-0 relative">
        <Link
  href="/sistema/notificacoes"
  className="w-12 h-12 rounded-full border border-cyan-400/40 bg-slate-950/60 flex items-center justify-center hover:bg-blue-500/10 transition relative"
>
  🔔
  {notificacoes.length > 0 && (
    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {notificacoes.length}
    </span>
  )}
</Link>

        <button
          type="button"
          onClick={() => {
            setMostrarMensagens(!mostrarMensagens);
            setMostrarNotificacoes(false);
            setMostrarPerfil(false);
          }}
          className="w-12 h-12 rounded-full border border-blue-500/30 bg-[#071a35]/60 flex items-center justify-center hover:bg-blue-500/10 transition"
        >
          <Mail className="w-6 h-6 text-blue-300" />
        </button>

        <button
          type="button"
          onClick={() => {
            setMostrarPerfil(!mostrarPerfil);
            setMostrarNotificacoes(false);
            setMostrarMensagens(false);
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-2xl border border-blue-500/30 bg-slate-950/60 min-w-[230px] hover:bg-blue-500/10 transition"
        >
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-blue-500/30 flex items-center justify-center text-xl shrink-0 overflow-hidden">
            {usuarioLogado?.foto_url ? (
              <img
                src={usuarioLogado.foto_url}
                alt={usuarioLogado?.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-slate-300" />
            )}
          </div>

          <div className="flex-1 min-w-0 text-left">
            <p className="font-bold text-white text-base leading-tight truncate">
              {usuarioLogado?.nome || "Usuário"}
            </p>

            <p className="text-slate-400 text-xs">
              {usuarioLogado?.perfil || "CONSULTA"}
            </p>

            <div className="flex items-center gap-1 mt-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-green-400 text-xs font-bold">
                ONLINE
              </span>
            </div>
          </div>

          <span className="text-slate-400">
            <ChevronDown className="w-5 h-5" />
          </span>
        </button>

        {mostrarNotificacoes && (
          <div className="absolute right-72 top-16 w-80 rounded-2xl border border-blue-500/30 bg-slate-950 shadow-2xl p-4 z-50">
            <h3 className="font-black text-white mb-3">
              🔔 Notificações
            </h3>

            {notificacoes.length === 0 ? (
              <p className="text-slate-400 text-sm">
                Nenhuma notificação no momento.
              </p>
            ) : (
              <div className="space-y-3">
               {notificacoes.slice(0, 5).map((item: any) => (
  <div
    key={item.id}
                    className="border-b border-slate-800 pb-2"
                  >
                    <p className="font-bold text-white text-sm">
                      {item.titulo}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {item.mensagem}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {mostrarMensagens && (
          <div className="absolute right-56 top-16 w-80 rounded-2xl border border-blue-500/30 bg-slate-950 shadow-2xl p-4 z-50">
            <h3 className="font-black text-white mb-3">
              ✉️ Mensagens
            </h3>

            <p className="text-slate-400 text-sm">
              Nenhuma mensagem interna no momento.
            </p>
          </div>
        )}

        {mostrarPerfil && (
          <div className="absolute right-0 top-16 w-72 rounded-2xl border border-blue-500/30 bg-slate-950 shadow-2xl p-4 z-50">
            <div className="border-b border-slate-800 pb-3 mb-3">
              <p className="font-black text-white">
                {usuarioLogado?.nome || "Usuário"}
              </p>
              <p className="text-slate-400 text-sm">
                {usuarioLogado?.email || "Sem e-mail"}
              </p>
              <p className="text-blue-400 text-xs font-bold mt-1">
                {usuarioLogado?.perfil || "CONSULTA"}
              </p>
            </div>

            <Link
              href="/sistema/perfil"
              className="block px-3 py-2 rounded-xl hover:bg-blue-500/10 text-slate-200 font-bold"
            >
              <span className="flex items-center gap-2">
  <User className="w-5 h-5" />
  Meu Perfil
</span>
            </Link>

            <Link
              href="/sistema/configuracoes"
              className="block px-3 py-2 rounded-xl hover:bg-blue-500/10 text-slate-200 font-bold"
            >
              <span className="flex items-center gap-2">
  <Settings className="w-5 h-5" />
  Configurações
</span>
            </Link>

            <button
              type="button"
              onClick={sairSistema}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-400 font-bold mt-2"
            >
              <span className="flex items-center gap-2">
  <LogOut className="w-5 h-5" />
  Sair do sistema
</span>
            </button>
          </div>
        )}
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
  icone: React.ReactNode;
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
      icone: "bg-red-500/15 border-red-500/30",
    },

    gold: {
      titulo: "text-blue-400",
      icone: "bg-blue-500/15 border-blue-500/30",
    },

    green: {
      titulo: "text-green-400",
      icone: "bg-green-500/15 border-green-500/30",
    },

    purple: {
      titulo: "text-purple-400",
      icone: "bg-purple-500/15 border-purple-500/30",
    },

    cyan: {
      titulo: "text-cyan-400",
      icone: "bg-cyan-500/15 border-cyan-500/30",
    },

    indigo: {
      titulo: "text-yellow-400",
      icone: "bg-yellow-500/15 border-yellow-500/30",
    },
  };

  const estilo = cores[cor as keyof typeof cores];

  return (
    <div className="painel-premium relative p-4 h-[110px] overflow-hidden hover:scale-[1.01] transition-all duration-300">

      <div className="absolute top-3 right-3">
        <span className="w-3 h-3 bg-green-400 rounded-full block shadow-lg shadow-green-500/70" />
      </div>

      <div className="flex items-center gap-4 h-full">

        <div
          className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl border ${estilo.icone}`}
        >
          {icone}
        </div>

        <div className="flex flex-col justify-center min-w-0">

          <p
            className={`uppercase text-[11px] font-black tracking-wider ${estilo.titulo}`}
          >
            {titulo}
          </p>

          <h2 className="text-3xl font-black text-white leading-none mt-1">
            {valor}
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            {detalhe}
          </p>

        </div>

      </div>
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
    <div className="painel-premium p-4 h-full border border-cyan-500/40 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#0ea5e9,transparent_35%)] opacity-20" />

      <div className="relative z-10">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-lg font-black uppercase tracking-wide text-white">
            🚔 Guarnição de Serviço
          </h2>

          <span className="bg-green-500/15 border border-green-500/50 text-green-400 rounded-xl px-3 py-1 text-sm font-black animate-pulse">
            ATIVO
          </span>
        </div>

        <div className="mt-5">
          <p className="text-slate-400 text-sm font-bold uppercase">
            Plantão atual
          </p>

          <h1 className="text-4xl font-black text-cyan-300 mt-1">
            {guarnicao}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-slate-950/70 border border-blue-500/30 rounded-2xl p-4">
            <p className="text-slate-400 text-sm font-bold">
              👮 Comandante
            </p>
            <p className="text-white font-black text-lg mt-1">
              {comandante || "Não informado"}
            </p>
          </div>

          <div className="bg-slate-950/70 border border-blue-500/30 rounded-2xl p-4">
            <p className="text-slate-400 text-sm font-bold">
              🚓 Viatura
            </p>
            <p className="text-white font-black text-lg mt-1">
              {viatura || "Não definida"}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-blue-400 font-black uppercase text-sm mb-3">
            👥 Equipe em serviço
          </h3>

          {membros.length === 0 ? (
            <div className="bg-slate-950/60 rounded-xl p-4 text-slate-400 border border-slate-800">
              Nenhum integrante cadastrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {membros.map((nome) => (
                <div
                  key={nome}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-sm font-bold flex items-center gap-2"
                >
                  <span className="text-blue-400">👮</span>
                  {nome}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PainelMapa({ ocorrencias }: { ocorrencias: Ocorrencia[] }) {
  return (
    <div className="painel-premium p-3 h-[500px] relative overflow-hidden">
      <TituloPainel icone="🗺️" titulo="Mapa Operacional" />

      <div className="flex flex-wrap gap-4 text-xs font-semibold mb-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-400"></span>
          Base GCM
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          Ocorrências
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          Chamados
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          Viaturas
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-500"></span>
          Patrulhamento
        </div>
      </div>

      <div className="absolute left-3 right-3 top-20 bottom-3 rounded-2xl overflow-hidden border border-slate-700 z-0">
        <MapaOperacional ocorrencias={ocorrencias} />

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[999]">
          <Link
            href="/sistema/mapa-operacional"
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
    <div className="painel-premium p-4">
      <TituloPainel icone="📡" titulo="Atividade Operacional" />

      <div className="mt-5 space-y-3">
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
    <div className="painel-premium p-3">
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
  rondasAndamento,
}: {
  finalizadas: number;
  abertas: number;
  rondasAndamento: number;
}) {
  return (
    <div className="painel-premium p-5 h-30">
      <TituloPainel icone="📊" titulo="Estatísticas do Dia" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-5">
        <ResumoMini
          titulo="Finalizadas"
          valor={finalizadas}
          icone={<CheckCircle className="w-7 h-7" />}
          cor="green"
        />

        <ResumoMini
          titulo="Patrulhamentos"
          valor={rondasAndamento}
          icone={<CarFront className="w-7 h-7" />}
          cor="cyan"
        />

        <ResumoMini
          titulo="Pendentes"
          valor={abertas}
          icone={<Search className="w-7 h-7" />}
          cor="purple"
        />
      </div>
    </div>
  );
}

function PainelAlertas({ avisos }: { avisos: Aviso[] }) {
  return (
    <div className="painel-premium p-5">
      <TituloPainel
        icone="📢"
        titulo="Mural Operacional"
      />

      <div className="mt-4 space-y-3">
        {avisos.length === 0 ? (
          <>
            <AlertaLinha
              icone="ℹ️"
              titulo="Sistema operacional"
              detalhe="Nenhum aviso cadastrado."
            />

            <AlertaLinha
              icone="🛡️"
              titulo="Segurança ativa"
              detalhe="Painel funcionando normalmente."
            />

            <AlertaLinha
              icone="📅"
              titulo="Escala automática"
              detalhe="Rodízio operacional ativo."
            />
          </>
        ) : (
          avisos.slice(0, 5).map((aviso) => (
  <AlertaLinha
    key={aviso.id}
    icone="📢"
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

function ResumoMini({
  titulo,
  valor,
  icone,
  cor,
}: {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
  cor: "yellow" | "green" | "blue" | "slate" | "cyan" | "purple";
}) {
  const cores = {
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    green: "text-green-400 bg-green-500/10 border-green-500/30",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    slate: "text-slate-300 bg-slate-500/10 border-slate-500/30",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  };

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/40 transition-all">
      <div className="flex items-center justify-between">
        <div
          className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${cores[cor]}`}
        >
          {icone}
        </div>

        <h3 className="text-4xl font-black text-white">
          {valor}
        </h3>
      </div>

      <p className="mt-4 text-sm font-bold uppercase tracking-wide text-slate-400">
        {titulo}
      </p>
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
        h-24 rounded-2xl border border-blue-500/30
        bg-slate-950/70 hover:bg-blue-950/50
        flex flex-col items-center justify-center gap-3
        text-center font-bold transition
      "
    >
      <span className="text-3xl">{icone}</span>
      <span>{titulo}</span>
    </Link>
  );
}

function PainelGuarnicoesPlantao({
  guarnicoes,
}: {
  guarnicoes: any[];
}) {
  return (
    <div className="painel-premium p-4">
      <TituloPainel
        icone="🚔"
        titulo="Guarnições Ativas"
      />

      <div className="space-y-2 mt-4">
        {guarnicoes.length === 0 ? (
          <p className="text-slate-400 text-sm">
            Nenhuma guarnição ativa.
          </p>
        ) : (
          guarnicoes.map((item: any) => (
  <div
    key={item.id}
    className="bg-slate-950/60 border border-slate-800 rounded-xl p-3"
  >
    <p className="font-bold text-cyan-400">
      {item.guarnicoes?.nome || "Guarnição não encontrada"}
    </p>

    <p className="text-xs text-slate-400 mt-1">
      Tipo: {item.tipo || "ORDINARIA"}
    </p>

    {item.observacao && (
      <p className="text-xs text-slate-500 mt-1">
        {item.observacao}
      </p>
    )}
  </div>
))
        )}
      </div>
    </div>
  );
}
