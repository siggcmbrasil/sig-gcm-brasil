"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Search,
} from "lucide-react";

const observacoesRetirada = [
  "Armamento conferido no ato da retirada.",
  "Material entregue para serviço ordinário.",
  "Cautela registrada para plantão operacional.",
  "Munições conferidas no ato da entrega.",
  "Servidor orientado quanto à responsabilidade administrativa.",
  "Material entregue sem alteração aparente.",
];

const observacoesDevolucao = [
  "Armamento devolvido sem alteração aparente.",
  "Material devolvido ao setor responsável.",
  "Devolução realizada após encerramento do serviço.",
  "Munições conferidas no ato da devolução.",
  "Necessária conferência complementar.",
  "Registro realizado para controle administrativo.",
];

const quantidadesRapidas = ["0", "1", "2", "5", "10", "15", "20", "25", "50"];

export default function CautelasArmamentoPage() {
  const [armamentos, setArmamentos] = useState<any[]>([]);
  const [guardas, setGuardas] = useState<any[]>([]);
  const [cautelas, setCautelas] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);

  const [armamentoId, setArmamentoId] = useState("");
  const [guardaId, setGuardaId] = useState("");
  const [tipo, setTipo] = useState("RETIRADA");
  const [quantidadeMunicao, setQuantidadeMunicao] = useState("");
  const [estadoArmamento, setEstadoArmamento] = useState("SEM_ALTERACAO");
  const [finalidade, setFinalidade] = useState("PLANTAO");
  const [responsavelConferencia, setResponsavelConferencia] = useState("");
  const [observacao, setObservacao] = useState("");


