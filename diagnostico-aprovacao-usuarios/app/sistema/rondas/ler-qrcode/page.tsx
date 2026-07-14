"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  QrCode,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

const READER_ID = "reader";

export default function LerQrCodePage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lendoRef = useRef(false);

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [lendo, setLendo] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function iniciarScanner() {
      try {
        setErro("");
        setCarregando(true);

        const scanner = new Html5Qrcode(READER_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: {
              width: 260,
              height: 260,
            },
          },
          async (decodedText) => {
            if (lendoRef.current) return;

            lendoRef.current = true;
            setLendo(true);

            try {
              await scanner.stop();
            } catch {}

            const urlValida =
              decodedText.includes("/sistema/rondas/checkin") &&
              decodedText.includes("ponto=");

            if (!urlValida) {
              alert("QR Code inválido para ronda.");
              window.location.reload();
              return;
            }

            window.location.href = decodedText;
          },
          () => {}
        );

        if (ativo) {
          setCarregando(false);
        }
      } catch (error) {
        console.error(error);

        if (ativo) {
          setErro(
            "Não foi possível acessar a câmera. Verifique a permissão do navegador."
          );
          setCarregando(false);
        }
      }
    }

    void iniciarScanner();

    return () => {
      ativo = false;

      const scanner = scannerRef.current;

      if (scanner) {
        scanner
  .stop()
  .catch(() => {})
  .finally(() => {
    try {
      scanner.clear();
    } catch {}
  });
      }
    };
  }, []);

  function reiniciar() {
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-[#020b1c] text-white p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <Link
          href="/sistema/rondas"
          className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300"
        >
          <ArrowLeft size={18} />
          Voltar para Rondas
        </Link>

        <div>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <QrCode className="text-blue-400" size={34} />
            Ler QR Code
          </h1>

          <p className="text-slate-400">
            Aponte a câmera para o QR Code do ponto da ronda.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/30 p-4 flex gap-3">
          <Camera className="text-blue-400 shrink-0 mt-1" size={22} />

          <p className="text-slate-300 text-sm">
            Use a câmera traseira do celular. Após a leitura, o sistema abrirá
            automaticamente a tela de check-in do ponto.
          </p>
        </div>

        {carregando && (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-center gap-2 text-yellow-300 font-bold">
            <Camera size={18} />
            Iniciando câmera...
          </div>
        )}

        {lendo && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 flex items-center gap-2 text-green-300 font-bold">
            <QrCode size={18} />
            QR Code lido. Redirecionando...
          </div>
        )}

        {erro && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-2 text-red-300 font-bold">
            <AlertTriangle size={18} />
            {erro}
          </div>
        )}

        <div
          id={READER_ID}
          className="overflow-hidden rounded-3xl border border-blue-500 bg-black min-h-[320px]"
        />

        <button
          type="button"
          onClick={reiniciar}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-4 font-black text-white hover:bg-blue-600"
        >
          <RefreshCw size={18} />
          Reiniciar Leitor
        </button>
      </div>
    </div>
  );
}