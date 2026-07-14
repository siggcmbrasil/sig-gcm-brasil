import Link from "next/link";
import {
  Activity,
  BookOpen,
  Brain,
  Building2,
  Car,
  ClipboardList,
  GraduationCap,
  HeartPulse,
  Landmark,
  MapPinned,
  Radio,
  Scale,
  ShieldCheck,
  Sparkles,
  TrafficCone,
  Wrench,
} from "lucide-react";

type StatusModulo = "CONCLUÍDO" | "EM DESENVOLVIMENTO" | "PLANEJADO" | "FUTURO";

type ModuloItem = {
  nome: string;
  descricao: string;
  status: StatusModulo;
  rota?: string;
};

type GrupoModulo = {
  titulo: string;
  descricao: string;
  icon: any;
  modulos: ModuloItem[];
};

const statusClasses: Record<StatusModulo, string> = {
  CONCLUÍDO: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "EM DESENVOLVIMENTO": "bg-yellow-100 text-yellow-700 border-yellow-200",
  PLANEJADO: "bg-blue-100 text-blue-700 border-blue-200",
  FUTURO: "bg-purple-100 text-purple-700 border-purple-200",
};

const grupos: GrupoModulo[] = [
  {
    titulo: "Centro de Comando",
    descricao: "Visão geral da operação, indicadores, mapa e situação da cidade.",
    icon: ShieldCheck,
    modulos: [
      { nome: "Dashboard Operacional", descricao: "Painel principal com indicadores da guarda.", status: "CONCLUÍDO", rota: "/sistema" },
      { nome: "Mapa Operacional", descricao: "Mapa com ocorrências, viaturas, patrulhamentos e pontos estratégicos.", status: "EM DESENVOLVIMENTO" },
      { nome: "Sala de Situação", descricao: "Painel em tempo real para comando e tomada de decisão.", status: "PLANEJADO" },
      { nome: "Centro de Crise", descricao: "Gestão de crises, eventos graves e ocorrências extraordinárias.", status: "FUTURO" },
    ],
  },
  {
    titulo: "Central Operacional",
    descricao: "Execução diária da guarda: ocorrências, patrulhamento, chamados e missões.",
    icon: Radio,
    modulos: [
      { nome: "Ocorrências", descricao: "Registro completo de ocorrências, envolvidos, veículos, objetos e PDF.", status: "CONCLUÍDO", rota: "/sistema/ocorrencias" },
      { nome: "Chamados", descricao: "Controle de solicitações operacionais internas e externas.", status: "CONCLUÍDO", rota: "/sistema/chamados" },
      { nome: "Patrulhamento", descricao: "Registro de deslocamento, GPS, início, fim e histórico.", status: "EM DESENVOLVIMENTO", rota: "/sistema/patrulhamento" },
      { nome: "Visitas com QR Code", descricao: "Confirmação de presença em escolas, órgãos, praças e pontos estratégicos.", status: "PLANEJADO" },
      { nome: "Ordem de Serviço", descricao: "Criação e acompanhamento de ordens operacionais.", status: "PLANEJADO" },
      { nome: "Missões", descricao: "Designação de missões para equipes e guarnições.", status: "FUTURO" },
      { nome: "Operações Especiais", descricao: "Planejamento e execução de operações integradas.", status: "FUTURO" },
    ],
  },
  {
    titulo: "Central de Ensino",
    descricao: "Ambiente para o guarda estudar, aprender, treinar e evoluir profissionalmente.",
    icon: GraduationCap,
    modulos: [
      { nome: "Academia SIG", descricao: "Cursos e trilhas de capacitação para guardas municipais.", status: "PLANEJADO" },
      { nome: "Biblioteca Digital", descricao: "Apostilas, leis, manuais, POPs, cartilhas e materiais de estudo.", status: "PLANEJADO" },
      { nome: "Banco de Questões", descricao: "Questões por tema, lei, dificuldade e categoria.", status: "FUTURO" },
      { nome: "Simulados", descricao: "Simulados cronometrados para concursos e capacitação interna.", status: "FUTURO" },
      { nome: "Flashcards", descricao: "Revisão rápida de legislação, procedimentos e conceitos.", status: "FUTURO" },
      { nome: "Mapas Mentais", descricao: "Resumos visuais de leis, procedimentos e matérias.", status: "FUTURO" },
      { nome: "IA Professor", descricao: "Assistente de estudo para explicar leis, criar questões e planos de estudo.", status: "FUTURO" },
      { nome: "Certificados", descricao: "Certificados em PDF vinculados ao dossiê do guarda.", status: "FUTURO" },
    ],
  },
  {
    titulo: "Inteligência",
    descricao: "Análise criminal, IA, dados estratégicos e apoio à decisão.",
    icon: Brain,
    modulos: [
      { nome: "IA Operacional", descricao: "Assistente para apoio em ocorrências e relatórios.", status: "CONCLUÍDO", rota: "/sistema/ia" },
      { nome: "IA Jurídica", descricao: "Apoio jurídico com base em leis e procedimentos.", status: "EM DESENVOLVIMENTO", rota: "/sistema/ia-juridica" },
      { nome: "Mancha Criminal", descricao: "Mapa de calor e análise geográfica das ocorrências.", status: "PLANEJADO" },
      { nome: "Pessoas de Interesse", descricao: "Cadastro e acompanhamento de pessoas relevantes para análise.", status: "FUTURO" },
      { nome: "Veículos Suspeitos", descricao: "Controle estratégico de veículos observados ou suspeitos.", status: "FUTURO" },
    ],
  },
  {
    titulo: "Recursos Humanos",
    descricao: "Gestão dos guardas, escalas, dossiê, documentos e vida funcional.",
    icon: ClipboardList,
    modulos: [
      { nome: "Guardas", descricao: "Cadastro e gestão dos servidores da guarda.", status: "CONCLUÍDO", rota: "/sistema/guardas" },
      { nome: "Dossiê Funcional", descricao: "Histórico completo do guarda, documentos, cursos e registros.", status: "EM DESENVOLVIMENTO" },
      { nome: "Escalas", descricao: "Escalas, plantões, guarnições e serviço 24/96.", status: "CONCLUÍDO", rota: "/sistema/escalas" },
      { nome: "Banco de Horas", descricao: "Controle de horas extras, compensações e saldos.", status: "PLANEJADO" },
      { nome: "Férias e Licenças", descricao: "Gestão de afastamentos, férias, licenças e retornos.", status: "PLANEJADO" },
      { nome: "Elogios e Advertências", descricao: "Registros funcionais positivos e disciplinares.", status: "FUTURO" },
    ],
  },
  {
    titulo: "Frota",
    descricao: "Controle completo das viaturas, manutenção, abastecimento e checklist.",
    icon: Car,
    modulos: [
      { nome: "Viaturas", descricao: "Cadastro e controle das viaturas.", status: "CONCLUÍDO", rota: "/sistema/viaturas" },
      { nome: "Abastecimentos", descricao: "Controle de combustível, custos e quilometragem.", status: "EM DESENVOLVIMENTO", rota: "/sistema/abastecimentos" },
      { nome: "Manutenções", descricao: "Histórico preventivo e corretivo das viaturas.", status: "PLANEJADO" },
      { nome: "Checklist de Viatura", descricao: "Checklist diário pelo celular antes do serviço.", status: "PLANEJADO" },
      { nome: "Rastreamento de Viaturas", descricao: "Localização e histórico de deslocamento.", status: "FUTURO" },
    ],
  },
  {
    titulo: "Armamento e Equipamentos",
    descricao: "Gestão de armas, munições, coletes, cautelas e rastreabilidade.",
    icon: ShieldCheck,
    modulos: [
      { nome: "Armamentos", descricao: "Cadastro de armas e dados técnicos.", status: "PLANEJADO" },
      { nome: "Munições", descricao: "Controle de entrada, saída e estoque de munições.", status: "PLANEJADO" },
      { nome: "Cautelas", descricao: "Entrega e devolução de equipamentos com auditoria.", status: "PLANEJADO" },
      { nome: "Coletes", descricao: "Controle de validade, numeração e guarda responsável.", status: "FUTURO" },
      { nome: "Equipamentos Táticos", descricao: "Spray, algemas, lanternas, rádios e outros itens.", status: "FUTURO" },
    ],
  },
  {
    titulo: "Patrimônio",
    descricao: "Controle de bens, estoque, almoxarifado, transferências e baixas.",
    icon: Building2,
    modulos: [
      { nome: "Bens Patrimoniais", descricao: "Cadastro e controle de bens da instituição.", status: "EM DESENVOLVIMENTO", rota: "/sistema/patrimonio" },
      { nome: "Almoxarifado", descricao: "Entrada, saída e saldo de materiais.", status: "PLANEJADO" },
      { nome: "Inventário", descricao: "Conferência periódica dos bens.", status: "PLANEJADO" },
      { nome: "Transferências", descricao: "Movimentação de bens entre setores.", status: "FUTURO" },
      { nome: "Baixas", descricao: "Baixa patrimonial com justificativa e auditoria.", status: "FUTURO" },
    ],
  },
  {
    titulo: "Comunicação",
    descricao: "Comunicação institucional, avisos, ofícios, notificações e mensagens.",
    icon: Activity,
    modulos: [
      { nome: "Avisos", descricao: "Comunicados internos para usuários do sistema.", status: "CONCLUÍDO" },
      { nome: "Ofícios", descricao: "Gestão de ofícios, numeração, PDF e status.", status: "EM DESENVOLVIMENTO", rota: "/sistema/oficios" },
      { nome: "Notificações do Plantão", descricao: "Transformar ofícios ou avisos em notificações operacionais.", status: "PLANEJADO" },
      { nome: "Chat Interno", descricao: "Mensagens entre usuários, setores e guarnições.", status: "FUTURO" },
      { nome: "Rádio Digital", descricao: "Comunicação operacional integrada ao sistema.", status: "FUTURO" },
    ],
  },
  {
    titulo: "Jurídico e Corregedoria",
    descricao: "Legislação, sindicâncias, PAD, corregedoria e acompanhamento jurídico.",
    icon: Scale,
    modulos: [
      { nome: "Central de Legislação", descricao: "Leis, categorias, busca e favoritos.", status: "EM DESENVOLVIMENTO", rota: "/sistema/legislacao" },
      { nome: "Corregedoria", descricao: "Denúncias internas, sindicâncias e procedimentos.", status: "PLANEJADO" },
      { nome: "Sindicância", descricao: "Acompanhamento de apurações internas.", status: "FUTURO" },
      { nome: "PAD", descricao: "Processo administrativo disciplinar.", status: "FUTURO" },
      { nome: "Pareceres", descricao: "Pareceres jurídicos e orientações institucionais.", status: "FUTURO" },
    ],
  },
  {
    titulo: "Portal do Cidadão",
    descricao: "Canal externo para denúncias, solicitações, ouvidoria e protocolos.",
    icon: Landmark,
    modulos: [
      { nome: "Denúncias", descricao: "Registro de denúncias pelo cidadão.", status: "EM DESENVOLVIMENTO" },
      { nome: "Solicitações", descricao: "Solicitações de apoio, fiscalização ou atendimento.", status: "EM DESENVOLVIMENTO" },
      { nome: "Ouvidoria", descricao: "Canal de manifestação do cidadão.", status: "EM DESENVOLVIMENTO" },
      { nome: "Protocolos", descricao: "Acompanhamento dos pedidos realizados.", status: "EM DESENVOLVIMENTO" },
      { nome: "Achados e Perdidos", descricao: "Cadastro e consulta de itens encontrados.", status: "PLANEJADO" },
    ],
  },
  {
    titulo: "Defesa Civil",
    descricao: "Gestão de alertas, desastres, abrigos e ocorrências ambientais críticas.",
    icon: MapPinned,
    modulos: [
      { nome: "Alertas", descricao: "Alertas de chuva, enchente, risco e emergência.", status: "FUTURO" },
      { nome: "Ocorrências de Defesa Civil", descricao: "Registro de ocorrências específicas.", status: "FUTURO" },
      { nome: "Abrigos", descricao: "Controle de locais de abrigo e acolhimento.", status: "FUTURO" },
      { nome: "Queimadas", descricao: "Registro e monitoramento de queimadas.", status: "FUTURO" },
    ],
  },
  {
    titulo: "Trânsito",
    descricao: "Apoio à fiscalização, acidentes, interdições e educação no trânsito.",
    icon: TrafficCone,
    modulos: [
      { nome: "Acidentes", descricao: "Registro de sinistros e apoio operacional.", status: "FUTURO" },
      { nome: "Interdições", descricao: "Controle de bloqueios, desvios e sinalização.", status: "FUTURO" },
      { nome: "Educação no Trânsito", descricao: "Campanhas educativas e ações preventivas.", status: "FUTURO" },
      { nome: "Fiscalizações", descricao: "Apoio a operações e registros administrativos.", status: "FUTURO" },
    ],
  },
  {
    titulo: "Saúde e Bem-estar do Guarda",
    descricao: "Cuidado com saúde física, mental e qualidade de vida do servidor.",
    icon: HeartPulse,
    modulos: [
      { nome: "Aptidão Física", descricao: "Controle de avaliações físicas e evolução.", status: "FUTURO" },
      { nome: "Exames", descricao: "Registro de exames periódicos.", status: "FUTURO" },
      { nome: "Vacinas", descricao: "Controle de vacinação dos servidores.", status: "FUTURO" },
      { nome: "Apoio Psicológico", descricao: "Registro e acompanhamento de apoio institucional.", status: "FUTURO" },
    ],
  },
  {
    titulo: "Tecnologia e Segurança",
    descricao: "Auditoria, logs, permissões, backup, API e governança do sistema.",
    icon: Wrench,
    modulos: [
      { nome: "Usuários", descricao: "Gestão de usuários, status e permissões.", status: "CONCLUÍDO", rota: "/sistema/usuarios" },
      { nome: "Permissões", descricao: "Controle de acesso por perfil e município.", status: "EM DESENVOLVIMENTO" },
      { nome: "Auditoria", descricao: "Registro de ações sensíveis no sistema.", status: "EM DESENVOLVIMENTO" },
      { nome: "Logs", descricao: "Histórico técnico de eventos e falhas.", status: "PLANEJADO" },
      { nome: "API", descricao: "Integrações externas com segurança e tokens.", status: "FUTURO" },
      { nome: "Backup", descricao: "Rotinas de backup e recuperação.", status: "FUTURO" },
    ],
  },
  {
    titulo: "Integrações Futuras",
    descricao: "Conexões externas para tornar o SIG uma plataforma de ponta.",
    icon: Sparkles,
    modulos: [
      { nome: "WhatsApp", descricao: "Envio de notificações e mensagens automáticas.", status: "PLANEJADO" },
      { nome: "Telegram", descricao: "Bot operacional para apoio interno.", status: "PLANEJADO" },
      { nome: "E-mail", descricao: "Notificações oficiais por e-mail.", status: "FUTURO" },
      { nome: "SMS", descricao: "Alertas rápidos por mensagem.", status: "FUTURO" },
      { nome: "Câmeras", descricao: "Integração com CFTV municipal.", status: "FUTURO" },
      { nome: "Leitura de Placas", descricao: "LPR/OCR para veículos suspeitos.", status: "FUTURO" },
      { nome: "Bodycam", descricao: "Gestão de câmeras corporais e evidências.", status: "FUTURO" },
      { nome: "Drones", descricao: "Central de drones e imagens aéreas.", status: "FUTURO" },
    ],
  },
  {
    titulo: "SIG Legislação Inteligente",
    descricao: "Produto futuro derivado da Central de Ensino e Legislação.",
    icon: BookOpen,
    modulos: [
      { nome: "Biblioteca Jurídica", descricao: "Leis pesquisáveis e comentadas.", status: "FUTURO" },
      { nome: "Jurisprudência", descricao: "Decisões e entendimentos organizados por tema.", status: "FUTURO" },
      { nome: "Leis em Áudio", descricao: "Conteúdo jurídico em formato de áudio.", status: "FUTURO" },
      { nome: "Plano de Estudos", descricao: "Organização inteligente para concursos e capacitação.", status: "FUTURO" },
    ],
  },
];

