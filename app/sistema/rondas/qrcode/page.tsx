"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useSearchParams } from "next/navigation";
import { Printer, QrCode, ShieldCheck } from "lucide-react";

export default function QrCodeRondaPage() {
  const params = useSearchParams();
  const pontoId = params.get("ponto");

  if (!pontoId) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-black">Ponto inválido</h1>
        <p className="mt-2">Não foi possível gerar o QR Code.</p>
      </div>
    );
  }

  const url = `https://siggcmbrasil.com.br/sistema/rondas/checkin?ponto=${pontoId}`;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-8 print:p-4">
      <div className="border-4 border-black rounded-3xl p-8 flex flex-col items-center max-w-md w-full print:border-2">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={34} />
          <h1 className="text-3xl font-black">
            SIG-GCM Brasil
          </h1>
        </div>

        <p className="mb-6 text-center font-bold">
          QR Code de Check-in da Ronda
        </p>

        <QRCodeCanvas value={url} size={280} />

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
        </div>

        <button
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