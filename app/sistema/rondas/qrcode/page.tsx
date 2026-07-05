"use client";

import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  QrCode,
  ShieldCheck,
} from "lucide-react";

export default function QrCodeRondaPage() {
  const params = useSearchParams();
  const pontoId = params.get("ponto");

  if (!pontoId || !Number.isFinite(Number(pontoId))) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-8">
        <QrCode size={54} />

        <h1 className="text-2xl font-black mt-4">
          Ponto inválido
        </h1>

        <p className="mt-2 text-center">
          Não foi possível gerar o QR Code da ronda.
        </p>
      </div>
    );
  }

  const url = `https://siggcmbrasil.com.br/sistema/rondas/checkin?ponto=${pontoId}`;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-8 print:p-4">
      <div className="print:hidden w-full max-w-md mb-4">
        <Link
          href="/sistema/rondas"
          className="inline-flex items-center gap-2 text-sm font-bold text-black"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>
      </div>

      <div className="border-4 border-black rounded-3xl p-8 flex flex-col items-center max-w-md w-full print:border-2">
        <div className="flex items-center gap-2 mb-2 text-center">
          <ShieldCheck size={34} />

          <h1 className="text-3xl font-black">
            SIG-GCM Brasil
          </h1>
        </div>

        <p className="mb-6 text-center font-bold">
          QR Code de Check-in da Ronda
        </p>

        <div className="bg-white p-3 rounded-xl border border-black">
          <QRCodeCanvas
            value={url}
            size={280}
            level="H"
            includeMargin
          />
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm">
            Escaneie este QR Code para registrar presença no ponto da ronda.
          </p>

          <p className="text-xs font-bold">
            O check-in só será aceito dentro do raio de 200 metros do ponto.
          </p>

          <p className="text-xs">
            Ponto ID: {pontoId}
          </p>

          <p className="text-[10px] break-all border-t border-black pt-2 mt-3">
            {url}
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="mt-6 bg-black text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 print:hidden"
        >
          <Printer size={18} />
          Imprimir QR Code
        </button>
      </div>
    </div>
  );
}