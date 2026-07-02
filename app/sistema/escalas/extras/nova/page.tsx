"use client";

import { useEffect, useState } from "react";
import { Star, Trash2, Users } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

export default function EscalasExtrasPage() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [guardas, setGuardas] = useState<any[]>([]);

  const [titulo, setTitulo] = useState("");
  const [guardaId, setGuardaId] = useState("");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("18:00");
  const [horaFim, setHoraFim] = useState("22:00");
  const [local, setLocal] = useState("");
  const [tipo, setTipo] = useState("Evento");
  const [observacao, setObservacao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const municipioId = usuario?.municipio_id;

  async function carregar() {
    if (!municipioId) return;

    const { data: guardasData } = await supabase
      .from("guardas")
      .select("id,nome,matricula")
      .eq("municipio_id", municipioId)
      .order("nome");

    const { data: registrosData } = await supabase
      .from("escalas_extras")
      .select("*")
      .eq("municipio_id", municipioId)
      .order("data", { ascending: false });

    setGuardas(guardasData || []);
    setRegistros(registrosData || []);
  }

  async function salvar() {
    if (!municipioId) return alert("Município não identificado.");
    if (!titulo || !guardaId || !data || !local) {
      return alert("Preencha título, guarda, data e local.");
    }

    const guarda = guardas.find((g) => String(g.id) === guardaId);

    const { error } = await supabase.from("escalas_extras").insert({
      municipio_id: municipioId,
      titulo,
      guarda_id: Number(guardaId),
      guarda_nome: guarda?.nome || "",
      data,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      local,
      tipo,
      observacao,
      status: "AGENDADO",
    });

    if (error) {
      console.error(error);
      return alert("Erro ao salvar serviço extra.");
    }

    await registrarAuditoria({
      modulo: "Escalas",
      acao: "CRIAR_EXTRA",
      descricao: `Criou serviço extra ${titulo} para ${guarda?.nome || "guarda"}.`,
    });

    setTitulo("");
    setGuardaId("");
    setData("");
    setHoraInicio("18:00");
    setHoraFim("22:00");
    setLocal("");
    setTipo("Evento");
    setObservacao("");

    await carregar();
  }

  async function excluir(id: number) {
    if (!confirm("Excluir este serviço extra?")) return;

    const registro = registros.find((r) => r.id === id);

    const { error } = await supabase
      .from("escalas_extras")
      .delete()
      .eq("id", id)
      .eq("municipio_id", municipioId);

    if (error) {
      console.error(error);
      return alert("Erro ao excluir.");
    }

    await registrarAuditoria({
      modulo: "Escalas",
      acao: "EXCLUIR_EXTRA",
      descricao: `Excluiu serviço extra ${registro?.titulo || `ID ${id}`}.`,
    });

    await carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Escalas Extras"
        subtitulo="Controle de serviços extraordinários, eventos e convocações."
        icone={Star}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <p className="text-slate-400 text-sm">Serviços Extras</p>
          <h2 className="text-3xl font-black text-white">{registros.length}</h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400 text-sm">Agendados</p>
          <h2 className="text-3xl font-black text-yellow-400">
            {registros.filter((r) => r.status === "AGENDADO").length}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400 text-sm">Guardas</p>
          <h2 className="text-3xl font-black text-cyan-400">{guardas.length}</h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400 text-sm">Tipos</p>
          <h2 className="text-3xl font-black text-green-400">
            {new Set(registros.map((r) => r.tipo)).size}
          </h2>
        </SigCard>
      </div>

      <div className="grid xl:grid-cols-3 gap-4">
        <SigCard>
          <h2 className="text-xl font-black text-white mb-4">Novo Serviço Extra</h2>

          <div className="space-y-4">
            <input
              className="input"
              placeholder="Título do serviço"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />

            <select className="input" value={guardaId} onChange={(e) => setGuardaId(e.target.value)}>
              <option value="">Selecione o guarda</option>
              {guardas.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome} • {g.matricula}
                </option>
              ))}
            </select>

            <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option>Evento</option>
              <option>Operação Especial</option>
              <option>Reforço Operacional</option>
              <option>Convocação</option>
              <option>Hora Extra</option>
              <option>Apoio</option>
            </select>

            <input
              className="input"
              placeholder="Local do serviço"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
            />

            <input type="date" className="input" value={data} onChange={(e) => setData(e.target.value)} />

            <div className="grid grid-cols-2 gap-3">
              <input type="time" className="input" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
              <input type="time" className="input" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
            </div>

            <textarea
              className="input h-24 resize-none"
              placeholder="Observação"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />

            <SigButton type="gold" onClick={salvar}>
              <Users className="w-4 h-4" />
              Salvar Serviço Extra
            </SigButton>
          </div>
        </SigCard>

        <SigCard className="xl:col-span-2">
          <h2 className="text-xl font-black text-white mb-4">Serviços Cadastrados</h2>

          {registros.length === 0 ? (
            <p className="text-slate-400">Nenhum serviço extra cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {registros.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex justify-between gap-4"
                >
                  <div>
                    <p className="font-black text-yellow-400">{item.titulo}</p>
                    <p className="text-slate-300">
                      {item.guarda_nome} • {item.tipo} • {item.data}
                    </p>
                    <p className="text-sm text-slate-400">
                      {item.local} • {item.hora_inicio} às {item.hora_fim}
                    </p>
                    {item.observacao && (
                      <p className="text-sm text-slate-500 mt-1">{item.observacao}</p>
                    )}
                  </div>

                  <button
                    onClick={() => excluir(item.id)}
                    className="h-10 w-10 rounded-xl bg-red-700 hover:bg-red-800 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SigCard>
      </div>
    </div>
  );
}