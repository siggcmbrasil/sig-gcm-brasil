import Link from "next/link";
import {
  CalendarDays,
  CalendarRange,
  ChevronRight,
  Clock3,
  Repeat,
  Settings,
  ShieldCheck,
  Star,
  Umbrella,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";

const navegacao = [
  {
    titulo: "Escala",
    href: "/sistema/escalas/escala-mensal",
    icone: CalendarRange,
    classe:
      "border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20",
  },
  {
    titulo: "Guarnições",
    href: "/sistema/escalas/guarnicoes",
    icone: ShieldCheck,
    classe:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
  },
  {
    titulo: "Permutas",
    href: "/sistema/escalas/permutas",
    icone: Repeat,
    classe:
      "border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20",
  },
  {
    titulo: "Extras",
    href: "/sistema/escalas/extras",
    icone: Star,
    classe:
      "border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20",
  },
  {
    titulo: "Férias e licenças",
    href: "/sistema/ferias-licencas",
    icone: Umbrella,
    classe:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20",
  },
  {
    titulo: "Configurações",
    href: "/sistema/escalas/configuracao",
    icone: Settings,
    classe:
      "border-slate-600 bg-slate-800/70 text-slate-300 hover:bg-slate-800",
  },
];

const atalhos = [
  {
    titulo: "Escala operacional",
    descricao: "Consultar plantões individuais",
    href: "/sistema/escalas/operacional",
    icone: CalendarDays,
  },
  {
    titulo: "Guarnição do dia",
    descricao: "Ver equipe do plantão atual",
    href: "/sistema/escalas/guarnicao-dia",
    icone: Users,
  },
  {
    titulo: "Mapa de efetivo",
    descricao: "Disponíveis, escalados e afastados",
    href: "/sistema/escalas/mapa-efetivo",
    icone: Users,
  },
  {
    titulo: "Escala administrativa",
    descricao: "Expediente e horários fixos",
    href: "/sistema/escalas/administrativo",
    icone: Clock3,
  },
];

export default function EscalasPage() {
  return (
    <ProtecaoModulo modulo="escalas">
      <main className="min-h-screen p-4 pb-24 text-white md:p-6">
        <header className="border-b border-slate-800 pb-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
            Gestão operacional
          </p>

          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            Central de Escalas
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-400 md:text-base">
            Escalas, guarnições, permutas, serviços extras e
            afastamentos em uma navegação simples.
          </p>
        </header>

        <nav className="-mx-4 overflow-x-auto border-b border-slate-800 px-4 py-4 md:mx-0 md:px-0">
          <div className="flex min-w-max gap-2">
            {navegacao.map((item) => {
              const Icone = item.icone;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-sm font-black transition ${item.classe}`}
                >
                  <Icone className="h-5 w-5" />
                  {item.titulo}
                </Link>
              );
            })}
          </div>
        </nav>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-blue-500/25 bg-slate-950/70">
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-blue-300">
                    Plantão atual
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Escala de hoje
                  </h2>
                </div>

                <Link
                  href="/sistema/escalas/guarnicao-dia"
                  className="text-sm font-bold text-blue-300 hover:text-blue-200"
                >
                  Ver equipe
                </Link>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-3">
                <Informacao
                  titulo="Guarnição"
                  valor="Consultar equipe atual"
                  destaque="text-emerald-300"
                />

                <Informacao
                  titulo="Horário"
                  valor="07:00 às 07:00"
                  destaque="text-blue-300"
                />

                <Informacao
                  titulo="Situação"
                  valor="Acompanhar plantão"
                  destaque="text-cyan-300"
                />
              </div>

              <div className="border-t border-slate-800 p-4">
                <Link
                  href="/sistema/escalas/escala-mensal"
                  className="flex items-center justify-between rounded-xl bg-blue-500/10 px-4 py-3 font-bold text-blue-300 hover:bg-blue-500/20"
                >
                  Abrir calendário mensal
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70">
              <div className="border-b border-slate-800 px-5 py-4">
                <h2 className="text-xl font-black">
                  Ações rápidas
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Abra diretamente a função necessária.
                </p>
              </div>

              <div className="divide-y divide-slate-800">
                {atalhos.map((item) => {
                  const Icone = item.icone;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-900/80"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900">
                        <Icone className="h-5 w-5 text-slate-300" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-black text-white">
                          {item.titulo}
                        </p>

                        <p className="truncate text-sm text-slate-400">
                          {item.descricao}
                        </p>
                      </div>

                      <ChevronRight className="h-5 w-5 shrink-0 text-slate-600" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5">
              <div className="border-b border-red-500/15 px-5 py-4">
                <p className="text-xs font-black uppercase tracking-wider text-red-300">
                  Atenção
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Pendências
                </h2>
              </div>

              <div className="divide-y divide-red-500/10">
                <Pendencia
                  titulo="Férias e licenças"
                  descricao="Consultar afastamentos ativos"
                  href="/sistema/ferias-licencas"
                  classe="text-yellow-300"
                />

                <Pendencia
                  titulo="Permutas"
                  descricao="Ver solicitações aguardando decisão"
                  href="/sistema/escalas/permutas"
                  classe="text-violet-300"
                />

                <Pendencia
                  titulo="Mapa de efetivo"
                  descricao="Verificar guardas disponíveis"
                  href="/sistema/escalas/mapa-efetivo"
                  classe="text-red-300"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <ShieldCheck className="h-8 w-8 text-emerald-300" />

              <h2 className="mt-4 text-xl font-black">
                Guarnições
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Organize comandantes, motoristas, patrulheiros e
                viaturas em uma tela própria.
              </p>

              <Link
                href="/sistema/guarnicoes"
                className="mt-5 flex items-center justify-between rounded-xl bg-emerald-500/10 px-4 py-3 font-bold text-emerald-300 hover:bg-emerald-500/20"
              >
                Abrir guarnições
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </ProtecaoModulo>
  );
}

function Informacao({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;
  valor: string;
  destaque: string;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {titulo}
      </p>

      <p className={`mt-2 font-black ${destaque}`}>
        {valor}
      </p>
    </div>
  );
}

function Pendencia({
  titulo,
  descricao,
  href,
  classe,
}: {
  titulo: string;
  descricao: string;
  href: string;
  classe: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-red-500/5"
    >
      <div>
        <p className={`font-black ${classe}`}>
          {titulo}
        </p>

        <p className="mt-1 text-sm text-slate-400">
          {descricao}
        </p>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-slate-600" />
    </Link>
  );
}