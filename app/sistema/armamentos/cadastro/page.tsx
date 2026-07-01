"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  BadgeCheck,
  Edit,
  PackageCheck,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

import {
  TIPOS_ARMA_FOGO,
  MARCAS_ARMA_FOGO,
  CALIBRES_ARMA_FOGO,
  MARCAS_MODELOS_ARMA_FOGO,
} from "@/lib/bases/armas";

export default function CadastroArmamentosPage() {
  const [armamentos, setArmamentos] = useState<any[]>([]);
  const [editando, setEditando] = useState<any | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");

  const [tipo, setTipo] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [calibre, setCalibre] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [status, setStatus] = useState("DISPONIVEL");
  const [localizacao, setLocalizacao] = useState("ARMARIA");
  const [observacao, setObservacao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const modelos = useMemo(() => {
    return MARCAS_MODELOS_ARMA_FOGO[marca] || ["Outro"];
  }, [marca]);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    if (!usuario?.municipio_id) return;

    const { data, error } = await supabase
      .from("armamentos")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setArmamentos(data || []);
  }

  const resumo = useMemo(() => {
    return {
      total: armamentos.length,
      disponiveis: armamentos.filter((a) => a.status === "DISPONIVEL").length,
      cauteladas: armamentos.filter((a) => a.status === "CAUTELADA").length,
      manutencao: armamentos.filter((a) => a.status === "MANUTENCAO").length,
      baixadas: armamentos.filter((a) => a.status === "BAIXADA").length,
      extraviadas: armamentos.filter((a) => a.status === "EXTRAVIADA").length,
    };
  }, [armamentos]);

  const filtrados = armamentos.filter((item) => {
    const texto = `
      ${item.tipo || ""}
      ${item.marca || ""}
      ${item.modelo || ""}
      ${item.calibre || ""}
      ${item.numero_serie || ""}
      ${item.patrimonio || ""}
      ${item.status || ""}
      ${item.localizacao || ""}
      ${item.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  function limpar() {
    setEditando(null);
    setTipo("");
    setMarca("");
    setModelo("");
    setCalibre("");
    setNumeroSerie("");
    setPatrimonio("");
    setStatus("DISPONIVEL");
    setLocalizacao("ARMARIA");
    setObservacao("");
  }

  function editar(item: any) {
    setEditando(item);
    setTipo(item.tipo || "");
    setMarca(item.marca || "");
    setModelo(item.modelo || "");
    setCalibre(item.calibre || "");
    setNumeroSerie(item.numero_serie || "");
    setPatrimonio(item.patrimonio || "");
    setStatus(item.status || "DISPONIVEL");
    setLocalizacao(item.localizacao || "ARMARIA");
    setObservacao(item.observacao || "");
  }

  async function salvar() {
    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    if (!tipo || !marca || !modelo || !numeroSerie.trim()) {
      alert("Preencha tipo, marca, modelo e número de série.");
      return;
    }

    setSalvando(true);

    const dados = {
      municipio_id: usuario.municipio_id,
      criado_por: usuario.id,
      tipo,
      marca,
      modelo,
      calibre: calibre || null,
      numero_serie: numeroSerie.trim().toUpperCase(),
      patrimonio: patrimonio.trim().toUpperCase() || null,
      status,
      localizacao,
      observacao: observacao.trim() || null,
    };

    const { error } = editando
      ? await supabase
          .from("armamentos")
          .update(dados)
          .eq("id", editando.id)
          .eq("municipio_id", usuario.municipio_id)
      : await supabase.from("armamentos").insert([dados]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      editando
        ? "Armamento atualizado com sucesso."
        : "Armamento cadastrado com sucesso."
    );

    limpar();
    carregar();
  }

  async function excluir(id: number) {
    if (!confirm("Deseja excluir este armamento?")) return;

    const { error } = await supabase
      .from("armamentos")
      .delete()
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      alert(error.message);
      return;
    }

    carregar();
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-blue-400 font-bold uppercase">
          Central de Armamentos
        </p>

        <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
          Cadastro de Armamentos
        </h1>

        <p className="text-slate-400 mt-2">
          Cadastro, edição e controle administrativo dos armamentos da
          corporação.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <ResumoCard titulo="Total" valor={resumo.total} icone={ShieldCheck} cor="azul" />
        <ResumoCard titulo="Disponíveis" valor={resumo.disponiveis} icone={BadgeCheck} cor="verde" />
        <ResumoCard titulo="Cauteladas" valor={resumo.cauteladas} icone={PackageCheck} cor="amarelo" />
        <ResumoCard titulo="Manutenção" valor={resumo.manutencao} icone={AlertTriangle} cor="amarelo" />
        <ResumoCard titulo="Baixadas/Extraviadas" valor={resumo.baixadas + resumo.extraviadas} icone={Archive} cor="vermelho" />
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="painel-premium p-6 xl:col-span-1">
          <h2 className="text-xl font-black text-white">
            {editando ? "Editar Armamento" : "Novo Armamento"}
          </h2>

          <p className="text-slate-400 text-sm mt-1 mb-5">
            Informe os dados patrimoniais e administrativos.
          </p>

          <div className="space-y-4">
            <Select label="Tipo" valor={tipo} setValor={setTipo} opcoes={TIPOS_ARMA_FOGO} />

            <Select
              label="Marca"
              valor={marca}
              setValor={(valor) => {
                setMarca(valor);
                setModelo("");
              }}
              opcoes={MARCAS_ARMA_FOGO}
            />

            <Select label="Modelo" valor={modelo} setValor={setModelo} opcoes={modelos} />
            <Select label="Calibre" valor={calibre} setValor={setCalibre} opcoes={CALIBRES_ARMA_FOGO} />

            <Campo
              label="Número de série"
              valor={numeroSerie}
              setValor={setNumeroSerie}
              placeholder="Ex: ABC123456"
            />

            <Campo
              label="Patrimônio"
              valor={patrimonio}
              setValor={setPatrimonio}
              placeholder="Ex: ARM-001"
            />

            <Select
              label="Localização"
              valor={localizacao}
              setValor={setLocalizacao}
              opcoes={[
                "ARMARIA",
                "COFRE",
                "RESERVA",
                "COMANDO",
                "MANUTENCAO",
                "CAUTELADA",
                "OUTRO",
              ]}
            />

            <Select
              label="Status"
              valor={status}
              setValor={setStatus}
              opcoes={[
                "DISPONIVEL",
                "CAUTELADA",
                "MANUTENCAO",
                "BAIXADA",
                "EXTRAVIADA",
              ]}
            />

            <div>
              <label className="label">Observações</label>
              <textarea
                className="input min-h-[110px]"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observações administrativas..."
              />
            </div>

            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando
                ? "Salvando..."
                : editando
                ? "Atualizar Armamento"
                : "Cadastrar Armamento"}
            </button>

            {editando && (
              <button
                type="button"
                onClick={limpar}
                className="btn-secondary w-full"
              >
                Cancelar edição
              </button>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white">
              Armamentos Cadastrados
            </h2>

            <p className="text-slate-400 text-sm mt-1 mb-4">
              Consulte por tipo, marca, modelo, série, patrimônio ou status.
            </p>

            <div className="relative">
              <Search
                className="absolute left-3 top-3 text-blue-400"
                size={18}
              />

              <input
                className="input pl-10"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar armamento..."
              />
            </div>
          </div>

          {filtrados.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-4">🛡️</p>

              <h2 className="text-xl font-black text-white">
                Nenhum armamento encontrado
              </h2>

              <p className="text-slate-400 mt-2">
                Cadastre o primeiro armamento ou altere a busca.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtrados.map((item) => (
                <div
                  key={item.id}
                  className="painel-premium p-5"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-blue-400 text-sm font-bold">
                        {item.tipo || "Armamento"}
                      </p>

                      <h3 className="text-xl font-black text-white">
                        {item.marca || ""} {item.modelo || ""}
                      </h3>

                      <p className="text-slate-500 text-sm">
                        Série: {item.numero_serie || "N/I"}
                      </p>
                    </div>

                    <BadgeStatus status={item.status || "N/I"} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Info titulo="Calibre" valor={item.calibre || "N/I"} />
                    <Info titulo="Patrimônio" valor={item.patrimonio || "N/I"} />
                    <Info titulo="Local" valor={nomeStatus(item.localizacao)} />
                    <Info titulo="Status" valor={nomeStatus(item.status)} />
                  </div>

                  {item.observacao && (
                    <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap">
                      {item.observacao}
                    </p>
                  )}

                  <div className="flex gap-3 mt-5">
                    <button
                      type="button"
                      onClick={() => editar(item)}
                      className="sig-btn-gold flex-1 flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => excluir(item.id)}
                      className="rounded-xl px-4 py-2 bg-red-950/60 border border-red-900 text-red-300 font-bold flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function nomeStatus(valor?: string) {
  const nomes: Record<string, string> = {
    DISPONIVEL: "Disponível",
    CAUTELADA: "Cautelada",
    MANUTENCAO: "Manutenção",
    BAIXADA: "Baixada",
    EXTRAVIADA: "Extraviada",
    ARMARIA: "Armaria",
    COFRE: "Cofre",
    RESERVA: "Reserva",
    COMANDO: "Comando",
    OUTRO: "Outro",
  };

  return nomes[valor || ""] || valor || "N/I";
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

function Select({
  label,
  valor,
  setValor,
  opcoes,
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  opcoes: string[];
}) {
  return (
    <div>
      <label className="label">{label}</label>

      <select
        className="input"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      >
        <option value="">Selecione</option>

        {opcoes.map((item) => (
          <option key={item} value={item}>
            {nomeStatus(item)}
          </option>
        ))}
      </select>
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

function ResumoCard({
  titulo,
  valor,
  icone: Icone,
  cor,
}: {
  titulo: string;
  valor: number;
  icone: any;
  cor: "azul" | "verde" | "amarelo" | "vermelho";
}) {
  const cores = {
    azul: "text-blue-400 border-blue-900/50 bg-blue-950/30",
    verde: "text-green-400 border-green-900/50 bg-green-950/30",
    amarelo: "text-yellow-400 border-yellow-900/50 bg-yellow-950/30",
    vermelho: "text-red-400 border-red-900/50 bg-red-950/30",
  };

  return (
    <div className="painel-premium p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-2xl border p-3 ${cores[cor]}`}>
          <Icone size={22} />
        </div>

        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            {valor}
          </h2>
        </div>
      </div>
    </div>
  );
}

function BadgeStatus({ status }: { status: string }) {
  let cor = "bg-slate-800 text-slate-300 border-slate-700";

  if (status === "DISPONIVEL") {
    cor = "bg-green-950 text-green-300 border-green-800";
  }

  if (status === "CAUTELADA" || status === "MANUTENCAO") {
    cor = "bg-yellow-950 text-yellow-300 border-yellow-800";
  }

  if (status === "BAIXADA" || status === "EXTRAVIADA") {
    cor = "bg-red-950 text-red-300 border-red-800";
  }

  return (
    <span
      className={`h-fit rounded-full border px-3 py-1 text-xs font-bold ${cor}`}
    >
      {nomeStatus(status)}
    </span>
  );
}