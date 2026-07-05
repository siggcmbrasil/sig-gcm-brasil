"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

export default function DanosViaturasPage() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);

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

    const {
  data: listaRegistros,
  error,
} = await supabase
      .from("danos_viaturas")
      .select("*, viaturas(prefixo, placa, modelo)")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

      if (error) {
  console.error(error);
  alert("Erro ao carregar registros.");
  setCarregando(false);
  return;
}


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
    setEditandoId(null);
    setViaturaId("");
    setTipoProblema("AVARIA");
    setPrioridade("NORMAL");
    setStatus("ABERTO");
    setDescricao("");
  }

  function editarRegistro(item: any) {
    setEditandoId(item.id);
    setViaturaId(String(item.viatura_id || ""));
    setTipoProblema(item.tipo_problema || "AVARIA");
    setPrioridade(item.prioridade || "NORMAL");
    setStatus(item.status || "ABERTO");
    setDescricao(item.descricao || "");
  }

  async function salvar() {
    if (!usuario?.id || !usuario?.municipio_id) {
  alert("Sessão inválida.");
  return;
}
    if (!viaturaId) {
      alert("Selecione a viatura.");
      return;
    }

    if (!descricao.trim()) {
      alert("Descreva o problema encontrado.");
      return;
    }

    setSalvando(true);

    const dados = {
      municipio_id: usuario.municipio_id,
      criado_por: usuario.id,
      viatura_id: Number(viaturaId),
      tipo_problema: tipoProblema,
      prioridade,
      status,
      descricao: descricao.trim(),
    };

    const { error } = editandoId
      ? await supabase
          .from("danos_viaturas")
          .update(dados)
          .eq("id", editandoId)
          .eq("municipio_id", usuario.municipio_id)
      : await supabase.from("danos_viaturas").insert([dados]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    const viatura = viaturas.find((v) => String(v.id) === viaturaId);

    await registrarAuditoria({
      modulo: "DANOS_VIATURAS",
      acao: editandoId ? "EDITAR_DANO" : "CRIAR_DANO",
      descricao: editandoId
        ? `Atualizou problema da viatura ${
            viatura?.prefixo || viaturaId
          } (${nomeTipo(tipoProblema)}).`
        : `Registrou problema na viatura ${
            viatura?.prefixo || viaturaId
          } (${nomeTipo(tipoProblema)}).`,
    });

    limparFormulario();
    carregar();
    alert(editandoId ? "Problema atualizado com sucesso." : "Problema registrado com sucesso.");
  }

  async function alterarStatus(id: number, novoStatus: string) {
    const registro = registros.find((r) => r.id === id);

    const { error } = await supabase
      .from("danos_viaturas")
      .update({ status: novoStatus })
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "DANOS_VIATURAS",
acao: "ALTERAR_STATUS_DANO",
      descricao: `Alterou o status do problema da viatura ${
        registro?.viaturas?.prefixo || registro?.viatura_id || id
      } para ${novoStatus}.`,
    });

    carregar();
  }

  async function excluirRegistro(id: number) {
    if (!confirm("Deseja excluir este registro de problema?")) return;

    const registro = registros.find((r) => r.id === id);

    const { error } = await supabase
      .from("danos_viaturas")
      .delete()
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "DANOS_VIATURAS",
acao: "EXCLUIR_DANO",
      descricao: `Excluiu problema da viatura ${
        registro?.viaturas?.prefixo || registro?.viatura_id || id
      }.`,
    });

    carregar();
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
            {editandoId ? "Editar Registro" : "Novo Registro"}
          </h2>

          <p className="text-slate-400 text-sm mb-5">
            Informe a viatura e descreva o problema encontrado.
          </p>

          <div className="space-y-4">
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

            <select
              className="input"
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
            >
              <option value="NORMAL">Normal</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>

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

            <textarea
              className="input min-h-[130px]"
              placeholder="Descrição do problema"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />

            <button
              onClick={salvar}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando
                ? "Salvando..."
                : editandoId
                ? "Atualizar Problema"
                : "Registrar Problema"}
            </button>

            {editandoId && (
              <button
                onClick={limparFormulario}
                className="btn-secondary w-full"
              >
                Cancelar edição
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {carregando ? (
            <div className="painel-premium p-6 text-slate-400">
              Carregando registros...
            </div>
          ) : registros.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              Nenhum problema registrado.
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {registros.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                >
                  <p className="text-slate-400 text-sm">
                    {item.viaturas?.prefixo || `Viatura #${item.viatura_id}`}
                  </p>

                  <h3 className="text-xl font-black text-white">
                    🚔 {item.viaturas?.modelo || "Modelo não informado"}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Info titulo="Tipo" valor={nomeTipo(item.tipo_problema)} />
                    <Info titulo="Status" valor={nomeStatus(item.status)} />
                    <Info titulo="Prioridade" valor={item.prioridade} />
                    <Info titulo="Placa" valor={item.viaturas?.placa || "-"} />
                  </div>

                  <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap">
                    {item.descricao || "Sem descrição."}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-5">
                    <button
                      onClick={() => editarRegistro(item)}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-xl font-bold inline-flex items-center justify-center gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </button>

                    <button
                      onClick={() => excluirRegistro(item.id)}
                      className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-xl font-bold inline-flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>

                    <select
                      className="input col-span-2"
                      value={item.status}
                      onChange={(e) => alterarStatus(item.id, e.target.value)}
                    >
                      <option value="ABERTO">Aberto</option>
                      <option value="EM_ANALISE">Em análise</option>
                      <option value="EM_MANUTENCAO">Em manutenção</option>
                      <option value="RESOLVIDO">Resolvido</option>
                    </select>
                  </div>
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
      <h2 className="text-2xl md:text-3xl font-black text-white">{valor}</h2>
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