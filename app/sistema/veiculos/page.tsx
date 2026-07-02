"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CarFront, Plus, Search, Trash2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import { registrarAuditoria } from "@/lib/auditoria";

type Veiculo = {
  id: number;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  ano: string | null;
  cor: string | null;
  renavam: string | null;
  chassi: string | null;
  proprietario: string | null;
  cpf_proprietario: string | null;
  telefone_proprietario: string | null;
  tipo_especie: string | null;
  situacao: string | null;
  condutor: string | null;
  documento: string | null;
  local: string | null;
  data: string | null;
  hora: string | null;
  observacao: string | null;
};

export default function VeiculosAbordadosPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";
  const podeEditar = perfilUsuario !== "CONSULTA";

  async function carregarVeiculos() {
    if (!usuarioLogado?.municipio_id) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase
      .from("veiculos_abordados")
      .select("*")
      .eq("municipio_id", usuarioLogado.municipio_id)
      .order("id", { ascending: false });

    setCarregando(false);

    if (error) {
      console.error(error);
      alert("Erro ao carregar veículos.");
      return;
    }

    setVeiculos(data || []);
  }

  async function excluirVeiculo(id: number) {
  if (!podeEditar) {
    alert("Você não possui permissão para excluir veículos.");
    return;
  }

  const confirmar = confirm("Deseja excluir este registro?");
  if (!confirmar) return;

  const veiculo = veiculos.find((v) => v.id === id);

  const { error } = await supabase
    .from("veiculos_abordados")
    .delete()
    .eq("id", id)
    .eq("municipio_id", usuarioLogado.municipio_id);

  if (error) {
    console.error(error);
    alert("Erro ao excluir veículo.");
    return;
  }

  await registrarAuditoria({
    modulo: "Veículos",
    acao: "EXCLUIR",
    descricao: `Excluiu o veículo ${
      veiculo?.placa || veiculo?.modelo || id
    }.`,
  });

  carregarVeiculos();
}

  useEffect(() => {
    carregarVeiculos();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];

  const veiculosFiltrados = veiculos.filter((veiculo) => {
    const texto = `
      ${veiculo.placa || ""}
      ${veiculo.marca || ""}
      ${veiculo.modelo || ""}
      ${veiculo.cor || ""}
      ${veiculo.renavam || ""}
      ${veiculo.chassi || ""}
      ${veiculo.proprietario || ""}
      ${veiculo.cpf_proprietario || ""}
      ${veiculo.telefone_proprietario || ""}
      ${veiculo.tipo_especie || ""}
      ${veiculo.situacao || ""}
      ${veiculo.condutor || ""}
      ${veiculo.documento || ""}
      ${veiculo.local || ""}
      ${veiculo.data || ""}
      ${veiculo.hora || ""}
      ${veiculo.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Veículos Abordados"
        subtitulo="Lista, consulta e acompanhamento dos veículos registrados em abordagens."
        icone={CarFront}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SigCard>
          <p className="text-slate-400 text-sm">Total</p>
          <h2 className="text-4xl font-black text-white mt-2">
            {veiculos.length}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400 text-sm">Hoje</p>
          <h2 className="text-4xl font-black text-cyan-400 mt-2">
            {veiculos.filter((v) => v.data === hoje).length}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400 text-sm">Com placa</p>
          <h2 className="text-4xl font-black text-emerald-400 mt-2">
            {veiculos.filter((v) => v.placa).length}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400 text-sm">Sem placa</p>
          <h2 className="text-4xl font-black text-yellow-400 mt-2">
            {veiculos.filter((v) => !v.placa).length}
          </h2>
        </SigCard>
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />

            <input
              className="input pl-12"
              placeholder="Buscar por placa, modelo, proprietário, condutor, local..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {podeEditar && (
            <Link
              href="/sistema/veiculos/novo"
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Novo Veículo
            </Link>
          )}
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-5">
          Lista de Veículos
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando veículos...</p>
        ) : veiculosFiltrados.length === 0 ? (
          <p className="text-slate-400">Nenhum veículo encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="text-left py-3">Placa</th>
                  <th className="text-left py-3">Veículo</th>
                  <th className="text-left py-3">Proprietário</th>
                  <th className="text-left py-3">Condutor</th>
                  <th className="text-left py-3">Situação</th>
                  <th className="text-left py-3">Local</th>
                  <th className="text-left py-3">Data</th>
                  <th className="text-right py-3">Ações</th>
                </tr>
              </thead>

              <tbody>
                {veiculosFiltrados.map((veiculo) => (
                  <tr key={veiculo.id} className="border-b border-slate-900">
                    <td className="py-4 font-black text-cyan-400">
                      {veiculo.placa || "-"}
                    </td>

                    <td>
                      <p className="font-black text-white">
                        {[veiculo.marca, veiculo.modelo]
                          .filter(Boolean)
                          .join(" ") || "-"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {veiculo.cor || "-"} • {veiculo.ano || "-"}
                      </p>
                    </td>

                    <td className="text-slate-300">
                      {veiculo.proprietario || "-"}
                    </td>

                    <td className="text-slate-300">
                      {veiculo.condutor || "-"}
                    </td>

                    <td className="text-slate-400">
                      {veiculo.situacao || "-"}
                    </td>

                    <td className="text-slate-400">
                      {veiculo.local || "-"}
                    </td>

                    <td className="text-slate-300">
                      {veiculo.data || "-"}
                    </td>

                    <td className="text-right">
  {podeEditar && (
    <div className="flex justify-end gap-2">
      <Link
        href={`/sistema/veiculos/editar/${veiculo.id}`}
        className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 transition"
      >
        Editar
      </Link>

      <button
        type="button"
        onClick={() => excluirVeiculo(veiculo.id)}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-800 transition"
      >
        <Trash2 className="w-4 h-4" />
        Excluir
      </button>
    </div>
  )}
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