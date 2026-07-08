"use client";

import { useSearchParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

export default function ImprimirQrCodeVisitaPage() {
  const params = useSearchParams();

  const ponto = params.get("ponto") || "";
  const local = params.get("local") || "";
  const brasao = params.get("brasao") || "";

  const url = `https://siggcmbrasil.com.br/sistema/patrulhamento/visitas/checkin?ponto=${ponto}`;

  return (
    <main className="print-area">
      <div className="marca-dagua">
        <img src="/brasoes/sig-gcm-logo.png" alt="" />
      </div>

      <div className="topo">
        <img src="/brasoes/sig-gcm-logo.png" alt="SIG-GCM Brasil" />

        {brasao && (
          <img src={brasao} alt="Brasão da Guarda Municipal" />
        )}
      </div>

      <h1>SIG-GCM Brasil</h1>
      <h2>QR Code de Check-in de Visita</h2>

      <QRCodeCanvas value={url} size={320} level="H" includeMargin />

      <p className="local">{local}</p>
      <p className="url">{url}</p>

      <script
        dangerouslySetInnerHTML={{
          __html: "setTimeout(() => window.print(), 300);",
        }}
      />

      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          background: white;
          overflow: hidden;
        }

        .print-area {
          width: 210mm;
          height: 297mm;
          box-sizing: border-box;
          padding: 22mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          overflow: hidden;
          font-family: Arial, sans-serif;
          color: #000;
        }

        .topo {
          display: flex;
          gap: 18px;
          align-items: center;
          justify-content: center;
          margin-bottom: 8mm;
        }

        .topo img {
          width: 22mm;
          height: 22mm;
          object-fit: contain;
        }

        .marca-dagua {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.05;
          z-index: 0;
        }

        .marca-dagua img {
          width: 120mm;
          height: 120mm;
          object-fit: contain;
        }

        h1,
        h2,
        canvas,
        p,
        .topo {
          position: relative;
          z-index: 2;
        }

        h1 {
          font-size: 22px;
          margin: 0;
          font-weight: 900;
        }

        h2 {
          font-size: 14px;
          margin: 4px 0 12mm;
          font-weight: 700;
        }

        canvas {
          width: 90mm !important;
          height: 90mm !important;
        }

        .local {
          margin-top: 8mm;
          font-size: 14px;
          font-weight: 700;
        }

        .url {
          margin-top: 2mm;
          font-size: 9px;
          max-width: 160mm;
          word-break: break-all;
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: 210mm;
            height: 297mm;
            overflow: hidden;
          }

          .print-area {
            page-break-after: avoid;
            page-break-before: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}