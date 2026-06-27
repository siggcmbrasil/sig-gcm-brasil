import SIGIAChat from "@/components/sigia/SIGIAChat";
import Link from "next/link";

export default function SIGIAPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="rounded-2xl border border-blue-900/60 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-yellow-400">
                Inteligência Operacional
              </p>

              <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
                SIGIA
              </h1>

              <p className="text-slate-300 text-sm mt-2 max-w-3xl">
                Assistente inteligente do SIG-GCM Brasil para apoio operacional,
                jurídico, relatórios, documentos e consulta à base de conhecimento.
              </p>
            </div>

            <Link
              href="/sistema/sigia/biblioteca"
              className="rounded-xl bg-yellow-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-yellow-400 transition text-center"
            >
              📚 Biblioteca Inteligente
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSIGIA
            titulo="IA Operacional"
            descricao="Apoio em ocorrências, patrulhamento, guarnições e rotina de plantão."
            icone="🚔"
          />

          <CardSIGIA
            titulo="IA Jurídica"
            descricao="Consulta legislação, artigos, fundamentos e orientações jurídicas."
            icone="⚖️"
          />

          <CardSIGIA
            titulo="Relatórios"
            descricao="Ajuda a gerar resumos, análises e documentos operacionais."
            icone="📑"
          />

          <CardSIGIA
            titulo="Base de Conhecimento"
            descricao="Consulta documentos, PDFs, POPs, manuais e materiais internos."
            icone="🧠"
          />
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl overflow-hidden">
          <SIGIAChat />
        </section>
      </div>
    </main>
  );
}

function CardSIGIA({
  titulo,
  descricao,
  icone,
}: {
  titulo: string;
  descricao: string;
  icone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
      <div className="text-3xl mb-3">{icone}</div>
      <h2 className="font-bold text-white">{titulo}</h2>
      <p className="text-sm text-slate-400 mt-2">{descricao}</p>
    </div>
  );
}