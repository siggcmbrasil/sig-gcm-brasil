"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MovimentacoesPatrimonioPage() {
  const [itens, setItens] = useState<any[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [itemId, setItemId] = useState("");
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [responsavel, setResponsavel] = useState("");
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

    const { data: listaMovimentacoes } = await supabase
      .from("movimentacoes_patrimonio")
      .select("*, patrimonios(nome, numero_patrimonio, categoria)")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setItens(listaItens || []);
    setMovimentacoes(listaMovimentacoes || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function registrarMovimentacao() {
    const item = itens.find((i) => String(i.id) === itemId);

    if (!item) {
      alert("Selecione o item patrimonial.");
      return;
    }

    if (!destino.trim()) {
      alert("Informe o destino do item.");
      return;
    }

    setSalvando(true);

    const origemFinal = origem.trim() || item.local || "Não informado";

    const { error: erroMovimento } = await supabase
      .from("movimentacoes_patrimonio")
      .insert([
        {
          municipio_id: usuario.municipio_id,
          criado_por: usuario.id,
          patrimonio_id: item.id,
          origem: origemFinal,
          destino: destino.trim(),
          responsavel: responsavel.trim() || null,
          observacao: observacao.trim() || null,
        },
      ]);

    if (erroMovimento) {
      setSalvando(false);
      alert(erroMovimento.message);
      return;
    }

    const { error: erroUpdate } = await supabase
      .from("patrimonios")
      .update({
        local: destino.trim(),
      })
      .eq("id", item.id)
      .eq("municipio_id", usuario.municipio_id);

    setSalvando(false);

    if (erroUpdate) {
      alert(erroUpdate.message);
      return;
    }

    setItemId("");
    setOrigem("");
    setDestino("");
    setResponsavel("");
    setObservacao("");

    carregar();
    alert("Movimentação registrada com sucesso.");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-2xl md:text-3xl font-black text-white">
          🔁 Movimentações Patrimoniais
        </h1>

        <p className="text-slate-400 mt-2">
          Registre transferências de local, setor ou responsável dos bens patrimoniais.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">
            Nova Movimentação
          </h2>

          <p className="text-slate-400 text-sm mb-5">
            Selecione o item e informe o novo destino.
          </p>

          <div className="space-y-4">
            <div>
              <label className="label">Item patrimonial</label>
              <select
                className="input"
                value={itemId}
                onChange={(e) => {
                  const id = e.target.value;
                  setItemId(id);

                  const item = itens.find((i) => String(i.id) === id);
                  setOrigem(item?.local || "");
                }}
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
              <label className="label">Origem</label>
              <input
                className="input"
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
                placeholder="Local atual"
              />
            </div>

            <div>
              <label className="label">Destino</label>
              <input
                className="input"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="Ex: Sala do Comando, Almoxarifado..."
              />
            </div>

            <div>
              <label className="label">Responsável</label>
              <input
                className="input"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Servidor ou setor responsável"
              />
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input min-h-[120px]"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Detalhes da movimentação..."
              />
            </div>

            <button
              onClick={registrarMovimentacao}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Registrando..." : "Registrar Movimentação"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white">
              Histórico de Movimentações
            </h2>

            <p className="text-slate-400 text-sm">
              Últimas transferências registradas no sistema.
            </p>
          </div>

          {movimentacoes.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">🔁</p>

              <h2 className="text-white text-xl font-black">
                Nenhuma movimentação registrada
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                As movimentações aparecerão aqui após o primeiro registro.
              </p>
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {movimentacoes.map((item) => (
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

                    <span className="h-fit rounded-full bg-blue-950 text-blue-300 border border-blue-800 px-3 py-1 text-xs font-bold">
                      MOVIMENTADO
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Info titulo="Origem" valor={item.origem || "N/I"} />
                    <Info titulo="Destino" valor={item.destino || "N/I"} />
                    <Info titulo="Responsável" valor={item.responsavel || "N/I"} />
                    <Info
                      titulo="Data"
                      valor={
                        item.criado_em
                          ? new Date(item.criado_em).toLocaleDateString("pt-BR")
                          : "N/I"
                      }
                    />
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