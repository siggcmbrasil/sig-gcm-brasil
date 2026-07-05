"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { Shield, Trash2 } from "lucide-react";

export default function ArmamentosGuardaPage() {
  const { id } = useParams();

  const [armamentos, setArmamentos] = useState<any[]>([]);
  const [armas, setArmas] = useState<any[]>([]);
  const [armamentoId, setArmamentoId] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    if (!usuario?.municipio_id) return;

    const { data: armasData } = await supabase
      .from("armamentos")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("tipo");

    const { data: vinculados } = await supabase
      .from("guarda_armamentos")
      .select(`
        *,
        armamentos (*)
      `)
      .eq("guarda_id", Number(id))
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false });

    setArmas(armasData || []);
    setArmamentos(vinculados || []);
  }

  async function vincular() {
    if (!armamentoId) {
      alert("Selecione um armamento.");
      return;
    }

    const { error } = await supabase
      .from("guarda_armamentos")
      .insert({
        municipio_id: usuario.municipio_id,
        guarda_id: Number(id),
        armamento_id: Number(armamentoId),
        data_cautela: new Date().toISOString(),
        status: "ATIVO",
      });

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Armamentos",
      acao: "CAUTELA",
      tabela: "guarda_armamentos",
      descricao: `Vinculou armamento ao guarda ID ${id}.`,
    });

    setArmamentoId("");
    carregar();
  }

  async function remover(itemId: number) {
    if (!confirm("Remover cautela?")) return;

    const { error } = await supabase
      .from("guarda_armamentos")
      .delete()
      .eq("id", itemId);

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Armamentos",
      acao: "REMOVER_CAUTELA",
      tabela: "guarda_armamentos",
      descricao: `Removeu armamento do guarda ID ${id}.`,
    });

    carregar();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="p-6 space-y-6">
        <div className="painel-premium p-6">
          <h1 className="text-3xl font-black text-white">
            🔫 Armamentos Cautelados
          </h1>

          <p className="text-slate-400 mt-2">
            Controle de armamentos vinculados ao servidor.
          </p>
        </div>

        <div className="painel-premium p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <select
              className="input"
              value={armamentoId}
              onChange={(e) =>
                setArmamentoId(e.target.value)
              }
            >
              <option value="">
                Selecione o armamento
              </option>

              {armas.map((arma) => (
                <option
                  key={arma.id}
                  value={arma.id}
                >
                  {arma.tipo} • {arma.marca} •{" "}
                  {arma.modelo} • {arma.numero_serie}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={vincular}
            className="sig-btn-gold mt-4"
          >
            Vincular Armamento
          </button>
        </div>

        <div className="space-y-4">
          {armamentos.length === 0 ? (
            <div className="painel-premium p-6 text-center">
              <p className="text-slate-400">
                Nenhum armamento cautelado.
              </p>
            </div>
          ) : (
            armamentos.map((item) => (
              <div
                key={item.id}
                className="painel-premium p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-6 h-6 text-yellow-400" />

                  <h2 className="font-black text-xl">
                    {item.armamentos?.tipo}
                  </h2>
                </div>

                <p>
                  {item.armamentos?.marca} -{" "}
                  {item.armamentos?.modelo}
                </p>

                <p>
                  Série:{" "}
                  {item.armamentos?.numero_serie}
                </p>

                <p>
                  Calibre:{" "}
                  {item.armamentos?.calibre || "-"}
                </p>

                <p className="text-yellow-400">
                  {item.status}
                </p>

                <button
                  onClick={() =>
                    remover(item.id)
                  }
                  className="
                    mt-4
                    bg-red-700
                    hover:bg-red-800
                    px-4
                    py-2
                    rounded-xl
                    flex
                    items-center
                    gap-2
                  "
                >
                  <Trash2 className="w-4 h-4" />
                  Remover
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </ProtecaoModulo>
  );
}