"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DanosViaturasPage() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const [viaturaId, setViaturaId] = useState("");
  const [tipoProblema, setTipoProblema] = useState("AVARIA");
  const [prioridade, setPrioridade] = useState("NORMAL");
  const [status, setStatus] = useState("ABERTO");
  const [descricao, setDescricao] = useState("");

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

    const { data: listaRegistros } = await supabase
      .from("danos_viaturas")
      .select("*, viaturas(prefixo, placa, modelo)")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setViaturas(listaViaturas || []);
    setRegistros(listaRegistros || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    return {
      total: registros.length,
      abertos: registros.filter((r) => r.status === "ABERTO").length,
      urgentes: registros.filter((r) => r.prioridade === "URGENTE").length,
      resolvidos: registros.filter((r) => r.status === "RESOLVIDO").length,
    };
  }, [registros]);

  function limparFormulario() {
    setViaturaId("");
    setTipoProblema("AVARIA");
    setPrioridade("NORMAL");
    setStatus("ABERTO");
    setDescricao("");
  }

  async function salvar() {
    if (!viaturaId) {
      alert("Selecione a viatura.");
      return;
    }

    if (!descricao.trim()) {
      alert("Descreva o problema encontrado.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("danos_viaturas").insert([
      {
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        viatura_id: Number(viaturaId),
        tipo_problema: tipoProblema,
        prioridade,
        status,
        descricao: descricao.trim(),
      },
    ]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    limparFormulario();
    carregar();
    alert("Problema registrado com sucesso.");
  }

  function nomeTipo(valor: string) {
    const tipos: Record<string, string> = {
      AVARIA: "Avaria",
      MANUTENCAO: "Manutenção",
      PNEU: "Pneu",
      FREIO: "Freio",
      MOTOR: "Motor",
      ELETRICA: "Elétrica",
      GIROFLEX: "Giroflex",
      SIRENE: "Sirene",
      LIMPEZA: "Limpeza",
      OUTRO: "Outro",
    };

    return tipos[valor] || valor;
  }

  function nomeStatus(valor: string) {
    const status: Record<string, string> = {
      ABERTO: "Aberto",
      EM_ANALISE: "Em análise",
      EM_MANUTENCAO: "Em manutenção",
      RESOLVIDO: "Resolvido",
    };

    return status[valor] || valor;
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-slate-400 font-semibold">
          Controle de Frota
        </p>

        <h1 className="text-2xl md:text-3xl font-black text-white">
          ⚠️ Danos e Problemas em Viaturas
        </h1>

        <p className="text-slate-400 mt-2">
          Registre avarias, defeitos, falhas e problemas operacionais das viaturas.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="Registros" valor={String(resumo.total)} />
        <Card titulo="Abertos" valor={String(resumo.abertos)} />
        <Card titulo="Urgentes" valor={String(resumo.urgentes)} />
        <Card titulo="Resolvidos" valor={String(resumo.resolvidos)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">
            Novo Registro
          </h2>

          <p className="text-slate-400 text-sm mb-5">
            Informe a viatura e descreva o problema encontrado.
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
              <label className="label">Tipo de problema</label>
              <select
                className="input"
                value={tipoProblema}
                onChange={(e) => setTipoProblema(e.target.value)}
              >
                <option value="AVARIA">Avaria</option>
                <option value="MANUTENCAO">Manutenção</option>
                <option value="PNEU">Pneu</option>
                <option value="FREIO">Freio</option>
                <option value="MOTOR">Motor</option>
                <option value="ELETRICA">Elétrica</option>
                <option value="GIROFLEX">Giroflex</option>
                <option value="SIRENE">Sirene</option>
                <option value="LIMPEZA">Limpeza</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div>
              <label className="label">Prioridade</label>
              <select
                className="input"
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
              >
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ABERTO">Aberto</option>
                <option value="EM_ANALISE">Em análise</option>
                <option value="EM_MANUTENCAO">Em manutenção</option>
                <option value="RESOLVIDO">Resolvido</option>
              </select>
            </div>

            <div>
              <label className="label">Descrição do problema</label>
              <textarea
                className="input min-h-[130px]"
                placeholder="Ex: pneu dianteiro danificado, giroflex sem funcionar, falha no freio..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            <button
              onClick={salvar}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Registrar Problema"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white">
              Histórico de Danos e Problemas
            </h2>

            <p className="text-slate-400 text-sm">
              Acompanhe os registros abertos, em análise, manutenção ou resolvidos.
            </p>
          </div>

          {carregando ? (
            <div className="painel-premium p-6 text-slate-400">
              Carregando registros...
            </div>
          ) : registros.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">🚔</p>
              <h2 className="text-white font-black text-xl">
                Nenhum problema registrado
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                Os registros aparecerão aqui após o primeiro lançamento.
              </p>
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {registros.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3">
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
                      className={`rounded-full px-3 py-1 text-xs font-bold border ${
                        item.prioridade === "URGENTE"
                          ? "bg-red-950 text-red-300 border-red-800"
                          : item.prioridade === "ALTA"
                          ? "bg-yellow-950 text-yellow-300 border-yellow-800"
                          : "bg-slate-900 text-slate-300 border-slate-700"
                      }`}
                    >
                      {item.prioridade}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Info titulo="Tipo" valor={nomeTipo(item.tipo_problema)} />
                    <Info titulo="Status" valor={nomeStatus(item.status)} />
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-900/70 p-4">
                    <p className="text-slate-500 text-xs mb-1">
                      Descrição
                    </p>

                    <p className="text-slate-300 text-sm whitespace-pre-wrap">
                      {item.descricao || "Sem descrição."}
                    </p>
                  </div>

                  <p className="text-xs text-slate-500 mt-4">
                    {item.criado_em
                      ? new Date(item.criado_em).toLocaleString("pt-BR")
                      : "Data não informada"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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