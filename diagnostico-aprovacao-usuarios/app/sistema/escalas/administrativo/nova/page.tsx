"use client";

import { useEffect, useState } from "react";
import { Building2, CalendarDays, Trash2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

export default function EscalasAdministrativasPage() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [guardas, setGuardas] = useState<any[]>([]);

  const [guardaId, setGuardaId] = useState("");
  const [setor, setSetor] = useState("Administrativo");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFim, setHoraFim] = useState("14:00");
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
      .from("escalas_administrativas")
      .select("*")
      .eq("municipio_id", municipioId)
      .order("data", { ascending: false });

    setGuardas(guardasData || []);
    setRegistros(registrosData || []);
  }

async function salvar() {
  if (!usuario?.id || !municipioId) {
    alert("Sessão inválida.");
    return;
  }
    if (!guardaId || !data || !setor) {
      return alert("Preencha guarda, data e setor.");
    }

    const guarda = guardas.find((g) => String(g.id) === guardaId);

    const { error } = await supabase.from("escalas_administrativas").insert({
      municipio_id: municipioId,
      guarda_id: Number(guardaId),
      guarda_nome: guarda?.nome || "",
      setor: setor.trim(),
data,
hora_inicio: horaInicio,
hora_fim: horaFim,
observacao: observacao.trim() || null,
      status: "ATIVA",
    });

    if (error) {
      console.error(error);
      return alert("Erro ao salvar escala administrativa.");
    }

    await registrarAuditoria({
      modulo: "Escalas",
      acao: "CRIAR_ADMINISTRATIVA",
      descricao: `Criou escala administrativa para ${guarda?.nome || "guarda"}.`,
    });

    setGuardaId("");
    setSetor("Administrativo");
    setData("");
    setHoraInicio("08:00");
    setHoraFim("14:00");
    setObservacao("");

    await carregar();
  }

  async function excluir(id: number) {
  if (!usuario?.id || !municipioId) {
    alert("Sessão inválida.");
    return;
  }

  if (!confirm("Excluir esta escala administrativa?")) return;

    const registro = registros.find((r) => r.id === id);

    const { error } = await supabase
      .from("escalas_administrativas")
      .delete()
      .eq("id", id)
      .eq("municipio_id", municipioId);

    if (error) {
      console.error(error);
      return alert("Erro ao excluir.");
    }

    await registrarAuditoria({
      modulo: "Escalas Administrativas",
      acao: "EXCLUIR_ADMINISTRATIVA",
      descricao: `Excluiu escala administrativa de ${
        registro?.guarda_nome || `ID ${id}`
      }.`,
    });

    await carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Escalas Administrativas"
        subtitulo="Controle de expediente administrativo, setores e horários fixos."
        icone={Building2}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <p className="text-slate-400 text-sm">Registros</p>
          <h2 className="text-3xl font-black text-white">{registros.length}</h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400 text-sm">Ativas</p>
          <h2 className="text-3xl font-black text-green-400">
            {registros.filter((r) => r.status === "ATIVA").length}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400 text-sm">Guardas</p>
          <h2 className="text-3xl font-black text-cyan-400">{guardas.length}</h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400 text-sm">Setores</p>
          <h2 className="text-3xl font-black text-yellow-400">
            {new Set(registros.map((r) => r.setor)).size}
          </h2>
        </SigCard>
      </div>

      <div className="grid xl:grid-cols-3 gap-4">
        <SigCard>
          <h2 className="text-xl font-black text-white mb-4">Nova Escala</h2>

          <div className="space-y-4">
            <select className="input" value={guardaId} onChange={(e) => setGuardaId(e.target.value)}>
              <option value="">Selecione o guarda</option>
              {guardas.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome} • {g.matricula}
                </option>
              ))}
            </select>

            <select className="input" value={setor} onChange={(e) => setSetor(e.target.value)}>
              <option>Administrativo</option>
              <option>Comando</option>
              <option>Recepção</option>
              <option>Central de Rádio</option>
              <option>Arquivo</option>
              <option>Atendimento ao Cidadão</option>
              <option>Outro</option>
            </select>

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

            <SigButton type="blue" onClick={salvar}>
              <CalendarDays className="w-4 h-4" />
              Salvar Escala
            </SigButton>
          </div>
        </SigCard>

        <SigCard className="xl:col-span-2">
          <h2 className="text-xl font-black text-white mb-4">Escalas Cadastradas</h2>

          {registros.length === 0 ? (
            <p className="text-slate-400">Nenhuma escala administrativa cadastrada.</p>
          ) : (
            <div className="space-y-3">
              {registros.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex justify-between gap-4"
                >
                  <div>
                    <p className="font-black text-blue-400">{item.guarda_nome}</p>
                    <p className="text-slate-300">
                      {item.setor} • {item.data} • {item.hora_inicio} às {item.hora_fim}
                    </p>
                    {item.observacao && (
                      <p className="text-sm text-slate-400 mt-1">{item.observacao}</p>
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