async function carregar(usuarioAtual: any) {
  setCarregando(true);

  const { data: listaArmamentos } = await supabase
    .from("armamentos")
    .select(`
      id,
      tipo,
      marca,
      modelo,
      numero_serie,
      status
    `)
    .eq(
      "municipio_id",
      usuarioAtual.municipio_id
    )
    .order("id", {
      ascending: false,
    })
    .range(0, 499);

  const { data: listaGuardas } = await supabase
    .from("guardas")
    .select(`
      id,
      nome,
      matricula,
      status
    `)
    .eq(
      "municipio_id",
      usuarioAtual.municipio_id
    )
    .order("nome");

  const {
    data: listaCautelas,
    error,
  } = await supabase
    .from("cautelas_armamento")
    .select(`
      id,
      armamento_id,
      guarda_id,
      tipo,
      quantidade_municao,
      observacao,
      criado_em
    `)
    .eq(
      "municipio_id",
      usuarioAtual.municipio_id
    )
    .order("criado_em", {
      ascending: false,
    })
    .range(0, 499);

  setCarregando(false);

  if (error) {
    await registrarAuditoria({
      modulo: "Armamentos",
      acao: "ERRO",
      descricao:
        "Erro ao carregar cautelas.",
      tabela: "cautelas_armamento",
      detalhes: {
        erro: error.message,
      },
    });

    alert(error.message);
    return;
  }

  setArmamentos(listaArmamentos || []);
  setGuardas(listaGuardas || []);
  setCautelas(listaCautelas || []);
}

  useEffect(() => {
  async function iniciar() {
    const dados = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    if (!dados?.id || !dados?.municipio_id) {
      setBloqueado(true);
      setCarregando(false);
      return;
    }

    if (
      ![
        "ADMIN",
        "COMANDANTE",
        "DIRETOR",
        "DESENVOLVEDOR",
      ].includes(dados.perfil || "")
    ) {
      setBloqueado(true);
      setCarregando(false);
      return;
    }

    setUsuario(dados);

    await registrarAuditoria({
      modulo: "Armamentos",
      acao: "ACESSO",
      descricao: "Acessou as cautelas de armamento.",
      tabela: "cautelas_armamento",
      detalhes: {
        usuario_id: dados.id,
        municipio_id: dados.municipio_id,
      },
    });

    await carregar(dados);
  }

  iniciar();
}, []);

  const resumo = useMemo(() => {
    return {
      total: cautelas.length,
      retiradas: cautelas.filter((c) => c.tipo === "RETIRADA").length,
      devolucoes: cautelas.filter((c) => c.tipo === "DEVOLUCAO").length,
      cauteladas: armamentos.filter((a) => a.status === "CAUTELADA").length,
    };
  }, [cautelas, armamentos]);

  const armamentoAtual = armamentos.find(
    (a) => String(a.id) === String(armamentoId)
  );

  const cautelasFiltradas = cautelas.filter((item) => {
    const texto = `
      ${item.tipo || ""}
      ${nomeArmamento(item.armamento_id)}
      ${nomeGuarda(item.guarda_id)}
      ${item.quantidade_municao || ""}
      ${item.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  function nomeGuarda(id: number) {
    const guarda = guardas.find((g) => Number(g.id) === Number(id));
    return guarda ? `${guarda.nome} - ${guarda.matricula || "S/M"}` : `Guarda #${id}`;
  }

  function nomeArmamento(id: number) {
    const item = armamentos.find((a) => Number(a.id) === Number(id));

    if (!item) return `Armamento #${id}`;

    return `${item.tipo || "Armamento"} ${item.marca || ""} ${
      item.modelo || ""
    } - ${item.numero_serie || "S/S"}`;
  }

  function nomeEstado(valor: string) {
    const nomes: Record<string, string> = {
      SEM_ALTERACAO: "Sem alteração aparente",
      COM_AVARIA: "Com avaria aparente",
      NECESSITA_CONFERENCIA: "Necessita conferência",
      NECESSITA_MANUTENCAO: "Necessita manutenção",
    };

    return nomes[valor] || valor;
  }

  function nomeFinalidade(valor: string) {
    const nomes: Record<string, string> = {
      PLANTAO: "Plantão",
      RONDA: "Ronda",
      OPERACAO: "Operação",
      EVENTO: "Evento",
      TREINAMENTO: "Treinamento",
      OUTRO: "Outro",
    };

    return nomes[valor] || valor;
  }

  function adicionarObservacao(texto: string) {
    setObservacao((atual) => (atual ? `${atual}\n${texto}` : texto));
  }

  function limpar() {
    setArmamentoId("");
    setGuardaId("");
    setTipo("RETIRADA");
    setQuantidadeMunicao("");
    setEstadoArmamento("SEM_ALTERACAO");
    setFinalidade("PLANTAO");
    setResponsavelConferencia("");
    setObservacao("");
  }

  async function salvar() {
 if (!armamentoId || !guardaId) {
  alert("Selecione o armamento e o guarda.");
  return;
}

if (
  tipo === "RETIRADA" &&
  armamentoAtual?.status === "CAUTELADA"
) {
  alert("Este armamento já está cautelado.");
  return;
}

if (Number(quantidadeMunicao || 0) < 0) {
  alert("Quantidade de munição inválida.");
  return;
}

    setSalvando(true);

    const obsCompleta = [
      `Estado do armamento: ${nomeEstado(estadoArmamento)}.`,
      `Finalidade: ${nomeFinalidade(finalidade)}.`,
      responsavelConferencia
        ? `Responsável pela conferência: ${responsavelConferencia}.`
        : "",
      observacao.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    const { error } = await supabase.from("cautelas_armamento").insert([
      {
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        armamento_id: Number(armamentoId),
        guarda_id: Number(guardaId),
        tipo,
        quantidade_municao: quantidadeMunicao ? Number(quantidadeMunicao) : 0,
        observacao: obsCompleta,
      },
    ]);

    if (!error) {
      await supabase
        .from("armamentos")
        .update({
          status: tipo === "RETIRADA" ? "CAUTELADA" : "DISPONIVEL",
          localizacao: tipo === "RETIRADA" ? "CAUTELADA" : "ARMARIA",
        })
        .eq("id", Number(armamentoId))
        .eq("municipio_id", usuario.municipio_id);
    }

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
  modulo: "Armamentos",
  acao:
    tipo === "RETIRADA"
      ? "CAUTELA_RETIRADA"
      : "CAUTELA_DEVOLUCAO",
  descricao: `${
    tipo === "RETIRADA"
      ? "Retirada"
      : "Devolução"
  } do armamento ${nomeArmamento(
    Number(armamentoId)
  )}.`,
  tabela: "cautelas_armamento",
  detalhes: {
    armamento_id: Number(
      armamentoId
    ),
    guarda_id: Number(guardaId),
    quantidade_municao:
      Number(quantidadeMunicao || 0),
    finalidade,
    estado_armamento:
      estadoArmamento,
  },
});

    limpar();
await carregar(usuario);
    alert("Cautela registrada com sucesso.");
  }

  if (bloqueado) {
  return (
    <div className="p-4 md:p-6">
      <div className="painel-premium p-10 text-center">
        <h2 className="text-2xl font-black text-white">
          Acesso Restrito
        </h2>

        <p className="text-slate-400 mt-2">
          Você não possui permissão
          para acessar as cautelas.
        </p>
      </div>
    </div>
  );
}

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-slate-400 font-semibold">
          Controle Administrativo
        </p>

        <h1 className="text-2xl md:text-3xl font-black text-white">
          🧾 Cautelas de Armamento
        </h1>

        <p className="text-slate-400 mt-2">
          Registro de retirada, devolução, conferência e histórico administrativo.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="Cautelas" valor={String(resumo.total)} icone={ClipboardList} />
        <Card titulo="Retiradas" valor={String(resumo.retiradas)} icone={AlertTriangle} />
        <Card titulo="Devoluções" valor={String(resumo.devolucoes)} icone={RotateCcw} />
        <Card titulo="Cauteladas" valor={String(resumo.cauteladas)} icone={CheckCircle} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">Nova Cautela</h2>

          <div className="space-y-4 mt-5">
            <div>
              <label className="label">Armamento</label>
              <select
                className="input"
                value={armamentoId}
                onChange={(e) => setArmamentoId(e.target.value)}
              >
                <option value="">Selecione o armamento</option>

                {armamentos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.tipo} - {a.marca} {a.modelo} -{" "}
                    {a.numero_serie || "S/S"} • {a.status}
                  </option>
                ))}
              </select>
            </div>

            {armamentoAtual && (
              <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4">
                <p className="text-slate-400 text-sm">Selecionado</p>
                <p className="text-white font-black">
                  {nomeArmamento(armamentoAtual.id)}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Status atual: {armamentoAtual.status || "N/I"}
                </p>
              </div>
            )}

            <div>
              <label className="label">Guarda responsável</label>
              <select
                className="input"
                value={guardaId}
                onChange={(e) => setGuardaId(e.target.value)}
              >
                <option value="">Selecione o guarda</option>

                {guardas.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome} - {g.matricula || "S/M"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="RETIRADA">Retirada</option>
                <option value="DEVOLUCAO">Devolução</option>
              </select>
            </div>

            <div>
              <label className="label">Finalidade</label>
              <select
                className="input"
                value={finalidade}
                onChange={(e) => setFinalidade(e.target.value)}
              >
                <option value="PLANTAO">Plantão</option>
                <option value="RONDA">Ronda</option>
                <option value="OPERACAO">Operação</option>
                <option value="EVENTO">Evento</option>
                <option value="TREINAMENTO">Treinamento</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div>
              <label className="label">Estado</label>
              <select
                className="input"
                value={estadoArmamento}
                onChange={(e) => setEstadoArmamento(e.target.value)}
              >
                <option value="SEM_ALTERACAO">Sem alteração aparente</option>
                <option value="COM_AVARIA">Com avaria aparente</option>
                <option value="NECESSITA_CONFERENCIA">Necessita conferência</option>
                <option value="NECESSITA_MANUTENCAO">Necessita manutenção</option>
              </select>
            </div>

            <Campo
              label="Quantidade de munições"
              valor={quantidadeMunicao}
              setValor={(valor) => setQuantidadeMunicao(valor.replace(/\D/g, ""))}
              placeholder="Ex: 10"
              type="number"
            />

            <div>
              <label className="label">Quantidades rápidas</label>

              <div className="flex flex-wrap gap-2 mt-2">
                {quantidadesRapidas.map((qtd) => (
                  <button
                    key={qtd}
                    type="button"
                    onClick={() => setQuantidadeMunicao(qtd)}
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-yellow-500"
                  >
                    {qtd}
                  </button>
                ))}
              </div>
            </div>

            <Campo
              label="Responsável pela conferência"
              valor={responsavelConferencia}
              setValor={setResponsavelConferencia}
              placeholder="Nome do responsável"
            />

            <div>
              <label className="label">Observações</label>
              <textarea
                className="input min-h-[120px]"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observações administrativas..."
              />
            </div>

            <div>
              <label className="label">Observações rápidas</label>

              <div className="flex flex-wrap gap-2 mt-2">
                {(tipo === "RETIRADA"
                  ? observacoesRetirada
                  : observacoesDevolucao
                ).map((texto) => (
                  <button
                    key={texto}
                    type="button"
                    onClick={() => adicionarObservacao(texto)}
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-yellow-500"
                  >
                    {texto}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={salvar}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Registrar Cautela"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-5 h-5 text-slate-400" />
              <h2 className="text-xl font-black text-white">
                Histórico de Cautelas
              </h2>
            </div>

            <input
              className="input"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por guarda, armamento, tipo ou observação..."
            />
          </div>

          {cautelasFiltradas.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">🧾</p>
              <h2 className="text-white text-xl font-black">
                Nenhuma cautela encontrada
              </h2>
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {cautelasFiltradas.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                >
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        item.tipo === "RETIRADA"
                          ? "bg-yellow-950 text-yellow-300 border-yellow-800"
                          : "bg-green-950 text-green-300 border-green-800"
                      }`}
                    >
                      {item.tipo === "RETIRADA" ? "Retirada" : "Devolução"}
                    </span>

                    <span className="bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold text-slate-300">
                      Munições: {item.quantidade_municao || 0}
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-white">
                    {nomeGuarda(item.guarda_id)}
                  </h2>

                  <p className="text-slate-300 mt-2">
                    {nomeArmamento(item.armamento_id)}
                  </p>

                  {item.observacao && (
                    <p className="text-slate-400 mt-3 whitespace-pre-wrap text-sm">
                      {item.observacao}
                    </p>
                  )}

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

function Campo({
  label,
  valor,
  setValor,
  placeholder,
  type = "text",
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Card({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: string;
  icone: any;
}) {
  return (
    <div className="painel-premium p-5">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h2 className="text-2xl md:text-3xl font-black text-white">{valor}</h2>
        </div>

        <Icone className="w-7 h-7 text-yellow-400" />
      </div>
    </div>
  );
}