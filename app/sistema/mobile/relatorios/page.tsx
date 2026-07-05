"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  Printer,
  FileSpreadsheet,
} from "lucide-react";

import MobileBottomNav from "@/components/MobileBottomNav";

export default function RelatoriosMobilePage() {
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) {
      window.location.href = "/login";
      return;
    }

    const dados = JSON.parse(salvo);

    if (!dados?.id || !dados?.municipio_id) {
      window.location.href = "/login";
      return;
    }

    setUsuario(dados);
  }, []);

  return (
    <main className="min-h-screen bg-[#02060f] text-white p-4 pb-28">
      <header className="mb-6">
        <Link
          href="/sistema/mobile"
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-2 text-sm mb-5 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <section className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
          <p className="text-blue-400 text-sm font-bold">
            {usuario?.municipio_nome || "SIG-GCM Brasil"}
          </p>

          <h1 className="text-3xl font-black mt-1">
            Relatórios
          </h1>

          <p className="text-slate-400 text-sm mt-2">
            Relatórios operacionais e documentos gerados pelo sistema.
          </p>
        </section>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/sistema/relatorios/plantao"
          className="rounded-3xl bg-purple-600 p-5 min-h-36 flex flex-col items-center justify-center text-center active:scale-95"
        >
          <ClipboardList className="w-12 h-12 mb-3" />
          <span className="font-black">
            Plantão
          </span>
        </Link>

        <Link
          href="/sistema/pdfs"
          className="rounded-3xl bg-slate-900 border border-slate-800 p-5 min-h-36 flex flex-col items-center justify-center text-center active:scale-95"
        >
          <FileText className="w-12 h-12 mb-3 text-cyan-400" />
          <span className="font-black">
            PDFs
          </span>
        </Link>

        <Link
          href="/sistema/relatorios"
          className="rounded-3xl bg-slate-900 border border-slate-800 p-5 min-h-36 flex flex-col items-center justify-center text-center active:scale-95"
        >
          <FileSpreadsheet className="w-12 h-12 mb-3 text-emerald-400" />
          <span className="font-black">
            Relatórios
          </span>
        </Link>

        <Link
          href="/sistema/pdfs"
          className="rounded-3xl bg-slate-900 border border-slate-800 p-5 min-h-36 flex flex-col items-center justify-center text-center active:scale-95"
        >
          <Printer className="w-12 h-12 mb-3 text-yellow-400" />
          <span className="font-black">
            Impressões
          </span>
        </Link>
      </div>

      <div className="mt-5 rounded-3xl border border-purple-500/20 bg-purple-500/10 p-5">
        <h3 className="font-black text-purple-300">
          Relatórios Operacionais
        </h3>

        <p className="text-sm text-slate-300 mt-2">
          Gere relatórios de plantão, ocorrências, patrulhamentos,
          chamados e documentos institucionais diretamente pelo celular.
        </p>
      </div>

      <MobileBottomNav />
    </main>
  );
}