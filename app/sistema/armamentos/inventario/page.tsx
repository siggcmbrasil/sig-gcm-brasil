"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Archive,
  CheckCircle,
  AlertTriangle,
  Search,
  ShieldCheck,
} from "lucide-react";

const observacoesRapidas = [
  "Conferência realizada sem alteração aparente.",
  "Item localizado e conferido.",
  "Numeração conferida.",
  "Item necessita conferência complementar.",
  "Item com divergência no cadastro.",
  "Item necessita manutenção.",
  "Item não localizado fisicamente.",
  "Inventário realizado pelo responsável do setor.",
];

export default function InventarioArmamentoPage() {
  const [armamentos, setArmamentos] = useState<any[]>([]);
  const [inventarios, setInventarios] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [armamentoId, setArmamentoId] = useState("");
  const [statusConferencia, setStatusConferencia] = useState("CONFERIDO");
  const [localizacao, setLocalizacao] = useState("ARMARIA");
  const [estado, setEstado] = useState("SEM_ALTERACAO");
  const [responsavel, setResponsavel] = useState("");
  const [observacao, setObservacao] = useState("");

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

    const { data: listaInventarios } = await supabase
      .from("inventario_armamento")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setArmamentos(listaArmamentos || []);
    setInventarios(listaInventarios || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    return {
      total: inventarios.length,
      conferidos: inventarios.filter((i) => i.status_conferencia === "CONFERIDO").length,
      divergentes: inventarios.filter((i) => i.status_conferencia === "DIVERGENTE").length,
      pendentes: inventarios.filter((i) => i.status_conferencia === "PENDENTE").length,
    };
  }, [inventarios]);

  const armamentoAtual = armamentos.find(
    (a) => String(a.id) === String(armamentoId)
  );

  const inventariosFiltrados = inventarios.filter((item) => {
    const texto = `
      ${nomeArmamento(item.armamento_id)}
      ${item.status_conferencia || ""}
      ${item.localizacao || ""}
      ${item.estado || ""}
      ${item.responsavel || ""}
      ${item.observacao || ""}
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

  function nomeStatus(valor: string) {
    const nomes: Record<string, string> = {
      CONFERIDO: "Conferido",
      DIVERGENTE: "Divergente",
      NAO_LOCALIZADO: "Não localizado",
      PENDENTE: "Pendente",
    };

    return nomes[valor] || valor;
  }

  function nomeEstado(valor: string) {
    const nomes: Record<string, string> = {
      SEM_ALTERACAO: "Sem alteração",
      COM_AVARIA: "Com avaria",
      NECESSITA_MANUTENCAO: "Necessita manutenção",
      NECESSITA_CONFERENCIA: "Necessita conferência",
    };

    return nomes[valor] || valor;
  }

  function adicionarObservacao(texto: string) {
    setObservacao((atual) => (atual ? `${atual}\n${texto}` : texto));
  }

  function limpar() {
    setArmamentoId("");
    setStatusConferencia("CONFERIDO");
    setLocalizacao("ARMARIA");
    setEstado("SEM_ALTERACAO");
    setResponsavel("");
    setObservacao("");
  }

  async function salvar() {
    if (!armamentoId) {
      alert("Selecione o armamento.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("inventario_armamento").insert([
      {
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        armamento_id: Number(armamentoId),
        status_conferencia: statusConferencia,
        localizacao,
        estado,
        responsavel: responsavel.trim() || null,
        observacao: observacao.trim() || null,
      },
    ]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    limpar();
    carregar();
    alert("Inventário registrado com sucesso.");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-slate-400 font-semibold">
          Controle Administrativo
        </p>

        <h1 className="text-2xl md:text-3xl font-black text-white">
          📋 Inventário de Armamento
        </h1>

        <p className="text-slate-400 mt-2">
          Conferência administrativa de armamentos, localização, estado e responsável.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="Registros" valor={String(resumo.total)} icone={Archive} />
        <Card titulo="Conferidos" valor={String(resumo.conferidos)} icone={CheckCircle} />
        <Card titulo="Divergentes" valor={String(resumo.divergentes)} icone={AlertTriangle} />
        <Card titulo="Pendentes" valor={String(resumo.pendentes)} icone={ShieldCheck} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">Nova Conferência</h2>

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
              <label className="label">Status da conferência</label>
              <select
                className="input"
                value={statusConferencia}
                onChange={(e) => setStatusConferencia(e.target.value)}
              >
                <option value="CONFERIDO">Conferido</option>
                <option value="DIVERGENTE">Divergente</option>
                <option value="NAO_LOCALIZADO">Não localizado</option>
                <option value="PENDENTE">Pendente</option>
              </select>
            </div>

            <div>
              <label className="label">Localização</label>
              <select
                className="input"
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
              >
                <option value="ARMARIA">Armaria</option>
                <option value="COFRE">Cofre</option>
                <option value="RESERVA">Reserva</option>
                <option value="CAUTELADO">Cautelado</option>
                <option value="MANUTENCAO">Manutenção</option>
                <option value="COMANDO">Comando</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div>
              <label className="label">Estado</label>
              <select
                className="input"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="SEM_ALTERACAO">Sem alteração aparente</option>
                <option value="COM_AVARIA">Com avaria aparente</option>
                <option value="NECESSITA_MANUTENCAO">Necessita manutenção</option>
                <option value="NECESSITA_CONFERENCIA">Necessita conferência</option>
              </select>
            </div>

            <Campo
              label="Responsável pela conferência"
              valor={responsavel}
              setValor={setResponsavel}
              placeholder="Nome do responsável"
            />

            <div>
              <label className="label">Observações</label>
              <textarea
                className="input min-h-[120px]"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observações administrativas da conferência..."
              />
            </div>

            <div>
              <label className="label">Observações rápidas</label>

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

            <button
              onClick={salvar}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Registrar Inventário"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-5 h-5 text-slate-400" />
              <h2 className="text-xl font-black text-white">
                Histórico de Inventário
              </h2>
            </div>

            <input
              className="input"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por armamento, status, local, responsável..."
            />
          </div>

          {inventariosFiltrados.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">📋</p>
              <h2 className="text-white text-xl font-black">
                Nenhum inventário encontrado
              </h2>
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {inventariosFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                >
                  <div className="flex justify-between gap-3 mb-3">
                    <div>
                      <p className="text-slate-400 text-sm">
                        {nomeStatus(item.status_conferencia)}
                      </p>

                      <h3 className="text-xl font-black text-white">
                        {nomeArmamento(item.armamento_id)}
                      </h3>
                    </div>

                    <span className="h-fit rounded-full bg-blue-950 text-blue-300 border border-blue-800 px-3 py-1 text-xs font-bold">
                      INVENTÁRIO
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Info titulo="Localização" valor={item.localizacao || "N/I"} />
                    <Info titulo="Estado" valor={nomeEstado(item.estado)} />
                    <Info titulo="Responsável" valor={item.responsavel || "N/I"} />
                    <Info
                      titulo="Data"
                      valor={
                        item.criado_em
                          ? new Date(item.criado_em).toLocaleDateString("pt-BR")
                          : "N/I"
                      }
                    />
                  </div>

                  {item.observacao && (
                    <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap">
                      {item.observacao}
                    </p>
                  )}
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
      <input
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

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-3">
      <p className="text-slate-500 text-xs">{titulo}</p>
      <p className="text-slate-200 font-bold text-sm">{valor}</p>
    </div>
  );
}