"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Save } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function NovoEventoPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("");
  const [local, setLocal] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [horaEvento, setHoraEvento] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!titulo || !tipo) {
      alert("Informe o título e o tipo do evento.");
      return;
    }

    setSalvando(true);

    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    const { error } = await supabase.from("eventos_cidadao").insert({
      municipio_id: usuario.municipio_id,
      titulo,
      tipo,
      local,
      data_evento: dataEvento || null,
      hora_evento: horaEvento || null,
      descricao,
      status: "AGENDADO",
    });

    setSalvando(false);

    if (error) {
      console.error(error);
      alert("Erro ao salvar evento.");
      return;
    }

    alert("Evento cadastrado com sucesso.");
    router.push("/sistema/portal-cidadao/eventos");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Novo Evento"
        subtitulo="Cadastrar evento, ação comunitária ou atividade pública."
        icone={CalendarDays}
      />

      <SigCard>
        <div className="space-y-4">
          <Campo label="Título do evento" value={titulo} onChange={setTitulo} />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-300">
                Tipo de evento
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-white"
              >
                <option value="">Selecione</option>
                <option value="Palestra educativa">Palestra educativa</option>
                <option value="Ação comunitária">Ação comunitária</option>
                <option value="Campanha preventiva">Campanha preventiva</option>
                <option value="Educação no trânsito">Educação no trânsito</option>
                <option value="Ronda escolar">Ronda escolar</option>
                <option value="Evento público">Evento público</option>
                <option value="Reunião comunitária">Reunião comunitária</option>
                <option value="Outras atividades">Outras atividades</option>
              </select>
            </div>

            <Campo label="Local" value={local} onChange={setLocal} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Campo label="Data" type="date" value={dataEvento} onChange={setDataEvento} />
            <Campo label="Hora" type="time" value={horaEvento} onChange={setHoraEvento} />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-300">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={6}
              placeholder="Descreva o evento..."
              className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-white"
            />
          </div>

          <button
            onClick={salvar}
            disabled={salvando}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            <Save size={18} />
            {salvando ? "Salvando..." : "Salvar Evento"}
          </button>
        </div>
      </SigCard>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-white"
      />
    </div>
  );
}