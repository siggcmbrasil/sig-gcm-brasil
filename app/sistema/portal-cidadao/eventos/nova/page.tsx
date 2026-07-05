"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Save, XCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

function obterUsuarioLogado(): UsuarioLogado | null {
  try {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) return null;

    const usuario = JSON.parse(salvo);

    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) {
      return null;
    }

    return {
      id: String(usuario.id),
      perfil: usuario.perfil,
      municipio_id: Number(usuario.municipio_id),
    };
  } catch {
    return null;
  }
}

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
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      alert("Sessão inválida.");
      return;
    }

    if (
      ![
        "DESENVOLVEDOR",
        "ADMIN",
        "COMANDANTE",
        "DIRETOR",
        "PLANTONISTA",
      ].includes(usuario.perfil)
    ) {
      alert("Você não possui permissão para cadastrar evento.");
      return;
    }

    if (!titulo.trim()) {
      alert("Informe o título do evento.");
      return;
    }

    if (!tipo.trim()) {
      alert("Informe o tipo do evento.");
      return;
    }

    if (titulo.trim().length < 3) {
      alert("Título muito curto.");
      return;
    }

    if (dataEvento) {
      const hoje = new Date().toISOString().slice(0, 10);

      if (dataEvento < hoje) {
        alert("A data do evento não pode ser anterior a hoje.");
        return;
      }
    }

    setSalvando(true);

    const { data, error } = await supabase
      .from("eventos_cidadao")
      .insert({
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        titulo: titulo.trim(),
        tipo: tipo.trim(),
        local: local.trim() || null,
        data_evento: dataEvento || null,
        hora_evento: horaEvento || null,
        descricao: descricao.trim() || null,
        status: "AGENDADO",
      })
      .select("id, titulo")
      .single();

    setSalvando(false);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Eventos do Cidadão",
        acao: "ERRO",
        descricao: "Erro ao cadastrar evento do cidadão.",
        tabela: "eventos_cidadao",
        detalhes: {
          erro: error.message,
          titulo: titulo.trim(),
          tipo: tipo.trim(),
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao salvar evento.");
      return;
    }

    await registrarAuditoria({
      modulo: "Eventos do Cidadão",
      acao: "CRIAR",
      descricao: `Cadastrou o evento ${data?.titulo}.`,
      tabela: "eventos_cidadao",
      registro_id: data?.id,
      detalhes: {
        titulo: data?.titulo,
        tipo: tipo.trim(),
        data_evento: dataEvento || null,
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
      },
    });

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
          <Campo
            label="Título do evento"
            value={titulo}
            onChange={setTitulo}
          />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo de evento</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="input mt-2"
              >
                <option value="">Selecione</option>
                <option value="PALESTRA_EDUCATIVA">Palestra educativa</option>
                <option value="ACAO_COMUNITARIA">Ação comunitária</option>
                <option value="CAMPANHA_PREVENTIVA">Campanha preventiva</option>
                <option value="EDUCACAO_TRANSITO">Educação no trânsito</option>
                <option value="RONDA_ESCOLAR">Ronda escolar</option>
                <option value="EVENTO_PUBLICO">Evento público</option>
                <option value="REUNIAO_COMUNITARIA">
                  Reunião comunitária
                </option>
                <option value="OUTRAS_ATIVIDADES">Outras atividades</option>
              </select>
            </div>

            <Campo label="Local" value={local} onChange={setLocal} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Campo
              label="Data"
              type="date"
              value={dataEvento}
              onChange={setDataEvento}
            />

            <Campo
              label="Hora"
              type="time"
              value={horaEvento}
              onChange={setHoraEvento}
            />
          </div>

          <div>
            <label className="label">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={6}
              maxLength={2000}
              placeholder="Descreva o evento..."
              className="input mt-2"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              <Save size={18} />
              {salvando ? "Salvando..." : "Salvar Evento"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/sistema/portal-cidadao/eventos")}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <XCircle size={18} />
              Cancelar
            </button>
          </div>
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
  onChange: (valor: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        type={type}
        value={value}
        maxLength={type === "text" ? 180 : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="input mt-2"
      />
    </div>
  );
}