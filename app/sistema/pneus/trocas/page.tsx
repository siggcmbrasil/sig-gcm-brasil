"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TrocasPneusPage() {
  const [pneus, setPneus] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [pneuAntigoId, setPneuAntigoId] = useState("");
  const [pneuNovoId, setPneuNovoId] = useState("");
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
      .order("codigo");

    const { data: listaHistorico } = await supabase
      .from("historico_pneus")
      .select("*, pneus_viaturas(codigo), viaturas(prefixo, placa)")
      .eq("municipio_id", usuario.municipio_id)
      .eq("tipo", "TROCA")
      .order("criado_em", { ascending: false });

    setPneus(listaPneus || []);
    setHistorico(listaHistorico || []);
  }

  useEffect(() => {
    if (usuario?.municipio_id) carregar();
  }, []);

  async function registrarTroca() {
    const pneuAntigo = pneus.find((p) => String(p.id) === pneuAntigoId);
    const pneuNovo = pneus.find((p) => String(p.id) === pneuNovoId);

    if (!pneuAntigo) {
      alert("Selecione o pneu que será retirado.");
      return;
    }

    if (!pneuNovo) {
      alert("Selecione o pneu que será instalado.");
      return;
    }

    if (pneuAntigo.id === pneuNovo.id) {
      alert("O pneu retirado e o pneu instalado não podem ser o mesmo.");
      return;
    }

    if (!km) {
      alert("Informe o KM da troca.");
      return;
    }

    setSalvando(true);

    const { error: erroHistorico } = await supabase
      .from("historico_pneus")
      .insert([
        {
          municipio_id: usuario.municipio_id,
          pneu_id: pneuAntigo.id,
          viatura_id: pneuAntigo.viatura_id,
          tipo: "TROCA",
          posicao_anterior: pneuAntigo.posicao,
          posicao_nova: pneuAntigo.posicao,
          km,
          observacao:
            `Pneu retirado: ${pneuAntigo.codigo}. Pneu instalado: ${pneuNovo.codigo}. ${
              observacao.trim() || ""
            }`.trim(),
          criado_por: usuario.id,
        },
      ]);

    if (erroHistorico) {
      setSalvando(false);
      alert(erroHistorico.message);
      return;
    }

    const { error: erroAntigo } = await supabase
      .from("pneus_viaturas")
      .update({
        status: "SUBSTITUIDO",
        posicao: "ESTOQUE",
      })
      .eq("id", pneuAntigo.id)
      .eq("municipio_id", usuario.municipio_id);

    if (erroAntigo) {
      setSalvando(false);
      alert(erroAntigo.message);
      return;
    }

    const { error: erroNovo } = await supabase
      .from("pneus_viaturas")
      .update({
        status: "EM_USO",
        viatura_id: pneuAntigo.viatura_id,
        posicao: pneuAntigo.posicao,
        km_instalacao: km,
      })
      .eq("id", pneuNovo.id)
      .eq("municipio_id", usuario.municipio_id);

    setSalvando(false);

    if (erroNovo) {
      alert(erroNovo.message);
      return;
    }

    setPneuAntigoId("");
    setPneuNovoId("");
    setKm("");
    setObservacao("");

    carregar();
    alert("Troca registrada com sucesso.");
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

  const pneusEmUso = pneus.filter((p) => p.status === "EM_USO");
  const pneusDisponiveis = pneus.filter(
    (p) => p.status === "ESTOQUE" || p.status === "NOVO"
  );

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-2xl md:text-3xl font-black text-white">
          🔧 Trocas de Pneus
        </h1>

        <p className="text-slate-400 mt-2">
          Registre substituições de pneus das viaturas e mantenha o histórico da frota.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">
            Nova Troca
          </h2>

          <p className="text-slate-400 text-sm mb-5">
            Escolha o pneu que será retirado e o pneu que será instalado.
          </p>

          <div className="space-y-4">
            <div>
              <label className="label">Pneu retirado</label>
              <select
                className="input"
                value={pneuAntigoId}
                onChange={(e) => setPneuAntigoId(e.target.value)}
              >
                <option value="">Selecione o pneu em uso</option>

                {pneusEmUso.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - {p.viaturas?.prefixo || "Sem viatura"} -{" "}
                    {nomePosicao(p.posicao)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Pneu instalado</label>
              <select
                className="input"
                value={pneuNovoId}
                onChange={(e) => setPneuNovoId(e.target.value)}
              >
                <option value="">Selecione o pneu disponível</option>

                {pneusDisponiveis.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - {p.marca || "Sem marca"} -{" "}
                    {p.medida || "Sem medida"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">KM da troca</label>
              <input
                className="input"
                value={km}
                onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 35500"
              />
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input min-h-[120px]"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: troca por desgaste, pneu furado, substituição preventiva..."
              />
            </div>

            <button
              onClick={registrarTroca}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Registrando..." : "Registrar Troca"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white">
              Histórico de Trocas
            </h2>

            <p className="text-slate-400 text-sm">
              Últimas substituições registradas no sistema.
            </p>
          </div>

          {historico.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">🔧</p>

              <h2 className="text-white text-xl font-black">
                Nenhuma troca registrada
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                As trocas aparecerão aqui após o primeiro registro.
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

                    <span className="h-fit rounded-full bg-yellow-950 text-yellow-300 border border-yellow-800 px-3 py-1 text-xs font-bold">
                      TROCA
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Info
                      titulo="Posição"
                      valor={nomePosicao(item.posicao_anterior)}
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

                    <Info
                      titulo="Status"
                      valor="Substituído"
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