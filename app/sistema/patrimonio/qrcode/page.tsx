"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function QrCodePatrimonioPage() {
  const [itens, setItens] = useState<any[]>([]);
  const [itemId, setItemId] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    if (!usuario?.municipio_id) return;

    const { data } = await supabase
      .from("patrimonios")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("nome");

    setItens(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  const itemSelecionado = itens.find((item) => String(item.id) === itemId);

  const textoQr = itemSelecionado
    ? `SIG-GCM BRASIL | PATRIMÔNIO: ${
        itemSelecionado.numero_patrimonio || "N/I"
      } | ITEM: ${itemSelecionado.nome} | CATEGORIA: ${
        itemSelecionado.categoria
      } | STATUS: ${itemSelecionado.status} | MUNICÍPIO: ${
        usuario.municipio_id
      }`
    : "";

  const qrUrl = textoQr
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
        textoQr
      )}`
    : "";

  function imprimirEtiqueta() {
    window.print();
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6 no-print">
        <h1 className="text-2xl md:text-3xl font-black text-white">
          🔳 QR Code Patrimonial
        </h1>

        <p className="text-slate-400 mt-2">
          Gere etiquetas QR Code para identificação rápida dos bens patrimoniais.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1 no-print">
          <h2 className="text-xl font-black text-white">
            Selecionar Item
          </h2>

          <p className="text-slate-400 text-sm mb-5">
            Escolha um bem patrimonial para gerar a etiqueta.
          </p>

          <div className="space-y-4">
            <div>
              <label className="label">Item patrimonial</label>
              <select
                className="input"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
              >
                <option value="">Selecione o item</option>

                {itens.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome} • {item.numero_patrimonio || "Sem patrimônio"}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={imprimirEtiqueta}
              disabled={!itemSelecionado}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              Imprimir Etiqueta
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {!itemSelecionado ? (
            <div className="painel-premium p-10 text-center no-print">
              <p className="text-6xl mb-3">🔳</p>

              <h2 className="text-white text-xl font-black">
                Nenhum item selecionado
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                Selecione um patrimônio para gerar o QR Code.
              </p>
            </div>
          ) : (
            <div className="painel-premium p-6">
              <div className="bg-white text-black rounded-3xl p-8 max-w-md mx-auto text-center">
                <p className="text-xs font-bold tracking-widest">
                  SIG-GCM BRASIL
                </p>

                <h2 className="text-2xl font-black mt-2">
                  PATRIMÔNIO
                </h2>

                <div className="flex justify-center my-6">
                  <img
                    src={qrUrl}
                    alt="QR Code do patrimônio"
                    className="w-[260px] h-[260px]"
                  />
                </div>

                <p className="text-xl font-black">
                  {itemSelecionado.numero_patrimonio || "SEM Nº"}
                </p>

                <p className="text-sm font-bold mt-2">
                  {itemSelecionado.nome}
                </p>

                <p className="text-xs mt-1">
                  {itemSelecionado.categoria} • {itemSelecionado.status}
                </p>

                <p className="text-xs mt-4 border-t pt-3">
                  Escaneie para identificação do bem patrimonial.
                </p>
              </div>

              <div className="no-print mt-6 grid md:grid-cols-2 gap-4">
                <Info
                  titulo="Nome"
                  valor={itemSelecionado.nome || "N/I"}
                />

                <Info
                  titulo="Patrimônio"
                  valor={itemSelecionado.numero_patrimonio || "N/I"}
                />

                <Info
                  titulo="Categoria"
                  valor={itemSelecionado.categoria || "N/I"}
                />

                <Info
                  titulo="Local"
                  valor={itemSelecionado.local || "N/I"}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .painel-premium {
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function Info({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-3">
      <p className="text-slate-500 text-xs">{titulo}</p>
      <p className="text-slate-200 font-bold text-sm">{valor}</p>
    </div>
  );
}