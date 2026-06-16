"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useSearchParams } from "next/navigation";

export default function QrCodeRondaPage() {
  const params = useSearchParams();
  const pontoId = params.get("ponto");

  const url = `https://siggcmbrasil.com.br/sistema/rondas/checkin?ponto=${pontoId}`;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-black mb-2">
        SIG-GCM Brasil
      </h1>

      <p className="mb-6 text-center">
        QR Code de Check-in da Ronda
      </p>

      <QRCodeCanvas value={url} size={280} />

      <p className="mt-6 text-sm text-center">
        Escaneie este QR Code para registrar presença no ponto da ronda.
      </p>

      <button
        onClick={() => window.print()}
        className="mt-6 bg-black text-white px-6 py-3 rounded-lg font-bold"
      >
        🖨️ Imprimir QR Code
      </button>
    </div>
  );
}