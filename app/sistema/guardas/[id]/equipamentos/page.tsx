"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PackageCheck, Trash2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import ProtecaoModulo from "@/components/ProtecaoModulo";

export default function EquipamentosGuardaPage() {
  const { id } = useParams();

  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [lista, setLista] = useState<any[]>([]);
  const [equipamentoId, setEquipamentoId] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    if (!usuario?.municipio_id || !id) return;

    const { data: equipamentosData } = await supabase
      .from("equipamentos")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false });

    const { data: vinculadosData } = await supabase
      .from("guarda_equipamentos")
      .select(`
        *,
        equipamentos (*)
      `)
      .eq("municipio_id", usuario.municipio_id)
      .eq("guarda_id", Number(id))
      .order("id", { ascending: false });

    setLista(equipamentosData || []);
    setEquipamentos(vinculadosData || []);
  }

  async function vincular() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!equipamentoId) {
      alert("Selecione um equipamento.");
      return;
    }

    const { data: existente } = await supabase
      .from("guarda_equipamentos")
      .select("id")
      .eq("municipio_id", usuario.municipio_id)
      .eq("guarda_id", Number(id))
      .eq("equipamento_id", Number(equipamentoId))
      .eq("status", "ATIVO")
      .maybeSingle();

    if (existente) {
      alert("Este equipamento já está cautelado para este guarda.");
      return;
    }

    const { error } = await supabase.from("guarda_equipamentos").insert({
      municipio_id: usuario.municipio_id,
      guarda_id: Number(id),
      equipamento_id: Number(equipamentoId),
      status: "ATIVO",
      data_cautela: new Date().toISOString(),
    });

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Dossiê do Guarda",
      acao: "VINCULAR_EQUIPAMENTO",
      tabela: "guarda_equipamentos",
      descricao: `Vinculou equipamento ao guarda ID ${id}.`,
      detalhes: {
        guarda_id: Number(id),
        equipamento_id: Number(equipamentoId),
      },
    });

    setEquipamentoId("");
    carregar();
  }

  async function devolver(itemId: number) {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!confirm("Registrar devolução deste equipamento?")) return;

    const { error } = await supabase
      .from("guarda_equipamentos")
      .update({
        status: "DEVOLVIDO",
        data_devolucao: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("municipio_id", usuario.municipio_id)
      .eq("guarda_id", Number(id));

    if (error) {
      alert("Erro ao devolver equipamento.");
      return;
    }

    await registrarAuditoria({
      modulo: "Dossiê do Guarda",
      acao: "DEVOLVER_EQUIPAMENTO",
      tabela: "guarda_equipamentos",
      descricao: `Devolveu equipamento do guarda ID ${id}.`,
      detalhes: {
        guarda_id: Number(id),
        cautela_id: itemId,
      },
    });

    carregar();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="p-6 space-y-6">
        <div className="painel-premium p-6">
          <h1 className="text-3xl font-black text-white">
            🎒 Equipamentos do Guarda
          </h1>

          <p className="text-slate-400 mt-2">
            Controle de equipamentos cautelados ao servidor.
          </p>
        </div>

        <div className="painel-premium p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <select
              className="input"
              value={equipamentoId}
              onChange={(e) => setEquipamentoId(e.target.value)}
            >
              <option value="">Selecione o equipamento</option>

              {lista.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome || item.tipo || "Equipamento"} •{" "}
                  {item.patrimonio || item.numero_serie || "Sem patrimônio"}
                </option>
              ))}
            </select>
          </div>

          <button onClick={vincular} className="btn-primary mt-4">
            Vincular Equipamento
          </button>
        </div>

        <div className="space-y-4">
          {equipamentos.length === 0 ? (
            <div className="painel-premium p-6 text-center">
              <PackageCheck className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">
                Nenhum equipamento vinculado.
              </p>
            </div>
          ) : (
            equipamentos.map((item) => (
              <div key={item.id} className="painel-premium p-5">
                <h2 className="font-black text-xl">
                  {item.equipamentos?.nome ||
                    item.equipamentos?.tipo ||
                    "Equipamento"}
                </h2>

                <p className="text-slate-400">
                  Patrimônio:{" "}
                  {item.equipamentos?.patrimonio ||
                    item.equipamentos?.numero_serie ||
                    "-"}
                </p>

                <p className="text-yellow-400">
                  Status: {item.status}
                </p>

                {item.status === "ATIVO" && (
                  <button
                    onClick={() => devolver(item.id)}
                    className="mt-4 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Registrar Devolução
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </ProtecaoModulo>
  );
}