"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PackageCheck, Shield, Trash2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import ProtecaoModulo from "@/components/ProtecaoModulo";

export default function CautelasGuardaPage() {
  const { id } = useParams();

  const [armamentos, setArmamentos] = useState<any[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    if (!usuario?.municipio_id || !id) return;

    const { data: armamentosData } = await supabase
      .from("guarda_armamentos")
      .select(`
        *,
        armamentos (*)
      `)
      .eq("municipio_id", usuario.municipio_id)
      .eq("guarda_id", Number(id))
      .eq("status", "ATIVO")
      .order("id", { ascending: false });

    const { data: equipamentosData } = await supabase
      .from("guarda_equipamentos")
      .select(`
        *,
        equipamentos (*)
      `)
      .eq("municipio_id", usuario.municipio_id)
      .eq("guarda_id", Number(id))
      .eq("status", "ATIVO")
      .order("id", { ascending: false });

    setArmamentos(armamentosData || []);
    setEquipamentos(equipamentosData || []);
  }

  async function devolverArmamento(itemId: number) {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!confirm("Registrar devolução deste armamento?")) return;

    const { error } = await supabase
      .from("guarda_armamentos")
      .update({
        status: "DEVOLVIDO",
        data_devolucao: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("municipio_id", usuario.municipio_id)
      .eq("guarda_id", Number(id));

    if (error) {
      alert("Erro ao devolver armamento.");
      return;
    }

    await registrarAuditoria({
      modulo: "Cautelas",
      acao: "DEVOLVER_ARMAMENTO",
      tabela: "guarda_armamentos",
      descricao: `Devolveu armamento cautelado do guarda ID ${id}.`,
      detalhes: {
        guarda_id: Number(id),
        cautela_id: itemId,
      },
    });

    carregar();
  }

  async function devolverEquipamento(itemId: number) {
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
      modulo: "Cautelas",
      acao: "DEVOLVER_EQUIPAMENTO",
      tabela: "guarda_equipamentos",
      descricao: `Devolveu equipamento cautelado do guarda ID ${id}.`,
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
            📦 Cautelas do Guarda
          </h1>

          <p className="text-slate-400 mt-2">
            Armamentos e equipamentos atualmente cautelados ao servidor.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="painel-premium p-6">
            <Shield className="w-8 h-8 text-yellow-400 mb-3" />
            <p className="text-slate-400 text-sm">Armamentos ativos</p>
            <h2 className="text-4xl font-black text-white">
              {armamentos.length}
            </h2>
          </div>

          <div className="painel-premium p-6">
            <PackageCheck className="w-8 h-8 text-cyan-400 mb-3" />
            <p className="text-slate-400 text-sm">Equipamentos ativos</p>
            <h2 className="text-4xl font-black text-white">
              {equipamentos.length}
            </h2>
          </div>
        </div>

        <div className="painel-premium p-6">
          <h2 className="text-2xl font-black text-white mb-4">
            Armamentos Cautelados
          </h2>

          {armamentos.length === 0 ? (
            <p className="text-slate-400">
              Nenhum armamento cautelado.
            </p>
          ) : (
            <div className="space-y-3">
              {armamentos.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <h3 className="font-black text-white">
                    {item.armamentos?.tipo || "Armamento"}
                  </h3>

                  <p className="text-slate-400">
                    {item.armamentos?.marca} - {item.armamentos?.modelo}
                  </p>

                  <p className="text-slate-400">
                    Série: {item.armamentos?.numero_serie || "-"}
                  </p>

                  <p className="text-yellow-400 text-sm mt-2">
                    Status: {item.status}
                  </p>

                  <button
                    onClick={() => devolverArmamento(item.id)}
                    className="mt-4 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Registrar Devolução
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="painel-premium p-6">
          <h2 className="text-2xl font-black text-white mb-4">
            Equipamentos Cautelados
          </h2>

          {equipamentos.length === 0 ? (
            <p className="text-slate-400">
              Nenhum equipamento cautelado.
            </p>
          ) : (
            <div className="space-y-3">
              {equipamentos.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <h3 className="font-black text-white">
                    {item.equipamentos?.nome || "Equipamento"}
                  </h3>

                  <p className="text-slate-400">
                    Patrimônio: {item.equipamentos?.patrimonio || "-"}
                  </p>

                  <p className="text-slate-400">
                    Tipo: {item.equipamentos?.tipo || "-"}
                  </p>

                  <p className="text-yellow-400 text-sm mt-2">
                    Status: {item.status}
                  </p>

                  <button
                    onClick={() => devolverEquipamento(item.id)}
                    className="mt-4 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Registrar Devolução
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtecaoModulo>
  );
}