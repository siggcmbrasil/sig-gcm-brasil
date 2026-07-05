"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, Trash2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import ProtecaoModulo from "@/components/ProtecaoModulo";

export default function FeriasLicencasGuardaPage() {
  const { id } = useParams();

  const [registros, setRegistros] = useState<any[]>([]);
  const [tipo, setTipo] = useState("FÉRIAS");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [observacao, setObservacao] = useState("");

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
      .from("ferias_licencas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .eq("guarda_id", Number(id))
      .order("data_inicio", { ascending: false });

    setRegistros(data || []);
  }

  async function salvar() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!dataInicio || !dataFim) {
      alert("Preencha data inicial e data final.");
      return;
    }

    const { error } = await supabase.from("ferias_licencas").insert({
      municipio_id: usuario.municipio_id,
      guarda_id: Number(id),
      tipo,
      data_inicio: dataInicio,
      data_fim: dataFim,
      status: "ATIVO",
      observacao: observacao.trim() || null,
    });

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Dossiê do Guarda",
      acao: "CRIAR_FERIAS_LICENCA",
      tabela: "ferias_licencas",
      descricao: `Registrou ${tipo} para o guarda ID ${id}.`,
      detalhes: {
        guarda_id: Number(id),
        tipo,
        data_inicio: dataInicio,
        data_fim: dataFim,
      },
    });

    setTipo("FÉRIAS");
    setDataInicio("");
    setDataFim("");
    setObservacao("");

    carregar();
  }

  async function excluir(itemId: number) {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!confirm("Excluir este registro?")) return;

    const { error } = await supabase
      .from("ferias_licencas")
      .delete()
      .eq("id", itemId)
      .eq("municipio_id", usuario.municipio_id)
      .eq("guarda_id", Number(id));

    if (error) {
      alert("Erro ao excluir registro.");
      return;
    }

    await registrarAuditoria({
      modulo: "Dossiê do Guarda",
      acao: "EXCLUIR_FERIAS_LICENCA",
      tabela: "ferias_licencas",
      descricao: `Excluiu registro de férias/licença do guarda ID ${id}.`,
      detalhes: {
        guarda_id: Number(id),
        registro_id: itemId,
      },
    });

    carregar();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="p-6 space-y-6 text-white">
        <div className="painel-premium p-6">
          <h1 className="text-3xl font-black">
            🗓️ Férias e Licenças
          </h1>

          <p className="text-slate-400 mt-2">
            Histórico de férias, licenças, afastamentos e cursos do servidor.
          </p>
        </div>

        <div className="painel-premium p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <select
              className="input"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option>FÉRIAS</option>
              <option>LICENÇA MÉDICA</option>
              <option>LICENÇA PRÊMIO</option>
              <option>AFASTAMENTO</option>
              <option>ATESTADO</option>
              <option>CURSO</option>
              <option>OUTRO</option>
            </select>

            <input
              type="date"
              className="input"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />

            <input
              type="date"
              className="input"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />

            <textarea
              className="input min-h-28 md:col-span-2"
              placeholder="Observação"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          <button onClick={salvar} className="btn-primary mt-4">
            Salvar Registro
          </button>
        </div>

        <div className="space-y-4">
          {registros.length === 0 ? (
            <div className="painel-premium p-6 text-center">
              <CalendarDays className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">
                Nenhum registro encontrado.
              </p>
            </div>
          ) : (
            registros.map((item) => (
              <div key={item.id} className="painel-premium p-5">
                <h2 className="text-xl font-black text-white">
                  {item.tipo}
                </h2>

                <p className="text-slate-400">
                  {item.data_inicio} até {item.data_fim}
                </p>

                <p className="text-yellow-400 mt-1">
                  Status: {item.status || "ATIVO"}
                </p>

                {item.observacao && (
                  <p className="text-slate-300 mt-3 whitespace-pre-wrap">
                    {item.observacao}
                  </p>
                )}

                <button
                  onClick={() => excluir(item.id)}
                  className="mt-4 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-xl flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </ProtecaoModulo>
  );
}