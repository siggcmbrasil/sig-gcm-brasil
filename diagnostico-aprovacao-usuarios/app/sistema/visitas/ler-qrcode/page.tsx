"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { AlertTriangle, Camera, QrCode } from "lucide-react";

export default function LerQrCodeVisitaPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function iniciarScanner() {
      try {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            try {
              await scanner.stop();
            } catch {}

            if (!decodedText.includes("/sistema/visitas/checkin")) {
              alert("QR Code inválido para visita.");
              window.location.reload();
              return;
            }

            window.location.href = decodedText;
          },
          () => {}
        );

        if (ativo) setCarregando(false);
      } catch (error) {
        console.error(error);
        if (ativo) {
          setErro("Não foi possível acessar a câmera.");
          setCarregando(false);
        }
      }
    }

    iniciarScanner();

    return () => {
      ativo = false;

      try {
        scannerRef.current?.stop();
      } catch {}

      try {
        scannerRef.current?.clear();
      } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#020b1c] text-white p-6">
      <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
        <QrCode className="text-cyan-400" size={34} />
        Ler QR Code da Visita
      </h1>

      <p className="text-slate-400 mb-6">
        Aponte a câmera para o QR Code do órgão, escola, comércio ou ponto de visita.
      </p>

      {carregando && (
        <div className="mb-4 flex items-center gap-2 text-yellow-400">
          <Camera size={18} />
          Iniciando câmera...
        </div>
      )}

      {erro && (
        <div className="mb-4 flex items-center gap-2 text-red-400">
          <AlertTriangle size={18} />
          {erro}
        </div>
      )}

      <div
        id="reader"
        className="overflow-hidden rounded-3xl border border-cyan-500 bg-black"
      />
    </div>
  );
}