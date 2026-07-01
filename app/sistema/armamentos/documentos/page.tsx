"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FileCheck, Search } from "lucide-react";

const tiposDocumento = [
  "Registro",
  "Nota fiscal",
  "Termo de cautela",
  "Termo de responsabilidade",
  "Laudo",
  "Manutenção",
  "Baixa",
  "Outro",
];

export default function DocumentosArmamentoPage() {
  const [armamentos, setArmamentos] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [armamentoId, setArmamentoId] = useState("");
  const [nome, setNome] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("Registro");
  const [arquivoUrl, setArquivoUrl] = useState("");
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

    const { data: listaDocumentos } = await supabase
      .from("documentos_armamento")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setArmamentos(listaArmamentos || []);
    setDocumentos(listaDocumentos || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  function nomeArmamento(id: number) {
    const item = armamentos.find((a) => Number(a.id) === Number(id));

    if (!item) return `Armamento #${id}`;

    return `${item.tipo || "Armamento"} ${item.marca || ""} ${
      item.modelo || ""
    } - ${item.numero_serie || "S/S"}`;
  }

  const documentosFiltrados = documentos.filter((item) => {
    const texto = `
      ${nomeArmamento(item.armamento_id)}
      ${item.nome || ""}
      ${item.tipo_documento || ""}
      ${item.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  function limpar() {
    setArmamentoId("");
    setNome("");
    setTipoDocumento("Registro");
    setArquivoUrl("");
    setObservacao("");
  }

  async function salvar() {
    if (!armamentoId) return alert("Selecione o armamento.");
    if (!nome.trim()) return alert("Informe o nome do documento.");

    setSalvando(true);

    const { error } = await supabase.from("documentos_armamento").insert([
      {
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        armamento_id: Number(armamentoId),
        nome: nome.trim(),
        tipo_documento: tipoDocumento,
        arquivo_url: arquivoUrl.trim() || null,
        observacao: observacao.trim() || null,
      },
    ]);

    setSalvando(false);

    if (error) return alert(error.message);

    limpar();
    carregar();
    alert("Documento registrado com sucesso.");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-2xl md:text-3xl font-black text-white">
          📄 Documentos de Armamento
        </h1>

        <p className="text-slate-400 mt-2">
          Controle administrativo de documentos, registros, termos e laudos.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">Novo Documento</h2>

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
                    {a.tipo} - {a.marca} {a.modelo} - {a.numero_serie || "S/S"}
                  </option>
                ))}
              </select>
            </div>

            <Campo
              label="Nome do documento"
              valor={nome}
              setValor={setNome}
              placeholder="Ex: Registro do armamento"
            />

            <div>
              <label className="label">Tipo do documento</label>
              <select
                className="input"
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
              >
                {tiposDocumento.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <Campo
              label="URL do arquivo"
              valor={arquivoUrl}
              setValor={setArquivoUrl}
              placeholder="Cole aqui o link do arquivo, se houver"
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

            <button
              onClick={salvar}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Registrar Documento"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-5 h-5 text-slate-400" />
              <h2 className="text-xl font-black text-white">
                Documentos Registrados
              </h2>
            </div>

            <input
              className="input"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por armamento, documento ou observação..."
            />
          </div>

          {documentosFiltrados.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">📄</p>
              <h2 className="text-white text-xl font-black">
                Nenhum documento encontrado
              </h2>
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {documentosFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-slate-400 text-sm">
                        {item.tipo_documento || "Documento"}
                      </p>

                      <h3 className="text-xl font-black text-white">
                        {item.nome}
                      </h3>

                      <p className="text-slate-500 text-sm mt-1">
                        {nomeArmamento(item.armamento_id)}
                      </p>
                    </div>

                    <FileCheck className="w-7 h-7 text-yellow-400" />
                  </div>

                  {item.arquivo_url && (
                    <a
                      href={item.arquivo_url}
                      target="_blank"
                      className="inline-block mt-4 text-yellow-400 font-bold text-sm"
                    >
                      Abrir documento
                    </a>
                  )}

                  {item.observacao && (
                    <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap">
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