"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function LerQrCodePage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      async (decodedText) => {
        await scanner.stop();
        window.location.href = decodedText;
      },
      () => {}
    );

    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#020b1c] text-white p-6">
      <h1 className="text-3xl font-black mb-2">
        🔳 Ler QR Code
      </h1>

      <p className="text-slate-400 mb-6">
        Aponte a câmera para o QR Code do ponto da ronda.
      </p>

      <div
        id="reader"
        className="overflow-hidden rounded-3xl border border-blue-500 bg-black"
      />
    </div>
  );
}