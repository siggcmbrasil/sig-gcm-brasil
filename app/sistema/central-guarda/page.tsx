import Link from "next/link";
import { ClipboardList, Clock3, CalendarDays, CalendarClock, Fingerprint, FileSpreadsheet, ArrowRight } from "lucide-react";
import CentralPerfil from "@/components/centrais/CentralPerfil";

export default function CentralGuardaPage() {
  return (
    <>
      <div className="bg-[#020b1c] px-4 pt-5 lg:px-7">
        <div className="mx-auto grid w-full max-w-[1700px] gap-4 lg:grid-cols-6">
          <Link
            href="/sistema/ordens-servico"
            className="flex items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 transition hover:border-cyan-400/35"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-white">Minhas Ordens de Serviço</p>
              <p className="mt-1 text-sm text-slate-400">Consulte missões e confirme ciência.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-cyan-300" />
          </Link>

          <Link
            href="/sistema/banco-horas"
            className="flex items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 transition hover:border-cyan-400/35"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
              <Clock3 className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-white">Meu Banco de Horas</p>
              <p className="mt-1 text-sm text-slate-400">Consulte o saldo e solicite compensação.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-cyan-300" />
          </Link>
          <Link
            href="/sistema/escalas/ferias-licencas"
            className="flex items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 transition hover:border-cyan-400/35"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-white">Minhas Férias e Licenças</p>
              <p className="mt-1 text-sm text-slate-400">Consulte períodos e acompanhe solicitações.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-cyan-300" />
          </Link>
          <Link
            href="/sistema/escalas/extras"
            className="flex items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 transition hover:border-cyan-400/35"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
              <CalendarClock className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-white">Escalas Extraordinárias</p>
              <p className="mt-1 text-sm text-slate-400">Consulte convocações e confirme participação.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-cyan-300" />
          </Link>
          <Link
            href="/sistema/ponto-eletronico"
            className="flex items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 transition hover:border-cyan-400/35"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
              <Fingerprint className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-white">Registrar Ponto</p>
              <p className="mt-1 text-sm text-slate-400">Registre entrada e saída usando GPS.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-cyan-300" />
          </Link>
          <Link
            href="/sistema/folha-ponto"
            className="flex items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 transition hover:border-cyan-400/35"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-white">Minha Folha de Ponto</p>
              <p className="mt-1 text-sm text-slate-400">Consulte, exporte e assine seu espelho mensal.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-cyan-300" />
          </Link>




        </div>
      </div>
      <CentralPerfil tipo="GUARDA" />
    </>
  );
}
