"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RodizioPneusPage() {
  const [pneus, setPneus] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [pneuId, setPneuId] = useState("");
  const [novaPosicao, setNovaPosicao] = useState("DIANTEIRO_DIREITO");
  const [km, setKm] = useState("");
  const [observacao, setObservacao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    const { data: listaPneus } = await supabase
      .from("pneus_viaturas")
      .select("*, viaturas(prefixo, placa)")
      .eq("municipio_id", usuario.municipio_id)
      .eq("status", "EM_USO")
      .order("codigo");

    const { data: listaHistorico } = await supabase
      .from("historico_pneus")
      .select("*, pneus_viaturas(codigo), viaturas(prefixo, placa)")
      .eq("municipio_id", usuario.municipio_id)
      .eq("tipo", "RODIZIO")
      .order("criado_em", { ascending: false });

    setPneus(listaPneus || []);
    setHistorico(listaHistorico || []);
  }

  useEffect(() => {
    if (usuario?.municipio_id) carregar();
  }, []);

  async function registrarRodizio() {
    const pneu = pneus.find((p) => String(p.id) === pneuId);

    if (!pneu) {
      alert("Selecione o pneu.");
      return;
    }

    if (!km) {
      alert("Informe o KM do rodízio.");
      return;
    }

    setSalvando(true);

    const { error: erroHistorico } = await supabase
      .from("historico_pneus")
      .insert([
        {
          municipio_id: usuario.municipio_id,
          pneu_id: pneu.id,
          viatura_id: pneu.viatura_id,
          tipo: "RODIZIO",
          posicao_anterior: pneu.posicao,
          posicao_nova: novaPosicao,
          km,
          observacao: observacao.trim() || null,
          criado_por: usuario.id,
        },
      ]);

    if (erroHistorico) {
      setSalvando(false);
      alert(erroHistorico.message);
      return;
    }

    const { error: erroUpdate } = await supabase
      .from("pneus_viaturas")
      .update({
        posicao: novaPosicao,
      })
      .eq("id", pneu.id)
      .eq("municipio_id", usuario.municipio_id);

    setSalvando(false);

    if (erroUpdate) {
      alert(erroUpdate.message);
      return;
    }

    setPneuId("");
    setNovaPosicao("DIANTEIRO_DIREITO");
    setKm("");
    setObservacao("");

    carregar();
    alert("Rodízio registrado com sucesso.");
  }

  function nomePosicao(valor: string) {
    const nomes: Record<string, string> = {
      DIANTEIRO_ESQUERDO: "Dianteiro esquerdo",
      DIANTEIRO_DIREITO: "Dianteiro direito",
      TRASEIRO_ESQUERDO: "Traseiro esquerdo",
      TRASEIRO_DIREITO: "Traseiro direito",
      ESTEPE: "Estepe",
      ESTOQUE: "Estoque",
    };

    return nomes[valor] || valor;
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-2xl md:text-3xl font-black text-white">
          🔄 Rodízio de Pneus
        </h1>

        <p className="text-slate-400 mt-2">
          Registre a mudança de posição dos pneus das viaturas.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">
            Novo Rodízio
          </h2>

          <p className="text-slate-400 text-sm mb-5">
            Selecione o pneu e informe a nova posição.
          </p>

          <div className="space-y-4">
            <div>
              <label className="label">Pneu</label>
              <select
                className="input"
                value={pneuId}
                onChange={(e) => setPneuId(e.target.value)}
              >
                <option value="">Selecione o pneu</option>

                {pneus.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - {p.viaturas?.prefixo || "Sem viatura"} -{" "}
                    {nomePosicao(p.posicao)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Nova posição</label>
              <select
                className="input"
                value={novaPosicao}
                onChange={(e) => setNovaPosicao(e.target.value)}
              >
                <option value="DIANTEIRO_ESQUERDO">Dianteiro esquerdo</option>
                <option value="DIANTEIRO_DIREITO">Dianteiro direito</option>
                <option value="TRASEIRO_ESQUERDO">Traseiro esquerdo</option>
                <option value="TRASEIRO_DIREITO">Traseiro direito</option>
                <option value="ESTEPE">Estepe</option>
              </select>
            </div>

            <div>
              <label className="label">KM do rodízio</label>
              <input
                className="input"
                value={km}
                onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 30200"
              />
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input min-h-[120px]"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: rodízio preventivo realizado."
              />
            </div>

            <button
              onClick={registrarRodizio}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Registrando..." : "Registrar Rodízio"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white">
              Histórico de Rodízios
            </h2>

            <p className="text-slate-400 text-sm">
              Últimos rodízios registrados no sistema.
            </p>
          </div>

          {historico.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">🔄</p>

              <h2 className="text-white text-xl font-black">
                Nenhum rodízio registrado
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                Os rodízios aparecerão aqui após o primeiro registro.
              </p>
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {historico.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-slate-400 text-sm">
                        {item.viaturas?.prefixo || "Sem viatura"}
                      </p>

                      <h3 className="text-xl font-black text-white">
                        🛞 {item.pneus_viaturas?.codigo || "Pneu"}
                      </h3>

                      <p className="text-slate-500 text-sm">
                        Placa: {item.viaturas?.placa || "Não informada"}
                      </p>
                    </div>

                    <span className="h-fit rounded-full bg-blue-950 text-blue-300 border border-blue-800 px-3 py-1 text-xs font-bold">
                      RODÍZIO
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Info
                      titulo="De"
                      valor={nomePosicao(item.posicao_anterior)}
                    />

                    <Info
                      titulo="Para"
                      valor={nomePosicao(item.posicao_nova)}
                    />

                    <Info
                      titulo="KM"
                      valor={item.km || "N/I"}
                    />

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