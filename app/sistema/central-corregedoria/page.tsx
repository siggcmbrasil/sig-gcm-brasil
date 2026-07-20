import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  FileSearch,
  FileText,
  FolderLock,
  Gavel,
  Headphones,
  Scale,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

type ModuloCorregedoria = {
  titulo: string;
  descricao: string;
  href: string;
  icone: LucideIcon;
};

type IndicadorCorregedoria = {
  titulo: string;
  valor: string;
  icone: LucideIcon;
};

const modulos: ModuloCorregedoria[] = [
  {
    titulo: "Sindicâncias e PAD",
    descricao:
      "Instauração, instrução, envolvidos, documentos, decisões e arquivamento.",
    href: "/sistema/corregedoria/processos",
    icone: FolderLock,
  },
  {
    titulo: "Denúncias Internas",
    descricao:
      "Recebimento reservado, triagem, classificação, encaminhamento e sigilo.",
    href: "/sistema/corregedoria/denuncias",
    icone: ShieldAlert,
  },
  {
    titulo: "Oitivas e Depoimentos",
    descricao:
      "Agendamento, termos, participantes, gravações e registro das oitivas.",
    href: "/sistema/corregedoria/oitivas",
    icone: Headphones,
  },
  {
    titulo: "Prazos Processuais",
    descricao:
      "Controle de vencimentos, alertas, suspensões, prorrogações e responsáveis.",
    href: "/sistema/corregedoria/prazos",
    icone: CalendarClock,
  },
  {
    titulo: "Medidas Cautelares",
    descricao:
      "Afastamentos, restrições, recolhimentos e decisões cautelares.",
    href: "/sistema/corregedoria/medidas",
    icone: Gavel,
  },
  {
    titulo: "Relatórios Correcionais",
    descricao:
      "Indicadores, produtividade, prazos, decisões e relatórios gerenciais.",
    href: "/sistema/corregedoria/relatorios",
    icone: FileText,
  },
];

const indicadores: IndicadorCorregedoria[] = [
  {
    titulo: "Sigilo",
    valor: "RLS + perfil",
    icone: ShieldCheck,
  },
  {
    titulo: "Auditoria",
    valor: "Imutável",
    icone: FileSearch,
  },
  {
    titulo: "Prazos",
    valor: "Monitorados",
    icone: CalendarClock,
  },
  {
    titulo: "Decisões",
    valor: "Rastreáveis",
    icone: Gavel,
  },
];

export default function CentralCorregedoriaPage() {
  return (
    <main className="min-h-screen bg-[#020817] px-4 py-5 text-white lg:px-8">
      <div className="mx-auto max-w-[1750px] space-y-5">
        <header className="rounded-[30px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.16),transparent_34%),linear-gradient(135deg,#07152e,#020817)] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
              <Scale className="h-8 w-8" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[.22em] text-cyan-300">
                ÁREA RESTRITA
              </p>

              <h1 className="mt-1 text-3xl font-black">
                Central da Corregedoria
              </h1>

              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
                Gestão reservada de denúncias, apurações, sindicâncias,
                processos administrativos disciplinares, oitivas, medidas
                cautelares, prazos e decisões.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {indicadores.map((indicador) => {
            const Icone = indicador.icone;

            return (
              <div
                key={indicador.titulo}
                className="rounded-3xl border border-white/10 bg-[#071225] p-5"
              >
                <Icone className="h-6 w-6 text-cyan-300" />

                <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-500">
                  {indicador.titulo}
                </p>

                <p className="mt-1 text-xl font-black">
                  {indicador.valor}
                </p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modulos.map((modulo) => {
            const Icone = modulo.icone;

            return (
              <Link
                key={modulo.href}
                href={modulo.href}
                className="group rounded-3xl border border-white/10 bg-[#071225] p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                    <Icone className="h-6 w-6" />
                  </div>

                  <ArrowRight className="h-5 w-5 text-slate-600 transition group-hover:text-cyan-300" />
                </div>

                <h2 className="mt-5 text-lg font-black">
                  {modulo.titulo}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {modulo.descricao}
                </p>
              </Link>
            );
          })}
        </section>

        <section className="flex items-start gap-3 rounded-3xl border border-amber-400/20 bg-amber-400/[0.06] p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />

          <div>
            <p className="font-black text-amber-200">
              Conteúdo restrito
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-100/70">
              O acesso deve ser limitado aos perfis autorizados. Consultas,
              alterações, downloads e decisões ficam registrados na auditoria.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
