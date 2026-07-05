"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

type OficioRecebido = {
  id: number;
  numero: string;
  orgao_remetente: string;
  assunto: string;
  tipo: string;
  status: string;
  data_recebimento: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  observacao: string | null;
  criado_em: string;
};

const PERFIS_AUTORIZADOS = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "PLANTONISTA",
];

const TIPOS = [
  "EVENTO",
  "OPERACAO",
  "SOLICITACAO",
  "CONVITE",
  "DETERMINACAO",
  "REUNIAO",
  "OUTRO",
];

const STATUS = [
  "RECEBIDO",
  "EM_ANDAMENTO",
  "CONCLUIDO",
  "ARQUIVADO",
];

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

export default function OficiosRecebidosPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [oficios, setOficios] = useState<OficioRecebido[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [erroTela, setErroTela] = useState("");

  const [numero, setNumero] = useState("");
  const [orgao, setOrgao] = useState("");
  const [assunto, setAssunto] = useState("");
  const [tipo, setTipo] = useState("EVENTO");
  const [status, setStatus] = useState("RECEBIDO");
  const [dataRecebimento, setDataRecebimento] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [observacao, setObservacao] = useState("");

  function limparFormulario() {
    setNumero("");
    setOrgao("");
    setAssunto("");
    setTipo("EVENTO");
    setStatus("RECEBIDO");
    setDataRecebimento("");
    setDataInicio("");
    setDataFim("");
    setObservacao("");
  }

  async function carregar(usuarioAtual?: UsuarioLogado) {
    const usuarioBase = usuarioAtual || usuario;

    if (!usuarioBase) {
      setErroTela("Sessão inválida. Faça login novamente.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErroTela("");

    const { data, error } = await supabase
      .from("oficios_recebidos")
      .select(
        "id, numero, orgao_remetente, assunto, tipo, status, data_recebimento, data_inicio, data_fim, observacao, criado_em"
      )
      .eq("municipio_id", usuarioBase.municipio_id)
      .order("criado_em", { ascending: false })
      .limit(100);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Ofícios Recebidos",
        acao: "ERRO",
        descricao: "Erro ao carregar ofícios recebidos.",
        tabela: "oficios_recebidos",
        detalhes: {
          erro: error.message,
          municipio_id: usuarioBase.municipio_id,
        },
      });

      setErroTela("Erro ao carregar ofícios recebidos.");
      setCarregando(false);
      return;
    }

    setOficios(data || []);
    setCarregando(false);
  }

  async function iniciar() {
    const usuarioAtual = obterUsuarioLogado();

    if (!usuarioAtual) {
      setErroTela("Sessão inválida. Faça login novamente.");
      setCarregando(false);
      return;
    }

    if (!PERFIS_AUTORIZADOS.includes(usuarioAtual.perfil)) {
      setErroTela("Você não possui permissão para acessar este módulo.");
      setCarregando(false);
      return;
    }

    setUsuario(usuarioAtual);

    await registrarAuditoria({
      modulo: "Ofícios Recebidos",
      acao: "ACESSO",
      descricao: "Acessou a página de ofícios recebidos.",
      tabela: "oficios_recebidos",
      detalhes: {
        municipio_id: usuarioAtual.municipio_id,
        usuario_id: usuarioAtual.id,
        perfil: usuarioAtual.perfil,
      },
    });

    await carregar(usuarioAtual);
  }

  useEffect(() => {
    void iniciar();
  }, []);

  async function salvar() {
    if (!usuario) {
      alert("Sessão inválida.");
      return;
    }

    if (!PERFIS_AUTORIZADOS.includes(usuario.perfil)) {
      alert("Você não possui permissão.");
      return;
    }

    if (!numero.trim() || !orgao.trim() || !assunto.trim()) {
      alert("Preencha número, órgão remetente e assunto.");
      return;
    }

    if (!TIPOS.includes(tipo)) {
      alert("Tipo inválido.");
      return;
    }

    if (!STATUS.includes(status)) {
      alert("Status inválido.");
      return;
    }

    if (assunto.trim().length < 5) {
      alert("O assunto está muito curto.");
      return;
    }

    if (dataInicio && dataFim && dataFim < dataInicio) {
      alert("A data final não pode ser anterior à data inicial.");
      return;
    }

    setSalvando(true);

    const { data: existente } = await supabase
      .from("oficios_recebidos")
      .select("id")
      .eq("municipio_id", usuario.municipio_id)
      .eq("numero", numero.trim())
      .maybeSingle();

    if (existente) {
      setSalvando(false);
      alert("Já existe um ofício recebido com este número neste município.");
      return;
    }

    const { data, error } = await supabase
      .from("oficios_recebidos")
      .insert([
        {
          municipio_id: usuario.municipio_id,
          criado_por: usuario.id,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
          numero: numero.trim(),
          orgao_remetente: orgao.trim(),
          assunto: assunto.trim(),
          tipo,
          status,
          data_recebimento: dataRecebimento || null,
          data_inicio: dataInicio || null,
          data_fim: dataFim || null,
          observacao: observacao.trim() || null,
        },
      ])
      .select("id, numero")
      .single();

    setSalvando(false);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Ofícios Recebidos",
        acao: "ERRO",
        descricao: "Erro ao cadastrar ofício recebido.",
        tabela: "oficios_recebidos",
        detalhes: {
          erro: error.message,
          numero,
          municipio_id: usuario.municipio_id,
        },
      });

      alert("Erro ao cadastrar ofício recebido.");
      return;
    }

    await registrarAuditoria({
      modulo: "Ofícios Recebidos",
      acao: "CRIAR",
      descricao: `Cadastrou o ofício recebido nº ${data?.numero}.`,
      tabela: "oficios_recebidos",
      registro_id: data?.id,
      detalhes: {
        numero: data?.numero,
        orgao_remetente: orgao.trim(),
        assunto: assunto.trim(),
        tipo,
        status,
        municipio_id: usuario.municipio_id,
      },
    });

    limparFormulario();
    await carregar(usuario);
  }

  async function excluir(id: number) {
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
      ].includes(usuario.perfil)
    ) {
      alert("Você não possui permissão para excluir.");
      return;
    }

    const motivo = prompt("Informe o motivo da exclusão:");

    if (!motivo?.trim()) {
      alert("Informe o motivo da exclusão.");
      return;
    }

    const item = oficios.find((o) => o.id === id);

    if (!item) {
      alert("Registro não encontrado.");
      return;
    }

    const confirmar = confirm("Confirma excluir este ofício recebido?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("oficios_recebidos")
      .delete()
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Ofícios Recebidos",
        acao: "ERRO",
        descricao: "Erro ao excluir ofício recebido.",
        tabela: "oficios_recebidos",
        registro_id: id,
        detalhes: {
          erro: error.message,
          motivo,
          municipio_id: usuario.municipio_id,
        },
      });

      alert("Erro ao excluir.");
      return;
    }

    await registrarAuditoria({
      modulo: "Ofícios Recebidos",
      acao: "EXCLUIR",
      descricao: `Excluiu o ofício recebido nº ${item.numero}.`,
      tabela: "oficios_recebidos",
      registro_id: id,
      detalhes: {
        motivo,
        item,
        municipio_id: usuario.municipio_id,
      },
    });

    await carregar(usuario);
  }

  const oficiosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return oficios;

    return oficios.filter((item) => {
      const texto = `
        ${item.numero}
        ${item.orgao_remetente}
        ${item.assunto}
        ${item.tipo}
        ${item.status}
        ${item.observacao || ""}
      `.toLowerCase();

      return texto.includes(termo);
    });
  }, [busca, oficios]);

  function corStatus(s: string) {
    if (s === "CONCLUIDO") return "bg-green-700";
    if (s === "EM_ANDAMENTO") return "bg-blue-700";
    if (s === "ARQUIVADO") return "bg-slate-700";
    return "bg-yellow-700";
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black">Ofícios Recebidos</h1>
        <p className="text-slate-400 mt-2">
          Controle de ofícios, eventos, solicitações e comunicações externas.
        </p>
      </div>

      {erroTela && (
        <div className="painel-premium p-5 border border-red-500/40">
          <p className="text-red-400 font-bold">{erroTela}</p>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <div className="painel-premium p-5 text-center">
          <p className="text-3xl font-black text-cyan-400">
            {oficios.length}
          </p>
          <p className="text-slate-400 text-sm">Total</p>
        </div>

        <div className="painel-premium p-5 text-center">
          <p className="text-3xl font-black text-yellow-400">
            {oficios.filter((o) => o.status === "RECEBIDO").length}
          </p>
          <p className="text-slate-400 text-sm">Recebidos</p>
        </div>

        <div className="painel-premium p-5 text-center">
          <p className="text-3xl font-black text-blue-400">
            {oficios.filter((o) => o.status === "EM_ANDAMENTO").length}
          </p>
          <p className="text-slate-400 text-sm">Em andamento</p>
        </div>

        <div className="painel-premium p-5 text-center">
          <p className="text-3xl font-black text-green-400">
            {oficios.filter((o) => o.status === "CONCLUIDO").length}
          </p>
          <p className="text-slate-400 text-sm">Concluídos</p>
        </div>
      </div>

      <div className="painel-premium p-6">
        <h2 className="text-xl font-black mb-4">Cadastrar Ofício</h2>

        <div className="grid md:grid-cols-3 gap-4">
          <input
            className="input"
            placeholder="Número do ofício"
            value={numero}
            maxLength={40}
            onChange={(e) => setNumero(e.target.value)}
          />

          <input
            className="input"
            placeholder="Órgão remetente"
            value={orgao}
            maxLength={120}
            onChange={(e) => setOrgao(e.target.value)}
          />

          <input
            className="input"
            placeholder="Assunto"
            value={assunto}
            maxLength={180}
            onChange={(e) => setAssunto(e.target.value)}
          />

          <select
            className="input"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="EVENTO">Evento</option>
            <option value="OPERACAO">Operação</option>
            <option value="SOLICITACAO">Solicitação</option>
            <option value="CONVITE">Convite</option>
            <option value="DETERMINACAO">Determinação</option>
            <option value="REUNIAO">Reunião</option>
            <option value="OUTRO">Outro</option>
          </select>

          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="RECEBIDO">Recebido</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="ARQUIVADO">Arquivado</option>
          </select>

          <input
            className="input"
            type="date"
            value={dataRecebimento}
            onChange={(e) => setDataRecebimento(e.target.value)}
          />

          <input
            className="input"
            type="datetime-local"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <input
            className="input"
            type="datetime-local"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

        <textarea
          className="input mt-4 min-h-32"
          placeholder="Observações"
          value={observacao}
          maxLength={1000}
          onChange={(e) => setObservacao(e.target.value)}
        />

        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="sig-btn-gold mt-4 disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Cadastrar Ofício Recebido"}
        </button>
      </div>

      <div className="painel-premium p-6">
        <input
          className="input"
          placeholder="Buscar por número, órgão, assunto, tipo ou status..."
          value={busca}
          maxLength={80}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {carregando ? (
        <div className="painel-premium p-10 text-center text-slate-400">
          Carregando ofícios recebidos...
        </div>
      ) : oficiosFiltrados.length === 0 ? (
        <div className="painel-premium p-10 text-center text-slate-400">
          Nenhum ofício recebido encontrado.
        </div>
      ) : (
        <div className="space-y-4">
          {oficiosFiltrados.map((item) => (
            <div key={item.id} className="painel-premium p-5">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                  {item.tipo}
                </span>

                <span
                  className={`${corStatus(
                    item.status
                  )} px-3 py-1 rounded-full text-xs font-bold`}
                >
                  {item.status}
                </span>
              </div>

              <h2 className="text-xl font-black">Ofício nº {item.numero}</h2>

              <p className="text-yellow-400 font-bold mt-1">
                {item.orgao_remetente}
              </p>

              <p className="text-slate-200 mt-2">{item.assunto}</p>

              {item.observacao && (
                <p className="text-slate-400 mt-3 whitespace-pre-wrap">
                  {item.observacao}
                </p>
              )}

              <p className="text-xs text-slate-500 mt-4">
                Recebido em:{" "}
                {item.data_recebimento
                  ? new Date(item.data_recebimento).toLocaleDateString("pt-BR")
                  : "Não informado"}
              </p>

              {[
                "DESENVOLVEDOR",
                "ADMIN",
                "COMANDANTE",
                "DIRETOR",
              ].includes(usuario?.perfil || "") && (
                <button
                  type="button"
                  onClick={() => excluir(item.id)}
                  className="mt-4 rounded-xl bg-red-700 hover:bg-red-800 px-4 py-2 text-sm font-bold"
                >
                  Excluir
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}