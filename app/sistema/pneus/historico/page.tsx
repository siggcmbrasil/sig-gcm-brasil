"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HistoricoPneusPage() {
  const [historico, setHistorico] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    setCarregando(true);

    const { data } = await supabase
      .from("historico_pneus")
      .select(`
        *,
        pneus_viaturas(codigo, marca, modelo),
        viaturas(prefixo, placa)
      `)
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setHistorico(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    if (usuario?.municipio_id) {
      carregar();
    }
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black">
          📋 Histórico de Pneus
        </h1>

        <p className="text-slate-400 mt-2">
          Todas as movimentações realizadas nos pneus da frota.
        </p>
      </div>

      {carregando ? (
        <div className="painel-premium p-6">
          Carregando...
        </div>
      ) : historico.length === 0 ? (
        <div className="painel-premium p-10 text-center">
          <p className="text-6xl mb-3">🛞</p>

          <h2 className="text-xl font-black">
            Nenhuma movimentação encontrada
          </h2>

          <p className="text-slate-400 mt-2">
            O histórico aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {historico.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5"
            >
              <div className="flex justify-between">
                <div>
                  <p className="text-slate-400 text-sm">
                    {item.viaturas?.prefixo || "Sem viatura"}
                  </p>

                  <h2 className="text-xl font-black">
                    🛞 {item.pneus_viaturas?.codigo}
                  </h2>
                </div>

                <span className="bg-blue-900 text-blue-300 px-3 py-1 rounded-full text-xs font-bold">
                  {item.tipo}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <Info
                  titulo="De"
                  valor={item.posicao_anterior || "-"}
                />

                <Info
                  titulo="Para"
                  valor={item.posicao_nova || "-"}
                />

                <Info
                  titulo="KM"
                  valor={item.km || "-"}
                />

                <Info
                  titulo="Placa"
                  valor={item.viaturas?.placa || "-"}
                />
              </div>

              {item.observacao && (
                <p className="text-slate-300 text-sm mt-4">
                  {item.observacao}
                </p>
              )}

              <p className="text-xs text-slate-500 mt-4">
                {new Date(item.criado_em).toLocaleString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      )}
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
    <div className="rounded-xl bg-slate-900 p-3">
      <p className="text-slate-500 text-xs">
        {titulo}
      </p>

      <p className="font-bold text-sm">
        {valor}
      </p>
    </div>
  );
}