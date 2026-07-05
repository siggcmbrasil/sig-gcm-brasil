"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  CalendarDays,
  MapPin,
  Users,
  ShieldCheck,
  ArrowLeft,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";

export default function DetalhesEventoPage() {
  const params = useParams();
  const router = useRouter();

  const [evento, setEvento] = useState<any>(null);
  const [guarnicoes, setGuarnicoes] = useState<any[]>([]);
  const [guarnicoesEvento, setGuarnicoesEvento] = useState<any[]>([]);
  const [guarnicaoId, setGuarnicaoId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [carregando, setCarregando] = useState(true);

  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  async function carregarTudo() {
    setCarregando(true);

    const usuario = pegarUsuario();

if (!usuario?.municipio_id) {
  alert("Município não identificado.");
  setCarregando(false);
  return;
}

const { data: eventoData, error: eventoError } = await supabase
      .from("eventos_operacionais")
      .select("*")
      .eq("id", params.id)
      .eq("municipio_id", usuario.municipio_id)
      .single();

    if (eventoError) {
      console.error(eventoError);
      alert("Erro ao carregar evento.");
      setCarregando(false);
      return;
    }

    const { data: guarnicoesData } = await supabase
      .from("guarnicoes")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("created_at", { ascending: false });

    const { data: vinculadasData } = await supabase
      .from("evento_guarnicoes")
      .select("*")
      .eq("evento_id", params.id)
      .eq("municipio_id", usuario.municipio_id)
      .order("created_at", { ascending: false });

    setEvento(eventoData);
    setGuarnicoes(guarnicoesData || []);
    setGuarnicoesEvento(vinculadasData || []);
    setCarregando(false);
  }

  async function vincularGuarnicao() {
    if (!guarnicaoId) {
      alert("Selecione uma guarnição.");
      return;
    }

    const usuario = pegarUsuario();

    const { error } = await supabase.from("evento_guarnicoes").insert([
      {
        municipio_id: usuario.municipio_id,
        evento_id: params.id,
        guarnicao_id: guarnicaoId,
        observacao,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao vincular guarnição.");
      return;
    }

    await registrarAuditoria({
  modulo: "Eventos Operacionais",
  acao: "VINCULAR_GUARNICAO",
  descricao: `Vinculou guarnição ao evento ${evento?.nome || params.id}.`,
  tabela: "evento_guarnicoes",
  detalhes: {
    evento_id: params.id,
    guarnicao_id: guarnicaoId,
  },
});

setGuarnicaoId("");
setObservacao("");
carregarTudo();
  }

  async function removerGuarnicao(id: string) {
    if (!confirm("Remover esta guarnição do evento?")) return;

    const usuario = pegarUsuario();

    const { error } = await supabase
      .from("evento_guarnicoes")
      .delete()
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      console.error(error);
      alert("Erro ao remover guarnição.");
      return;
    }

    carregarTudo();
  }

  function nomeGuarnicao(id: string) {
    const guarnicao = guarnicoes.find((g) => String(g.id) === String(id));
    return guarnicao?.nome || guarnicao?.titulo || `Guarnição ${id}`;
  }

  if (carregando) {
    return (
      <div className="p-6">
        <p className="text-slate-400">Carregando evento...</p>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="p-6">
        <p className="text-slate-400">Evento não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-yellow-400" />

            <div>
              <h1 className="text-3xl font-black">{evento.nome}</h1>

              <p className="text-slate-400">
                {evento.tipo || "Evento Operacional"}
              </p>
            </div>
          </div>

          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 flex items-center gap-2 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="painel-premium p-5">
          <MapPin className="w-6 h-6 text-green-400 mb-2" />
          <p className="text-slate-400 text-sm">Local</p>
          <h2 className="font-bold">{evento.local || "-"}</h2>
        </div>

        <div className="painel-premium p-5">
          <Users className="w-6 h-6 text-blue-400 mb-2" />
          <p className="text-slate-400 text-sm">Efetivo Previsto</p>
          <h2 className="font-bold">{evento.efetivo_previsto || 0}</h2>
        </div>

        <div className="painel-premium p-5">
          <CalendarDays className="w-6 h-6 text-yellow-400 mb-2" />
          <p className="text-slate-400 text-sm">Início</p>
          <h2 className="font-bold text-sm">
            {evento.data_inicio
              ? new Date(evento.data_inicio).toLocaleString("pt-BR")
              : "-"}
          </h2>
        </div>

        <div className="painel-premium p-5">
          <FileText className="w-6 h-6 text-purple-400 mb-2" />
          <p className="text-slate-400 text-sm">Status</p>
          <h2 className="font-bold">{evento.status || "PLANEJADO"}</h2>
        </div>
      </div>

      <div className="painel-premium p-6">
        <h2 className="text-xl font-bold mb-4">Planejamento Operacional</h2>

        <p className="text-slate-300 whitespace-pre-wrap">
          {evento.descricao || "Nenhuma informação cadastrada."}
        </p>
      </div>

      <div className="painel-premium p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold">Guarnições Empregadas</h2>
          <p className="text-slate-400 text-sm">
            Vincule as guarnições que atuarão neste evento operacional.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <select
            className="input-premium"
            value={guarnicaoId}
            onChange={(e) => setGuarnicaoId(e.target.value)}
          >
            <option value="">Selecione a guarnição</option>

            {guarnicoes.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome || g.titulo || `Guarnição ${g.id}`}
              </option>
            ))}
          </select>

          <input
            className="input-premium"
            placeholder="Observação"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />

          <button
            onClick={vincularGuarnicao}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl px-4 py-2 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Vincular
          </button>
        </div>

        {guarnicoesEvento.length === 0 ? (
          <p className="text-slate-400 text-sm">
            Nenhuma guarnição vinculada a este evento.
          </p>
        ) : (
          <div className="space-y-3">
            {guarnicoesEvento.map((item) => (
              <div
                key={item.id}
                className="border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div>
                  <h3 className="font-bold">
                    {nomeGuarnicao(item.guarnicao_id)}
                  </h3>

                  <p className="text-sm text-slate-400">
                    {item.observacao || "Sem observação."}
                  </p>
                </div>

                <button
                  onClick={() => removerGuarnicao(item.id)}
                  className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 flex items-center gap-2 w-fit"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}