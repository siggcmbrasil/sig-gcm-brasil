"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import { criarPatrulhamentoV2 } from "@/lib/patrulhamento/criarPatrulhamento";

type Guarda = {
  id: number;
  matricula: string;
  nome: string;
  cargo: string;
  status: string;
};

type Viatura = {
  id: number;
  prefixo: string;
  modelo: string;
  placa: string;
  status: string;
};

type GuarnicaoCompleta = {
  id: number;
  nome: string;
  comandante_id: number | null;
  viatura_id: number | null;
};

export default function NovoPatrulhamentoPage() {
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [guarnicoesServico, setGuarnicoesServico] = useState<GuarnicaoCompleta[]>([]);
  const [guardasSelecionados, setGuardasSelecionados] = useState<string[]>([]);

  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [local, setLocal] = useState("");
  const [viatura, setViatura] = useState("");
  const [observacao, setObservacao] = useState("");
  const [guarnicaoSelecionadaId, setGuarnicaoSelecionadaId] = useState("");

  const [mostrarListaGuardas, setMostrarListaGuardas] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";
  const podeEditar = perfilUsuario !== "CONSULTA";

  if (!usuarioLogado?.municipio_id) {
    return <div className="p-6">Município não identificado.</div>;
  }

  async function carregarGuardas() {
    const { data, error } = await supabase
      .from("guardas")
      .select("id, matricula, nome, cargo, status")
      .eq("municipio_id", usuarioLogado.municipio_id)
      .order("nome", { ascending: true });

    if (error) {
      alert("Erro ao carregar guardas.");
      return;
    }

    setGuardas(data || []);
  }

  async function carregarViaturas() {
    const { data, error } = await supabase
      .from("viaturas")
      .select("id, prefixo, modelo, placa, status")
      .eq("municipio_id", usuarioLogado.municipio_id)
      .in("status", ["Operacional", "Reserva"])
      .order("prefixo", { ascending: true });

    if (error) {
      alert("Erro ao carregar viaturas.");
      return;
    }

    setViaturas(data || []);
  }

  async function carregarPlantaoAutomatico() {
    const municipioId = usuarioLogado.municipio_id;

    const { data: configEscala } = await supabase
      .from("escala_operacional_config")
      .select("*")
      .eq("municipio_id", municipioId)
      .eq("ativo", true)
      .single();

    const { data: guarnicoes } = await supabase
      .from("guarnicoes")
      .select("id, nome, comandante_id, viatura_id")
      .eq("municipio_id", municipioId)
      .eq("ativa", true);

    if (!configEscala || !guarnicoes || !configEscala.ordem_guarnicoes?.length) {
      return;
    }

    const dataBase = new Date(`${configEscala.data_base}T07:00:00`);
    const agora = new Date();

    const diasPassados = Math.floor(
      (agora.getTime() - dataBase.getTime()) / (1000 * 60 * 60 * 24)
    );

    const ordem = configEscala.ordem_guarnicoes;

    const indiceBase = ordem.findIndex(
      (id: number) => Number(id) === Number(configEscala.guarnicao_base_id)
    );

    if (indiceBase === -1) return;

    const indiceAtual =
      ((indiceBase + diasPassados) % ordem.length + ordem.length) %
      ordem.length;

    const guarnicaoAtual = guarnicoes.find(
      (g: GuarnicaoCompleta) => Number(g.id) === Number(ordem[indiceAtual])
    );

    if (!guarnicaoAtual) return;

    setGuarnicoesServico([guarnicaoAtual]);
    setGuarnicaoSelecionadaId(String(guarnicaoAtual.id));
    setLocal(`Patrulhamento preventivo - ${guarnicaoAtual.nome}`);

    if (guarnicaoAtual.viatura_id) {
      const { data: viaturaAtual } = await supabase
        .from("viaturas")
        .select("id, prefixo, modelo, placa, status")
        .eq("municipio_id", municipioId)
        .eq("id", guarnicaoAtual.viatura_id)
        .single();

      if (viaturaAtual) {
        setViatura(viaturaAtual.prefixo);
      }
    }

    const { data: membros } = await supabase
      .from("guarnicao_membros")
      .select(`
        guarda_id,
        guardas!inner (
          nome,
          municipio_id
        )
      `)
      .eq("guarnicao_id", guarnicaoAtual.id)
      .eq("guardas.municipio_id", municipioId);

    const nomes = (membros || [])
      .map((m: any) => m.guardas?.nome)
      .filter(Boolean);

    setGuardasSelecionados(nomes);
  }

  async function selecionarGuarnicaoServico(guarnicaoId: string) {
    setGuarnicaoSelecionadaId(guarnicaoId);

    const guarnicao = guarnicoesServico.find(
      (g) => Number(g.id) === Number(guarnicaoId)
    );

    if (!guarnicao) return;

    setLocal(`Patrulhamento preventivo - ${guarnicao.nome}`);

    if (guarnicao.viatura_id) {
      const { data: viaturaAtual } = await supabase
        .from("viaturas")
        .select("id, prefixo, modelo, placa, status")
        .eq("municipio_id", usuarioLogado.municipio_id)
        .eq("id", guarnicao.viatura_id)
        .single();

      if (viaturaAtual) {
        setViatura(viaturaAtual.prefixo);
      }
    }

    const { data: membros } = await supabase
      .from("guarnicao_membros")
      .select(`
        guarda_id,
        guardas!inner (
          nome,
          municipio_id
        )
      `)
      .eq("guarnicao_id", guarnicao.id)
      .eq("guardas.municipio_id", usuarioLogado.municipio_id);

    const nomes = (membros || [])
      .map((m: any) => m.guardas?.nome)
      .filter(Boolean);

    setGuardasSelecionados(nomes);
  }

  function selecionarGuarda(nome: string) {
    if (guardasSelecionados.includes(nome)) {
      setGuardasSelecionados(
        guardasSelecionados.filter((item) => item !== nome)
      );
      return;
    }

    setGuardasSelecionados([...guardasSelecionados, nome]);
  }

  async function salvarPatrulhamento() {
    if (!podeEditar) {
      alert("Você não possui permissão para registrar patrulhamentos.");
      return;
    }

    const equipe = guardasSelecionados.join("\n");
    const guardaPrincipal = guardasSelecionados[0];

    if (!data || !hora || !local || !guardaPrincipal) {
      alert("Preencha data, hora, local e equipe/guarda.");
      return;
    }

    setSalvando(true);

    try {
      const novo = await criarPatrulhamentoV2({
        usuarioLogado,
        data,
        hora,
        local,
        guarda: guardaPrincipal,
        equipe,
        viatura,
        observacao,
      });

      await registrarAuditoria({
        modulo: "Patrulhamento",
        acao: "CRIAR",
        descricao: `Iniciou patrulhamento em ${local}.`,
        tabela: "patrulhamentos",
        registro_id: novo.id,
        detalhes: {
          municipio_id: usuarioLogado.municipio_id,
          usuario_id: Number(usuarioLogado.id),
          viatura,
          equipe,
        },
      });

      alert("Patrulhamento iniciado com sucesso!");
      window.location.href = `/sistema/patrulhamento/${novo.id}`;
    } catch (error: any) {
      console.error("Erro ao iniciar patrulhamento:", error);
      alert(error?.message || "Erro ao iniciar patrulhamento.");
    } finally {
      setSalvando(false);
    }
  }

  useEffect(() => {
    const agora = new Date();

    setData(agora.toISOString().split("T")[0]);

    setHora(
      agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );

    void carregarGuardas();
    void carregarViaturas();
    void carregarPlantaoAutomatico();
  }, []);

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="mb-6">
        <div className="flex flex-col gap-4 border-b border-slate-800 pb-5">
          <Link
            href="/sistema/patrulhamento"
            className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300"
          >
            <ArrowLeft size={18} />
            Voltar para Patrulhamentos
          </Link>

          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Novo Patrulhamento
            </h1>

            <p className="text-slate-400 text-base md:text-lg mt-1">
              Registre e inicie um patrulhamento com GPS obrigatório.
            </p>
          </div>
        </div>
      </header>

      <section className="card max-w-4xl">
        <h2 className="text-xl md:text-2xl font-bold mb-4">
          Dados do Patrulhamento
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Data</label>
              <input
                type="date"
                className="input"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Hora</label>
              <input
                type="time"
                className="input"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Local / Área patrulhada</label>
            <input
              className="input"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex: Centro, Praça Principal, Zona Rural..."
            />
          </div>

          <div>
            <label className="label">Viatura</label>
            <select
              className="input"
              value={viatura}
              onChange={(e) => setViatura(e.target.value)}
            >
              <option value="">Selecione uma viatura</option>

              {viaturas.map((v) => (
                <option key={v.id} value={v.prefixo}>
                  {v.prefixo} • {v.modelo} • {v.placa} • {v.status}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <label className="label">Guarnição de serviço</label>

            <select
              className="input mb-3"
              value={guarnicaoSelecionadaId}
              onChange={(e) => selecionarGuarnicaoServico(e.target.value)}
            >
              <option value="">Selecione a guarnição</option>

              {guarnicoesServico.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              ))}
            </select>

            {guardasSelecionados.length > 0 && (
              <div className="mb-3 rounded-xl border border-cyan-700 bg-cyan-950/30 p-3">
                <p className="font-semibold text-cyan-300 mb-2">
                  Equipe selecionada
                </p>

                <div className="space-y-1">
                  {guardasSelecionados.map((nome) => (
                    <p key={nome} className="text-sm text-slate-200">
                      👮 {nome}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMostrarListaGuardas(!mostrarListaGuardas)}
              className="btn-secondary w-full"
            >
              {mostrarListaGuardas ? "Ocultar guardas" : "+ Adicionar guarda extra"}
            </button>

            {mostrarListaGuardas && (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 mt-3">
                {guardas.map((g) => (
                  <label
                    key={g.id}
                    className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 flex gap-3 items-start cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={guardasSelecionados.includes(g.nome)}
                      onChange={() => selecionarGuarda(g.nome)}
                      className="mt-1"
                    />

                    <div>
                      <p className="font-bold">{g.nome}</p>
                      <p className="text-sm text-slate-400">
                        {g.matricula} • {g.cargo}
                      </p>
                      <p className="text-xs text-blue-400">{g.status}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label">Observação</label>
            <textarea
              className="input h-32 resize-none"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Patrulhamento preventivo sem alterações."
            />
          </div>

          <button
            type="button"
            onClick={salvarPatrulhamento}
            disabled={salvando}
            className="btn-primary w-full text-lg disabled:opacity-50"
          >
            {salvando
              ? "Capturando GPS e iniciando..."
              : "🚔 Registrar e Iniciar Patrulhamento"}
          </button>
        </div>
      </section>
    </div>
  );
}