"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AbastecimentosPage() {
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [abastecimentos, setAbastecimentos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [viaturaId, setViaturaId] = useState("");
  const [litros, setLitros] = useState("");
  const [valor, setValor] = useState("");
  const [km, setKm] = useState("");
  const [posto, setPosto] = useState("");
  const [observacao, setObservacao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    if (!usuario?.municipio_id) return;

    setCarregando(true);

    const { data: listaViaturas } = await supabase
      .from("viaturas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("prefixo", { ascending: true });

    const { data: listaAbastecimentos } = await supabase
      .from("abastecimentos")
      .select("*, viaturas(prefixo, placa)")
      .eq("municipio_id", usuario.municipio_id)
      .order("data_abastecimento", { ascending: false });

    setViaturas(listaViaturas || []);
    setAbastecimentos(listaAbastecimentos || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    const totalLitros = abastecimentos.reduce(
      (acc, item) => acc + Number(item.litros || 0),
      0
    );

    const totalValor = abastecimentos.reduce(
      (acc, item) => acc + Number(item.valor || 0),
      0
    );

    return {
      registros: abastecimentos.length,
      totalLitros,
      totalValor,
    };
  }, [abastecimentos]);

  function limparFormulario() {
    setViaturaId("");
    setLitros("");
    setValor("");
    setKm("");
    setPosto("");
    setObservacao("");
  }

  async function salvar() {
    if (!viaturaId) {
      alert("Selecione a viatura.");
      return;
    }

    if (!litros || Number(litros) <= 0) {
      alert("Informe a quantidade de litros.");
      return;
    }

    if (!valor || Number(valor) <= 0) {
      alert("Informe o valor do abastecimento.");
      return;
    }

    if (!km || Number(km) <= 0) {
      alert("Informe o KM atual da viatura.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("abastecimentos").insert([
      {
        municipio_id: usuario.municipio_id,
        viatura_id: Number(viaturaId),
        litros: Number(litros),
        valor: Number(valor),
        km: Number(km),
        posto: posto.trim(),
        observacao: observacao.trim(),
        criado_por: usuario.id,
      },
    ]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    limparFormulario();
    carregar();
    alert("Abastecimento registrado com sucesso.");
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="painel-premium p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400 font-semibold">
              Controle de Frota
            </p>

            <h1 className="text-2xl md:text-3xl font-black text-white">
              ⛽ Abastecimentos
            </h1>

            <p className="text-slate-400 mt-2">
              Registre abastecimentos, quilometragem, posto e observações da viatura.
            </p>
          </div>

          <button onClick={carregar} className="sig-btn-gold">
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="painel-premium p-5">
          <p className="text-slate-400 text-sm">Registros</p>
          <h2 className="text-3xl font-black text-white">{resumo.registros}</h2>
        </div>

        <div className="painel-premium p-5">
          <p className="text-slate-400 text-sm">Total de Litros</p>
          <h2 className="text-3xl font-black text-white">
            {resumo.totalLitros.toFixed(2)} L
          </h2>
        </div>

        <div className="painel-premium p-5">
          <p className="text-slate-400 text-sm">Valor Total</p>
          <h2 className="text-3xl font-black text-white">
            R$ {resumo.totalValor.toFixed(2)}
          </h2>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white mb-1">
            Novo Abastecimento
          </h2>

          <p className="text-slate-400 text-sm mb-5">
            Preencha os dados básicos do abastecimento.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 font-bold">
                Viatura
              </label>

              <select
                className="input mt-1"
                value={viaturaId}
                onChange={(e) => setViaturaId(e.target.value)}
              >
                <option value="">Selecione a viatura</option>

                {viaturas.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.prefixo} {v.placa ? `- ${v.placa}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-300 font-bold">
                  Litros
                </label>

                <input
                  className="input mt-1"
                  placeholder="Ex: 35.5"
                  value={litros}
                  onChange={(e) => setLitros(e.target.value)}
                  type="number"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 font-bold">
                  Valor
                </label>

                <input
                  className="input mt-1"
                  placeholder="Ex: 250"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  type="number"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 font-bold">
                KM Atual
              </label>

              <input
                className="input mt-1"
                placeholder="Quilometragem da viatura"
                value={km}
                onChange={(e) => setKm(e.target.value)}
                type="number"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 font-bold">
                Posto
              </label>

              <input
                className="input mt-1"
                placeholder="Nome do posto"
                value={posto}
                onChange={(e) => setPosto(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 font-bold">
                Observações
              </label>

              <textarea
                className="input mt-1 min-h-[100px]"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: abastecimento autorizado, cupom fiscal, motorista responsável..."
              />
            </div>

            <button
              onClick={salvar}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Registrando..." : "Registrar Abastecimento"}
            </button>
          </div>
        </div>

        <div className="painel-premium p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-black text-white">
                Histórico de Abastecimentos
              </h2>

              <p className="text-slate-400 text-sm">
                Últimos registros lançados no sistema.
              </p>
            </div>
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando abastecimentos...</p>
          ) : abastecimentos.length === 0 ? (
            <div className="border border-dashed border-slate-700 rounded-2xl p-8 text-center">
              <p className="text-slate-300 font-bold">
                Nenhum abastecimento registrado.
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Os registros aparecerão aqui após o primeiro lançamento.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {abastecimentos.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h3 className="text-white font-black">
                        🚔 {a.viaturas?.prefixo || "Viatura não informada"}
                      </h3>

                      <p className="text-slate-400 text-sm">
                        Placa: {a.viaturas?.placa || "Não informada"} • KM:{" "}
                        {a.km || "Não informado"}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-white font-black">
                        R$ {Number(a.valor || 0).toFixed(2)}
                      </p>

                      <p className="text-slate-400 text-sm">
                        {Number(a.litros || 0).toFixed(2)} litros
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 mt-4 text-sm">
                    <div className="bg-slate-900/60 rounded-xl p-3">
                      <p className="text-slate-500">Posto</p>
                      <p className="text-slate-200 font-semibold">
                        {a.posto || "Não informado"}
                      </p>
                    </div>

                    <div className="bg-slate-900/60 rounded-xl p-3">
                      <p className="text-slate-500">Data</p>
                      <p className="text-slate-200 font-semibold">
                        {a.data_abastecimento
                          ? new Date(a.data_abastecimento).toLocaleString("pt-BR")
                          : "Não informada"}
                      </p>
                    </div>

                    <div className="bg-slate-900/60 rounded-xl p-3">
                      <p className="text-slate-500">Valor por litro</p>
                      <p className="text-slate-200 font-semibold">
                        R${" "}
                        {Number(a.litros || 0) > 0
                          ? (Number(a.valor || 0) / Number(a.litros || 0)).toFixed(2)
                          : "0.00"}
                      </p>
                    </div>
                  </div>

                  {a.observacao && (
                    <p className="text-slate-400 text-sm mt-3">
                      <span className="font-bold text-slate-300">Obs:</span>{" "}
                      {a.observacao}
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