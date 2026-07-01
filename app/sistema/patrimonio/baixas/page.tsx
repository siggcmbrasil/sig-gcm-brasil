"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BaixasPatrimonioPage() {
  const [itens, setItens] = useState<any[]>([]);
  const [baixas, setBaixas] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [itemId, setItemId] = useState("");
  const [motivo, setMotivo] = useState("DANIFICADO");
  const [destino, setDestino] = useState("");
  const [observacao, setObservacao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    if (!usuario?.municipio_id) return;

    const { data: listaItens } = await supabase
      .from("patrimonios")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .neq("status", "BAIXADO")
      .order("nome");

    const { data: listaBaixas } = await supabase
      .from("baixas_patrimonio")
      .select("*, patrimonios(nome, numero_patrimonio, categoria)")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setItens(listaItens || []);
    setBaixas(listaBaixas || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function registrarBaixa() {
    const item = itens.find((i) => String(i.id) === itemId);

    if (!item) {
      alert("Selecione o item patrimonial.");
      return;
    }

    setSalvando(true);

    const { error: erroBaixa } = await supabase.from("baixas_patrimonio").insert([
      {
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        patrimonio_id: item.id,
        motivo,
        destino: destino.trim() || null,
        observacao: observacao.trim() || null,
      },
    ]);

    if (erroBaixa) {
      setSalvando(false);
      alert(erroBaixa.message);
      return;
    }

    const { error: erroUpdate } = await supabase
      .from("patrimonios")
      .update({
        status: "BAIXADO",
      })
      .eq("id", item.id)
      .eq("municipio_id", usuario.municipio_id);

    setSalvando(false);

    if (erroUpdate) {
      alert(erroUpdate.message);
      return;
    }

    setItemId("");
    setMotivo("DANIFICADO");
    setDestino("");
    setObservacao("");

    carregar();
    alert("Baixa registrada com sucesso.");
  }

  function nomeMotivo(valor: string) {
    const nomes: Record<string, string> = {
      DANIFICADO: "Danificado",
      INSERVIVEL: "Inservível",
      EXTRAVIADO: "Extraviado",
      DOADO: "Doado",
      VENDIDO: "Vendido",
      DESCARTE: "Descarte",
      OUTRO: "Outro",
    };

    return nomes[valor] || valor;
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-2xl md:text-3xl font-black text-white">
          📦 Baixas Patrimoniais
        </h1>

        <p className="text-slate-400 mt-2">
          Registre a baixa de bens danificados, extraviados, inservíveis ou descartados.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">
            Nova Baixa
          </h2>

          <p className="text-slate-400 text-sm mb-5">
            Selecione o item e informe o motivo da baixa.
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

            <div>
              <label className="label">Motivo</label>
              <select
                className="input"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              >
                <option value="DANIFICADO">Danificado</option>
                <option value="INSERVIVEL">Inservível</option>
                <option value="EXTRAVIADO">Extraviado</option>
                <option value="DOADO">Doado</option>
                <option value="VENDIDO">Vendido</option>
                <option value="DESCARTE">Descarte</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div>
              <label className="label">Destino</label>
              <input
                className="input"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="Ex: descarte, doação, almoxarifado..."
              />
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input min-h-[120px]"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Descreva o motivo e detalhes da baixa..."
              />
            </div>

            <button
              onClick={registrarBaixa}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Registrando..." : "Registrar Baixa"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white">
              Histórico de Baixas
            </h2>

            <p className="text-slate-400 text-sm">
              Bens baixados no controle patrimonial.
            </p>
          </div>

          {baixas.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">📦</p>

              <h2 className="text-white text-xl font-black">
                Nenhuma baixa registrada
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                As baixas aparecerão aqui após o primeiro registro.
              </p>
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {baixas.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-slate-400 text-sm">
                        {item.patrimonios?.categoria || "Categoria"}
                      </p>

                      <h3 className="text-xl font-black text-white">
                        {item.patrimonios?.nome || "Item patrimonial"}
                      </h3>

                      <p className="text-slate-500 text-sm">
                        Patrimônio: {item.patrimonios?.numero_patrimonio || "N/I"}
                      </p>
                    </div>

                    <span className="h-fit rounded-full bg-red-950 text-red-300 border border-red-800 px-3 py-1 text-xs font-bold">
                      BAIXADO
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Info titulo="Motivo" valor={nomeMotivo(item.motivo)} />
                    <Info titulo="Destino" valor={item.destino || "N/I"} />
                    <Info
                      titulo="Data"
                      valor={
                        item.criado_em
                          ? new Date(item.criado_em).toLocaleDateString("pt-BR")
                          : "N/I"
                      }
                    />
                    <Info titulo="Status" valor="Baixado" />
                  </div>

                  {item.observacao && (
                    <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap">
                      {item.observacao}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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