"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Clock3, Trash2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import ProtecaoModulo from "@/components/ProtecaoModulo";

export default function BancoHorasGuardaPage() {
  const { id } = useParams();

  const [registros, setRegistros] = useState<any[]>([]);
  const [tipo, setTipo] = useState("CREDITO");
  const [data, setData] = useState("");
  const [horas, setHoras] = useState("");
  const [motivo, setMotivo] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    if (!usuario?.municipio_id || !id) return;

    const { data } = await supabase
      .from("banco_horas_guardas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .eq("guarda_id", Number(id))
      .order("data", { ascending: false });

    setRegistros(data || []);
  }

  const saldo = registros.reduce((total, item) => {
    const valor = Number(item.horas || 0);
    return item.tipo === "DEBITO" ? total - valor : total + valor;
  }, 0);

  async function salvar() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!data || !horas || !motivo.trim()) {
      alert("Preencha data, horas e motivo.");
      return;
    }

    const { error } = await supabase.from("banco_horas_guardas").insert({
      municipio_id: usuario.municipio_id,
      guarda_id: Number(id),
      tipo,
      data,
      horas: Number(horas),
      motivo: motivo.trim(),
      criado_por: usuario.id,
    });

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Banco de Horas",
      acao: "CRIAR",
      tabela: "banco_horas_guardas",
      descricao: `Registrou ${horas}h no banco de horas do guarda ID ${id}.`,
      detalhes: {
        guarda_id: Number(id),
        tipo,
        data,
        horas: Number(horas),
      },
    });

    setTipo("CREDITO");
    setData("");
    setHoras("");
    setMotivo("");

    carregar();
  }

  async function excluir(itemId: number) {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!confirm("Excluir este registro de banco de horas?")) return;

    const { error } = await supabase
      .from("banco_horas_guardas")
      .delete()
      .eq("id", itemId)
      .eq("municipio_id", usuario.municipio_id)
      .eq("guarda_id", Number(id));

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Banco de Horas",
      acao: "EXCLUIR",
      tabela: "banco_horas_guardas",
      descricao: `Excluiu registro de banco de horas do guarda ID ${id}.`,
      detalhes: {
        guarda_id: Number(id),
        registro_id: itemId,
      },
    });

    carregar();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="p-6 space-y-6">
        <div className="painel-premium p-6">
          <h1 className="text-3xl font-black text-white">
            ⏱️ Banco de Horas
          </h1>

          <p className="text-slate-400 mt-2">
            Controle de créditos, débitos e compensações do servidor.
          </p>
        </div>

        <div className="painel-premium p-6">
          <p className="text-slate-400 text-sm">Saldo atual</p>

          <h2
            className={`text-4xl font-black mt-2 ${
              saldo >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {saldo}h
          </h2>
        </div>

        <div className="painel-premium p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <select
              className="input"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="CREDITO">Crédito de horas</option>
              <option value="DEBITO">Débito / compensação</option>
            </select>

            <input
              type="date"
              className="input"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />

            <input
              type="number"
              step="0.5"
              min="0"
              className="input"
              placeholder="Quantidade de horas"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
            />

            <input
              className="input"
              placeholder="Motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          <button onClick={salvar} className="btn-primary mt-4">
            Salvar Registro
          </button>
        </div>

        <div className="space-y-4">
          {registros.length === 0 ? (
            <div className="painel-premium p-6 text-center">
              <Clock3 className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">
                Nenhum registro de banco de horas.
              </p>
            </div>
          ) : (
            registros.map((item) => (
              <div key={item.id} className="painel-premium p-5">
                <div className="flex justify-between gap-4">
                  <div>
                    <h3
                      className={`font-black text-xl ${
                        item.tipo === "DEBITO"
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {item.tipo === "DEBITO" ? "-" : "+"}
                      {item.horas}h
                    </h3>

                    <p className="text-slate-400">
                      Data: {item.data || "-"}
                    </p>

                    <p className="mt-2 whitespace-pre-wrap">
                      {item.motivo}
                    </p>
                  </div>

                  <button
                    onClick={() => excluir(item.id)}
                    className="h-fit bg-red-700 hover:bg-red-800 px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ProtecaoModulo>
  );
}