"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";

type EventoAgenda = {
  id: number;
  municipio_id: number;
  titulo: string;
  descricao: string | null;
  local: string | null;
  data_evento: string;
  hora_evento: string | null;
  status: string | null;
  criado_por: number | null;
  criado_em: string | null;
};

export default function AgendaInstitucionalPage() {
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [busca, setBusca] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [local, setLocal] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [horaEvento, setHoraEvento] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregar();

    registrarAuditoria({
      modulo: "Agenda Institucional",
      acao: "ACESSO",
      descricao: "Acessou a Agenda Institucional.",
    });
  }, []);

  async function carregar() {
    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase
      .from("agenda_institucional")
      .select(`
        id,
        municipio_id,
        titulo,
        descricao,
        local,
        data_evento,
        hora_evento,
        status,
        criado_por,
        criado_em
      `)
      .eq("municipio_id", usuario.municipio_id)
      .order("data_evento", { ascending: true })
      .limit(100);

    if (error) {
      console.error(error);
      alert("Erro ao carregar agenda.");
      setCarregando(false);
      return;
    }

    setEventos(data || []);
    setCarregando(false);
  }

  async function salvar() {
    if (!usuario?.municipio_id || !usuario?.id) {
      alert("Sessão inválida.");
      return;
    }

    if (
      !["ADMIN", "COMANDANTE", "DIRETOR"].includes(
        usuario.perfil
      )
    ) {
      alert("Você não possui permissão para criar eventos.");
      return;
    }

    if (!titulo.trim()) {
      alert("Informe o título.");
      return;
    }

    if (titulo.trim().length < 3) {
      alert("O título deve ter pelo menos 3 caracteres.");
      return;
    }

    if (!dataEvento) {
      alert("Informe a data.");
      return;
    }

    if (new Date(dataEvento) < new Date("2020-01-01")) {
      alert("Data inválida.");
      return;
    }

    setSalvando(true);

    const dados = {
      municipio_id: usuario.municipio_id,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      local: local.trim() || null,
      data_evento: dataEvento,
      hora_evento: horaEvento || null,
      status: "AGENDADO",
      criado_por: usuario.id,
    };

    const { data: criado, error } = await supabase
      .from("agenda_institucional")
      .insert([dados])
      .select("id")
      .single();

    if (error) {
      console.error(error);
      alert(error.message || "Erro ao salvar evento.");
      setSalvando(false);
      return;
    }

    await registrarAuditoria({
      modulo: "Agenda Institucional",
      acao: "CRIAR",
      descricao: `Criou o evento "${titulo.trim()}" para ${dataEvento}.`,
      tabela: "agenda_institucional",
      registro_id: criado?.id,
      detalhes: dados,
    });

    setTitulo("");
    setDescricao("");
    setLocal("");
    setDataEvento("");
    setHoraEvento("");

    await carregar();
    setSalvando(false);

    alert("Evento cadastrado com sucesso.");
  }

  async function concluir(id: number) {
    if (
      !["ADMIN", "COMANDANTE", "DIRETOR"].includes(
        usuario.perfil
      )
    ) {
      alert("Você não possui permissão.");
      return;
    }

    const evento = eventos.find((e) => e.id === id);

    const { error } = await supabase
      .from("agenda_institucional")
      .update({ status: "CONCLUIDO" })
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Agenda Institucional",
      acao: "CONCLUIR",
      descricao: `Concluiu o evento "${evento?.titulo || id}".`,
      tabela: "agenda_institucional",
      registro_id: id,
      detalhes: evento,
    });

    await carregar();
  }

  async function excluir(id: number) {
    if (!["ADMIN", "COMANDANTE"].includes(usuario.perfil)) {
      alert("Você não possui permissão para excluir.");
      return;
    }

    if (!confirm("Deseja excluir este evento?")) return;

    const motivo = prompt("Informe o motivo da exclusão:");

    if (!motivo?.trim()) {
      alert("Informe o motivo da exclusão.");
      return;
    }

    const evento = eventos.find((e) => e.id === id);

    const { error } = await supabase
      .from("agenda_institucional")
      .delete()
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Agenda Institucional",
      acao: "EXCLUIR",
      descricao: `Excluiu o evento "${evento?.titulo || id}".`,
      tabela: "agenda_institucional",
      registro_id: id,
      detalhes: {
        motivo,
        evento,
      },
    });

    await carregar();
  }

  const filtrados = eventos.filter((evento) => {
    const texto = `
      ${evento.titulo || ""}
      ${evento.descricao || ""}
      ${evento.local || ""}
      ${evento.status || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  const resumo = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);

    return {
      total: eventos.length,
      hoje: eventos.filter((e) => e.data_evento === hoje).length,
      pendentes: eventos.filter((e) => e.status === "AGENDADO").length,
      concluidos: eventos.filter((e) => e.status === "CONCLUIDO").length,
    };
  }, [eventos]);

  return (
    <ProtecaoModulo modulo="agenda_institucional">
      <div className="p-4 md:p-6 pb-24 space-y-6">
        <div className="painel-premium p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-black">
            Institucional
          </p>

          <h1 className="text-3xl md:text-4xl font-black text-white mt-2">
            📅 Agenda Institucional
          </h1>

          <p className="text-slate-400 mt-2 max-w-4xl">
            Controle de eventos, compromissos, reuniões, solenidades e atividades institucionais da Guarda Municipal.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card titulo="Total" valor={resumo.total} icone={CalendarDays} cor="text-cyan-400" />
          <Card titulo="Hoje" valor={resumo.hoje} icone={Clock} cor="text-blue-400" />
          <Card titulo="Agendados" valor={resumo.pendentes} icone={CalendarDays} cor="text-yellow-400" />
          <Card titulo="Concluídos" valor={resumo.concluidos} icone={CheckCircle} cor="text-emerald-400" />
        </div>

        <div className="grid xl:grid-cols-3 gap-6">
          <section className="painel-premium p-6 xl:col-span-1">
            <h2 className="text-2xl font-black text-white mb-4">
              Novo Evento
            </h2>

            <div className="space-y-4">
              <input
                className="input"
                placeholder="Título do evento *"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={120}
              />

              <textarea
                className="input min-h-28"
                placeholder="Descrição"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                maxLength={1000}
              />

              <input
                className="input"
                placeholder="Local"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                maxLength={120}
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  className="input"
                  value={dataEvento}
                  onChange={(e) => setDataEvento(e.target.value)}
                />

                <input
                  type="time"
                  className="input"
                  value={horaEvento}
                  onChange={(e) => setHoraEvento(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={salvar}
                disabled={salvando}
                className="sig-btn-gold w-full inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Plus className="w-5 h-5" />
                {salvando ? "Salvando..." : "Adicionar Evento"}
              </button>
            </div>
          </section>

          <section className="painel-premium p-6 xl:col-span-2">
            <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 mb-5">
              <Search className="w-5 h-5 text-slate-400" />

              <input
                className="w-full bg-transparent outline-none text-white"
                placeholder="Pesquisar por título, local, descrição ou status..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            {carregando ? (
              <p className="text-slate-400">Carregando agenda...</p>
            ) : filtrados.length === 0 ? (
              <p className="text-slate-400">Nenhum evento encontrado.</p>
            ) : (
              <div className="space-y-3">
                {filtrados.map((evento) => (
                  <div
                    key={evento.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <h3 className="text-white font-black text-lg">
                          {evento.titulo}
                        </h3>

                        <p className="text-slate-400 text-sm mt-1">
                          {evento.data_evento
                            ? new Date(evento.data_evento).toLocaleDateString(
                                "pt-BR"
                              )
                            : "-"}{" "}
                          {evento.hora_evento ? `às ${evento.hora_evento}` : ""}
                        </p>

                        <p className="text-slate-400 text-sm">
                          Local: {evento.local || "-"}
                        </p>

                        {evento.descricao && (
                          <p className="text-slate-500 text-sm mt-2">
                            {evento.descricao}
                          </p>
                        )}
                      </div>

                      <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-black text-white">
                        {evento.status || "AGENDADO"}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {evento.status !== "CONCLUIDO" && (
                        <button
                          type="button"
                          onClick={() => concluir(evento.id)}
                          className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3 py-2 text-white font-bold"
                        >
                          Concluir
                        </button>
                      )}

                      {["ADMIN", "COMANDANTE"].includes(usuario.perfil) && (
                        <button
                          type="button"
                          onClick={() => excluir(evento.id)}
                          className="rounded-xl bg-red-700 hover:bg-red-800 px-3 py-2 text-white font-bold inline-flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </ProtecaoModulo>
  );
}

function Card({
  titulo,
  valor,
  icone: Icone,
  cor,
}: {
  titulo: string;
  valor: number;
  icone: any;
  cor: string;
}) {
  return (
    <div className="painel-premium p-5">
      <Icone className={`w-8 h-8 ${cor} mb-3`} />

      <p className="text-slate-400 text-sm">{titulo}</p>

      <h2 className="text-3xl font-black text-white mt-1">
        {valor}
      </h2>
    </div>
  );
}