function BadgeStatus({ status }: { status: StatusModulo }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${statusClasses[status]}`}>
      {status}
    </span>
  );
}

export default function AtualizacoesPage() {
  const total = grupos.reduce((acc, grupo) => acc + grupo.modulos.length, 0);
  const concluidos = grupos.flatMap((g) => g.modulos).filter((m) => m.status === "CONCLUÍDO").length;
  const andamento = grupos.flatMap((g) => g.modulos).filter((m) => m.status === "EM DESENVOLVIMENTO").length;
  const planejados = grupos.flatMap((g) => g.modulos).filter((m) => m.status === "PLANEJADO").length;
  const futuros = grupos.flatMap((g) => g.modulos).filter((m) => m.status === "FUTURO").length;

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                SIG-GCM Brasil
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
                Central de Atualizações
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">
                Roadmap oficial dos módulos, melhorias e futuras expansões do sistema.
                Esta página organiza a evolução do SIG por centrais, status e prioridade.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              <p className="font-bold">Sistema modular</p>
              <p className="text-emerald-200/80">
                Cada município poderá ativar apenas os módulos necessários.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="text-sm text-slate-300">Total</p>
            <p className="text-3xl font-black">{total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="text-sm text-emerald-200">Concluídos</p>
            <p className="text-3xl font-black text-emerald-300">{concluidos}</p>
          </div>
          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
            <p className="text-sm text-yellow-200">Em desenvolvimento</p>
            <p className="text-3xl font-black text-yellow-300">{andamento}</p>
          </div>
          <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4">
            <p className="text-sm text-blue-200">Planejados</p>
            <p className="text-3xl font-black text-blue-300">{planejados}</p>
          </div>
          <div className="rounded-2xl border border-purple-400/20 bg-purple-400/10 p-4">
            <p className="text-sm text-purple-200">Futuros</p>
            <p className="text-3xl font-black text-purple-300">{futuros}</p>
          </div>
        </div>

        <div className="grid gap-5">
          {grupos.map((grupo) => {
            const Icon = grupo.icon;

            return (
              <section
                key={grupo.titulo}
                className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl"
              >
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
                      <Icon size={26} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black">{grupo.titulo}</h2>
                      <p className="mt-1 text-sm text-slate-300">{grupo.descricao}</p>
                    </div>
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                    {grupo.modulos.length} módulos
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {grupo.modulos.map((modulo) => (
                    <div
                      key={modulo.nome}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-emerald-400/40 hover:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-black text-white">{modulo.nome}</h3>
                        <BadgeStatus status={modulo.status} />
                      </div>

                      <p className="mt-3 min-h-[48px] text-sm leading-relaxed text-slate-300">
                        {modulo.descricao}
                      </p>

                      {modulo.rota ? (
                        <Link
                          href={modulo.rota}
                          className="mt-4 inline-flex rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
                        >
                          Abrir módulo
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="mt-4 inline-flex cursor-not-allowed rounded-xl bg-white/10 px-4 py-2 text-sm font-black text-slate-400"
                        >
                          Em breve
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}