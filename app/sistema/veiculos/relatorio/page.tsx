"use client";

import { useEffect, useState } from "react";
import { BarChart3, CarFront, FileText, ShieldAlert } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type Veiculo = {
  id: number;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  cor: string | null;
  ano: string | null;
  situacao: string | null;
  proprietario: string | null;
  condutor: string | null;
  created_at?: string | null;
};

export default function RelatorioVeiculosPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("veiculos_abordados")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false });

    setCarregando(false);

    if (error) {
      console.error(error);
      alert("Erro ao carregar relatório.");
      return;
    }

    setVeiculos(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  const total = veiculos.length;
  const comPlaca = veiculos.filter((v) => v.placa).length;
  const semPlaca = veiculos.filter((v) => !v.placa).length;
  const apreendidos = veiculos.filter(
    (v) => v.situacao === "APREENDIDO"
  ).length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Relatório de Veículos"
        subtitulo="Resumo dos veículos abordados e registros operacionais."
        icone={FileText}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SigCard>
          <CarFront className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-slate-400 text-sm">Total</p>
          <h2 className="text-4xl font-black text-white mt-2">{total}</h2>
        </SigCard>

        <SigCard>
          <BarChart3 className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-slate-400 text-sm">Com placa</p>
          <h2 className="text-4xl font-black text-cyan-400 mt-2">
            {comPlaca}
          </h2>
        </SigCard>

        <SigCard>
          <ShieldAlert className="w-8 h-8 text-yellow-400 mb-3" />
          <p className="text-slate-400 text-sm">Sem placa</p>
          <h2 className="text-4xl font-black text-yellow-400 mt-2">
            {semPlaca}
          </h2>
        </SigCard>

        <SigCard>
          <ShieldAlert className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-slate-400 text-sm">Apreendidos</p>
          <h2 className="text-4xl font-black text-red-400 mt-2">
            {apreendidos}
          </h2>
        </SigCard>
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Últimos veículos registrados
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando...</p>
        ) : veiculos.length === 0 ? (
          <p className="text-slate-400">Nenhum veículo registrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="text-left py-3">Placa</th>
                  <th className="text-left py-3">Veículo</th>
                  <th className="text-left py-3">Cor</th>
                  <th className="text-left py-3">Ano</th>
                  <th className="text-left py-3">Situação</th>
                  <th className="text-left py-3">Condutor</th>
                </tr>
              </thead>

              <tbody>
                {veiculos.slice(0, 30).map((v) => (
                  <tr key={v.id} className="border-b border-slate-900">
                    <td className="py-3 font-black text-cyan-400">
                      {v.placa || "-"}
                    </td>

                    <td className="text-white">
                      {[v.marca, v.modelo].filter(Boolean).join(" ") || "-"}
                    </td>

                    <td className="text-slate-400">{v.cor || "-"}</td>

                    <td className="text-slate-400">{v.ano || "-"}</td>

                    <td className="text-slate-300">
                      {v.situacao || "ABORDADO"}
                    </td>

                    <td className="text-slate-400">
                      {v.condutor || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SigCard>
    </div>
  );
}