"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import { Wrench, CheckCircle, Clock, AlertTriangle, Search } from "lucide-react";

const observacoesRapidas = [
  "Encaminhado para avaliação técnica.",
  "Necessita manutenção preventiva.",
  "Necessita manutenção corretiva.",
  "Retirado temporariamente de uso.",
  "Aguardando responsável técnico.",
  "Após manutenção, realizar nova conferência.",
  "Manutenção registrada para controle administrativo.",
];

export default function ManutencaoArmamentoPage() {
  const [armamentos, setArmamentos] = useState<any[]>([]);
  const [manutencoes, setManutencoes] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [armamentoId, setArmamentoId] = useState("");
  const [tipo, setTipo] = useState("PREVENTIVA");
  const [status, setStatus] = useState("ABERTA");
  const [oficina, setOficina] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    if (!usuario?.municipio_id) return;

    const { data: listaArmamentos } = await supabase
      .from("armamentos")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false });

    const { data: listaManutencoes } = await supabase
      .from("manutencoes_armamento")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setArmamentos(listaArmamentos || []);
    setManutencoes(listaManutencoes || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    return {
      total: manutencoes.length,
      abertas: manutencoes.filter((m) => m.status === "ABERTA").length,
      andamento: manutencoes.filter((m) => m.status === "EM_ANDAMENTO").length,
      finalizadas: manutencoes.filter((m) => m.status === "FINALIZADA").length,
    };
  }, [manutencoes]);

  const manutencoesFiltradas = manutencoes.filter((item) => {
    const texto = `
      ${nomeArmamento(item.armamento_id)}
      ${item.tipo || ""}
      ${item.status || ""}
      ${item.oficina || ""}
      ${item.descricao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  function nomeArmamento(id: number) {
    const item = armamentos.find((a) => Number(a.id) === Number(id));

    if (!item) return `Armamento #${id}`;

    return `${item.tipo || "Armamento"} ${item.marca || ""} ${
      item.modelo || ""
    } - ${item.numero_serie || "S/S"}`;
  }

  function adicionarObservacao(texto: string) {
    setDescricao((atual) => (atual ? `${atual}\n${texto}` : texto));
  }

  function limpar() {
    setArmamentoId("");
    setTipo("PREVENTIVA");
    setStatus("ABERTA");
    setOficina("");
    setValor("");
    setDescricao("");
  }

  async function salvar() {
  if (!armamentoId) return alert("Selecione o armamento.");
  if (!descricao.trim()) return alert("Descreva a manutenção.");

  setSalvando(true);

  const { error } = await supabase.from("manutencoes_armamento").insert([
    {
      municipio_id: usuario.municipio_id,
      criado_por: usuario.id,
      armamento_id: Number(armamentoId),
      tipo,
      status,
      oficina: oficina.trim() || null,
      valor: valor ? Number(valor) : 0,
      descricao: descricao.trim(),
    },
  ]);

  setSalvando(false);

  if (error) {
    alert(error.message);
    return;
  }

  await supabase
    .from("armamentos")
    .update({
      status:
        status === "FINALIZADA"
          ? "DISPONIVEL"
          : "MANUTENCAO",
      localizacao:
        status === "FINALIZADA"
          ? "ARMARIA"
          : "MANUTENCAO",
    })
    .eq("id", Number(armamentoId))
    .eq("municipio_id", usuario.municipio_id);

  await registrarAuditoria({
    modulo: "Armamentos",
    acao: "ALTERAR_STATUS_ARMAMENTO",
    descricao: `Status do armamento ${nomeArmamento(
      Number(armamentoId)
    )} alterado para ${
      status === "FINALIZADA" ? "DISPONIVEL" : "MANUTENCAO"
    }.`,
  });

  await registrarAuditoria({
    modulo: "Armamentos",
    acao: "REGISTRAR_MANUTENCAO",
    descricao: `Registrou manutenção ${nomeTipo(
      tipo
    )} do armamento ${nomeArmamento(
      Number(armamentoId)
    )}. Status: ${nomeStatus(
      status
    )}. Oficina: ${
      oficina || "Não informada"
    }. Valor: R$ ${valor || "0"}.`,
  });

  limpar();
  carregar();
  alert("Manutenção registrada com sucesso.");
}

  function nomeTipo(valor: string) {
    const nomes: Record<string, string> = {
      PREVENTIVA: "Preventiva",
      CORRETIVA: "Corretiva",
      AVALIACAO: "Avaliação",
      LIMPEZA: "Limpeza técnica",
      DOCUMENTAL: "Documental",
      OUTRO: "Outro",
    };

    return nomes[valor] || valor;
  }

  function nomeStatus(valor: string) {
    const nomes: Record<string, string> = {
      ABERTA: "Aberta",
      EM_ANDAMENTO: "Em andamento",
      FINALIZADA: "Finalizada",
      CANCELADA: "Cancelada",
    };

    return nomes[valor] || valor;
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-slate-400 font-semibold">
          Controle Administrativo
        </p>

        <h1 className="text-2xl md:text-3xl font-black text-white">
          🛠️ Manutenção de Armamento
        </h1>

        <p className="text-slate-400 mt-2">
          Registro de manutenção, avaliação, limpeza técnica e retirada temporária de uso.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="Registros" valor={String(resumo.total)} icone={Wrench} />
        <Card titulo="Abertas" valor={String(resumo.abertas)} icone={AlertTriangle} />
        <Card titulo="Em andamento" valor={String(resumo.andamento)} icone={Clock} />
        <Card titulo="Finalizadas" valor={String(resumo.finalizadas)} icone={CheckCircle} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">Nova Manutenção</h2>

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
                    {a.tipo} - {a.marca} {a.modelo} - {a.numero_serie || "S/S"} • {a.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Tipo</label>
              <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="PREVENTIVA">Preventiva</option>
                <option value="CORRETIVA">Corretiva</option>
                <option value="AVALIACAO">Avaliação</option>
                <option value="LIMPEZA">Limpeza técnica</option>
                <option value="DOCUMENTAL">Documental</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ABERTA">Aberta</option>
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="FINALIZADA">Finalizada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <Campo label="Oficina / Responsável" valor={oficina} setValor={setOficina} />
            <Campo label="Valor" valor={valor} setValor={setValor} placeholder="Ex: 150.00" />

            <div>
              <label className="label">Descrição</label>
              <textarea
                className="input min-h-[120px]"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva a manutenção..."
              />
            </div>

            <div>
              <label className="label">Preenchimento rápido</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {observacoesRapidas.map((texto) => (
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

            <button onClick={salvar} disabled={salvando} className="sig-btn-gold w-full disabled:opacity-50">
              {salvando ? "Salvando..." : "Registrar Manutenção"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-5 h-5 text-slate-400" />
              <h2 className="text-xl font-black text-white">Histórico de Manutenções</h2>
            </div>

            <input
              className="input"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por armamento, tipo, status ou descrição..."
            />
          </div>

          {manutencoesFiltradas.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">🛠️</p>
              <h2 className="text-white text-xl font-black">Nenhuma manutenção encontrada</h2>
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {manutencoesFiltradas.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl">
                  <div className="flex justify-between gap-3 mb-3">
                    <div>
                      <p className="text-slate-400 text-sm">{nomeTipo(item.tipo)}</p>
                      <h3 className="text-xl font-black text-white">
                        {nomeArmamento(item.armamento_id)}
                      </h3>
                    </div>

                    <span className="h-fit rounded-full bg-yellow-950 text-yellow-300 border border-yellow-800 px-3 py-1 text-xs font-bold">
                      {nomeStatus(item.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Info titulo="Oficina" valor={item.oficina || "N/I"} />
                    <Info titulo="Valor" valor={`R$ ${item.valor || 0}`} />
                    <Info titulo="Status" valor={nomeStatus(item.status)} />
                    <Info
                      titulo="Data"
                      valor={item.criado_em ? new Date(item.criado_em).toLocaleDateString("pt-BR") : "N/I"}
                    />
                  </div>

                  <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap">
                    {item.descricao}
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
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={valor} onChange={(e) => setValor(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function Card({ titulo, valor, icone: Icone }: { titulo: string; valor: string; icone: any }) {
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

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-3">
      <p className="text-slate-500 text-xs">{titulo}</p>
      <p className="text-slate-200 font-bold text-sm">{valor}</p>
    </div>
  );
}