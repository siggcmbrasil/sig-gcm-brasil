"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const itensPadrao = {
  pneus: true,
  freios: true,
  farois: true,
  sirene: true,
  giroflex: true,
  oleo: true,
  agua: true,
  documentos: true,
  limpeza: true,
  equipamentos: true,
};

const nomesItens: Record<string, string> = {
  pneus: "Pneus",
  freios: "Freios",
  farois: "Faróis",
  sirene: "Sirene",
  giroflex: "Giroflex",
  oleo: "Óleo",
  agua: "Água",
  documentos: "Documentos",
  limpeza: "Limpeza",
  equipamentos: "Equipamentos",
};

export default function ChecklistViaturasPage() {
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const [viaturaId, setViaturaId] = useState("");
  const [km, setKm] = useState("");
  const [combustivel, setCombustivel] = useState("CHEIO");
  const [observacao, setObservacao] = useState("");
  const [itens, setItens] = useState(itensPadrao);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    if (!usuario?.municipio_id) return;

    setCarregando(true);

    const { data: listaViaturas } = await supabase
      .from("viaturas")
      .select("id, prefixo, placa, modelo")
      .eq("municipio_id", usuario.municipio_id)
      .order("prefixo");

    const { data: listaChecklists } = await supabase
      .from("checklists_viaturas")
      .select("*, viaturas(prefixo, placa, modelo)")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setViaturas(listaViaturas || []);
    setChecklists(listaChecklists || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    return {
      total: checklists.length,
      aprovadas: checklists.filter((c) => c.status === "APROVADA").length,
      restricao: checklists.filter((c) => c.status === "COM_RESTRICAO").length,
      reserva: checklists.filter((c) => c.combustivel === "RESERVA").length,
    };
  }, [checklists]);

  const possuiProblema = Object.values(itens).some((valor) => valor === false);
  const totalProblemas = Object.values(itens).filter((valor) => valor === false).length;

  function alterarItem(nome: keyof typeof itensPadrao) {
    setItens((atual) => ({
      ...atual,
      [nome]: !atual[nome],
    }));
  }

  function limparFormulario() {
    setViaturaId("");
    setKm("");
    setCombustivel("CHEIO");
    setObservacao("");
    setItens(itensPadrao);
  }

  async function salvar() {
    if (!viaturaId) {
      alert("Selecione a viatura.");
      return;
    }

    if (!km) {
      alert("Informe a quilometragem.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("checklists_viaturas").insert([
      {
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        viatura_id: Number(viaturaId),
        km,
        combustivel,
        status: possuiProblema ? "COM_RESTRICAO" : "APROVADA",
        itens,
        observacao: observacao.trim() || null,
      },
    ]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    limparFormulario();
    carregar();
    alert("Checklist salvo com sucesso.");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-slate-400 font-semibold">
          Controle de Frota
        </p>

        <h1 className="text-2xl md:text-3xl font-black text-white">
          ✅ Checklist de Viaturas
        </h1>

        <p className="text-slate-400 mt-2">
          Conferência rápida da viatura antes ou após o serviço operacional.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="Checklists" valor={String(resumo.total)} />
        <Card titulo="Aprovadas" valor={String(resumo.aprovadas)} />
        <Card titulo="Com restrição" valor={String(resumo.restricao)} />
        <Card titulo="Em reserva" valor={String(resumo.reserva)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">
            Novo Checklist
          </h2>

          <p className="text-slate-400 text-sm mb-5">
            Marque os itens conferidos. Toque no item para alterar entre aprovado e problema.
          </p>

          <div className="space-y-4">
            <div>
              <label className="label">Viatura</label>
              <select
                className="input"
                value={viaturaId}
                onChange={(e) => setViaturaId(e.target.value)}
              >
                <option value="">Selecione a viatura</option>

                {viaturas.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.prefixo || "Sem prefixo"} - {v.placa || "Sem placa"}{" "}
                    {v.modelo ? `• ${v.modelo}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Quilometragem</label>
              <input
                className="input"
                placeholder="Ex: 25430"
                value={km}
                onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div>
              <label className="label">Nível de combustível</label>
              <select
                className="input"
                value={combustivel}
                onChange={(e) => setCombustivel(e.target.value)}
              >
                <option value="CHEIO">Cheio</option>
                <option value="3/4">3/4</option>
                <option value="1/2">1/2</option>
                <option value="1/4">1/4</option>
                <option value="RESERVA">Reserva</option>
              </select>
            </div>

            <div
              className={`rounded-2xl p-4 border ${
                possuiProblema
                  ? "bg-red-950/40 border-red-900 text-red-300"
                  : "bg-green-950/40 border-green-900 text-green-300"
              }`}
            >
              <p className="font-black">
                {possuiProblema
                  ? `⚠️ ${totalProblemas} item(ns) com problema`
                  : "✅ Viatura aprovada"}
              </p>

              <p className="text-sm opacity-80">
                O status será definido automaticamente.
              </p>
            </div>
          </div>
        </div>

        <div className="painel-premium p-6 lg:col-span-2">
          <h2 className="text-xl font-black text-white">
            Itens da Conferência
          </h2>

          <p className="text-slate-400 text-sm mb-5">
            Verde significa aprovado. Vermelho significa restrição ou problema.
          </p>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {Object.entries(itens).map(([chave, valor]) => (
              <button
                key={chave}
                type="button"
                onClick={() => alterarItem(chave as keyof typeof itensPadrao)}
                className={`rounded-2xl p-4 text-left font-bold border transition ${
                  valor
                    ? "bg-green-950/50 border-green-800 text-green-300"
                    : "bg-red-950/50 border-red-800 text-red-300"
                }`}
              >
                <p className="text-lg">
                  {valor ? "✅" : "⚠️"} {nomesItens[chave]}
                </p>

                <p className="text-xs opacity-80 mt-1">
                  {valor ? "Item aprovado" : "Necessita atenção"}
                </p>
              </button>
            ))}
          </div>

          <textarea
            className="input mt-5 min-h-[120px]"
            placeholder="Observações / problemas encontrados"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />

          <button
            onClick={salvar}
            disabled={salvando}
            className="sig-btn-gold mt-4 w-full md:w-auto disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar Checklist"}
          </button>
        </div>
      </div>

      <div className="painel-premium p-6">
        <h2 className="text-xl font-black text-white">
          Histórico de Checklists
        </h2>

        <p className="text-slate-400 text-sm">
          Últimas conferências registradas no sistema.
        </p>
      </div>

      {carregando ? (
        <div className="painel-premium p-6 text-slate-400">
          Carregando checklists...
        </div>
      ) : checklists.length === 0 ? (
        <div className="painel-premium p-10 text-center">
          <p className="text-6xl mb-3">✅</p>
          <h2 className="text-white font-black text-xl">
            Nenhum checklist registrado
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Os registros aparecerão aqui após o primeiro checklist.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {checklists.map((item) => {
            const itensChecklist = item.itens || {};
            const problemas = Object.entries(itensChecklist).filter(
              ([, valor]) => valor === false
            );

            return (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-slate-400 text-sm">
                      {item.viaturas?.prefixo || `Viatura #${item.viatura_id}`}
                    </p>

                    <h3 className="text-xl font-black text-white">
                      🚔 {item.viaturas?.modelo || "Modelo não informado"}
                    </h3>

                    <p className="text-slate-500 text-sm">
                      Placa: {item.viaturas?.placa || "Não informada"}
                    </p>
                  </div>

                  <span
                    className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${
                      item.status === "APROVADA"
                        ? "bg-green-950 text-green-300 border border-green-800"
                        : "bg-red-950 text-red-300 border border-red-800"
                    }`}
                  >
                    {item.status === "APROVADA" ? "Aprovada" : "Com restrição"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Info titulo="KM" valor={item.km || "N/I"} />
                  <Info titulo="Combustível" valor={item.combustivel || "N/I"} />
                </div>

                {problemas.length > 0 ? (
                  <div className="mt-4 rounded-2xl bg-red-950/40 border border-red-900 p-4">
                    <p className="text-red-300 font-black text-sm mb-2">
                      Problemas encontrados
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {problemas.map(([chave]) => (
                        <span
                          key={chave}
                          className="rounded-full bg-red-900/60 px-3 py-1 text-xs text-red-100 font-bold"
                        >
                          {nomesItens[chave] || chave}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-green-950/40 border border-green-900 p-4">
                    <p className="text-green-300 font-black text-sm">
                      Todos os itens aprovados
                    </p>
                  </div>
                )}

                <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap">
                  {item.observacao || "Sem observações."}
                </p>

                <p className="text-xs text-slate-500 mt-4">
                  {item.criado_em
                    ? new Date(item.criado_em).toLocaleString("pt-BR")
                    : "Data não informada"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="painel-premium p-5">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-2xl md:text-3xl font-black text-white">
        {valor}
      </h2>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-3">
      <p className="text-slate-500 text-xs">{titulo}</p>
      <p className="text-slate-200 font-bold text-sm">{valor}</p>
    </div>
  );
}