"use client";

import Link from "next/link";
import {
  ClipboardList,
  MapPinCheck,
  QrCode,
  ScanLine,
  FileText,
  ArrowLeft,
  MapPin,
} from "lucide-react";

export default function VisitasPatrulhamentoPage() {
  const cards = [
    {
      titulo: "Check-in de Visita",
      descricao: "Registrar presença em ponto visitado durante o patrulhamento.",
      href: "/sistema/patrulhamento/visitas/checkin",
      icone: MapPinCheck,
    },
    {
      titulo: "Gerar QR Code",
      descricao: "Gerar QR Code para pontos de visita cadastrados.",
      href: "/sistema/patrulhamento/visitas/qrcode",
      icone: QrCode,
    },
    {
      titulo: "Ler QR Code",
      descricao: "Escanear QR Code e confirmar presença no local.",
      href: "/sistema/patrulhamento/visitas/ler-qrcode",
      icone: ScanLine,
    },
    {
      titulo: "Relatório de Visitas",
      descricao: "Consultar check-ins, execuções e visitas realizadas.",
      href: "/sistema/patrulhamento/visitas/relatorio",
      icone: FileText,
    },
    {
  titulo: "Pontos de Visita",
  descricao: "Locais com QR Code gerado para check-in preventivo.",
  href: "/sistema/patrulhamento/visitas/pontos",
  icone: MapPin,
}
  ];

  return (
    <main className="min-h-screen bg-[#07152E] p-4 md:p-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/sistema/patrulhamento"
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft size={16} />
          Voltar para Patrulhamento
        </Link>

        <section className="rounded-2xl border border-[#C9A227]/40 bg-[#0D1B34] p-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-[#C9A227]/15 p-3 text-[#C9A227]">
              <ClipboardList size={32} />
            </div>

            <div>
              <h1 className="text-3xl font-black">
                Visitas e Pontos Visitados
              </h1>

              <p className="mt-2 max-w-3xl text-slate-300">
                Área destinada ao registro de presença em locais públicos,
                escolas, órgãos municipais, comércio e pontos comunitários
                durante o patrulhamento.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => {
            const Icone = card.icone;

            return (
              <Link
                key={card.href}
                href={card.href}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-[#C9A227]/70 hover:bg-white/10"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-[#C9A227]/15 p-3 text-[#C9A227]">
                    <Icone size={26} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold">{card.titulo}</h2>
                    <p className="mt-2 text-sm text-slate-300">
                      {card.descricao}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="rounded-2xl border border-blue-500/30 bg-blue-950/30 p-5 text-sm text-blue-100">
          <strong>Conceito oficial:</strong> Patrulhamento é o deslocamento
          operacional com GPS, rota e guarnição. Visita é a confirmação de
          presença em pontos específicos por QR Code ou check-in.
        </section>
      </div>
    </main>
  );
}