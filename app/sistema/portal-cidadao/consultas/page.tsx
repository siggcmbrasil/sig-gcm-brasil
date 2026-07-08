"use client";

import Link from "next/link";

export default function ConsultasPortalCidadaoPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
          <p className="text-sm font-semibold text-emerald-400">
            Portal do Cidadão
          </p>

          <h1 className="mt-2 text-2xl md:text-3xl font-bold">
            Consultas do Cidadão
          </h1>

          <p className="mt-3 text-slate-300">
            Área reservada para futuras consultas públicas autorizadas,
            acompanhamento de solicitações e serviços disponíveis ao cidadão.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold">Protocolo</h2>
            <p className="mt-2 text-sm text-slate-400">
              Consulta futura por número de protocolo.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold">Solicitações</h2>
            <p className="mt-2 text-sm text-slate-400">
              Acompanhamento de pedidos enviados pelo cidadão.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold">Serviços</h2>
            <p className="mt-2 text-sm text-slate-400">
              Serviços públicos integrados ao SIG-GCM Brasil.
            </p>
          </div>
        </section>

        <Link
          href="/sistema/portal-cidadao"
          className="inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
        >
          Voltar ao Portal do Cidadão
        </Link>
      </div>
    </main>
  );
}