"use client";

import { useEffect, useMemo, useState } from "react";
import { FileCheck, Lock, Search } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

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
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);

  const [armamentoId, setArmamentoId] = useState("");
  const [nome, setNome] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("Registro");
  const [arquivoUrl, setArquivoUrl] = useState("");
  const [observacao, setObservacao] = useState("");

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
        await registrarAuditoria({
          modulo: "Armamentos",
          acao: "ACESSO_NEGADO",
          descricao: "Tentativa de acesso aos documentos de armamento sem permissão.",
          tabela: "documentos_armamento",
          detalhes: {
            usuario_id: dados.id,
            perfil: dados.perfil,
            municipio_id: dados.municipio_id,
          },
        });

        setBloqueado(true);
        setCarregando(false);
        return;
      }

      setUsuario(dados);

      await registrarAuditoria({
        modulo: "Armamentos",
        acao: "ACESSO",
        descricao: "Acessou os documentos de armamento.",
        tabela: "documentos_armamento",
        detalhes: {
          usuario_id: dados.id,
          municipio_id: dados.municipio_id,
        },
      });

      await carregar(dados);
    }

    iniciar();
  }, []);

  async function carregar(usuarioAtual: any) {
    setCarregando(true);

    const {
      data: listaArmamentos,
      error: erroArmamentos,
    } = await supabase
      .from("armamentos")
      .select(`
        id,
        tipo,
        marca,
        modelo,
        numero_serie
      `)
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("id", { ascending: false })
      .range(0, 499);

    const {
      data: listaDocumentos,
      error: erroDocumentos,
    } = await supabase
      .from("documentos_armamento")
      .select(`
        id,
        armamento_id,
        nome,
        tipo_documento,
        arquivo_url,
        observacao,
        criado_em
      `)
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("criado_em", { ascending: false })
      .range(0, 499);

    setCarregando(false);

    if (erroArmamentos || erroDocumentos) {
      await registrarAuditoria({
        modulo: "Armamentos",
        acao: "ERRO",
        descricao: "Erro ao carregar documentos de armamento.",
        tabela: "documentos_armamento",
        detalhes: {
          erro_armamentos: erroArmamentos?.message,
          erro_documentos: erroDocumentos?.message,
          municipio_id: usuarioAtual.municipio_id,
        },
      });

      alert("Erro ao carregar documentos.");
      return;
    }

    setArmamentos(listaArmamentos || []);
    setDocumentos(listaDocumentos || []);
  }

  function nomeArmamento(id: number) {
    const item = armamentos.find((a) => Number(a.id) === Number(id));

    if (!item) return `Armamento #${id}`;

    return `${item.tipo || "Armamento"} ${item.marca || ""} ${
      item.modelo || ""
    } - ${item.numero_serie || "S/S"}`;
  }

  const documentosFiltrados = useMemo(() => {
    return documentos.filter((item) => {
      const texto = `
        ${nomeArmamento(item.armamento_id)}
        ${item.nome || ""}
        ${item.tipo_documento || ""}
        ${item.observacao || ""}
      `.toLowerCase();

      return texto.includes(busca.toLowerCase());
    });
  }, [documentos, busca, armamentos]);

  function limpar() {
    setArmamentoId("");
    setNome("");
    setTipoDocumento("Registro");
    setArquivoUrl("");
    setObservacao("");
  }

  async function salvar() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!armamentoId) {
      alert("Selecione o armamento.");
      return;
    }

    if (!nome.trim()) {
      alert("Informe o nome do documento.");
      return;
    }

    if (nome.trim().length < 3) {
      alert("Nome do documento muito curto.");
      return;
    }

    if (nome.length > 200) {
      alert("Nome do documento muito grande.");
      return;
    }

    if (arquivoUrl.length > 500) {
      alert("URL do arquivo muito grande.");
      return;
    }

    if (observacao.length > 2000) {
      alert("Observação muito grande.");
      return;
    }

    setSalvando(true);

    const dadosDocumento = {
      municipio_id: usuario.municipio_id,
      criado_por: usuario.id,
      armamento_id: Number(armamentoId),
      nome: nome.trim(),
      tipo_documento: tipoDocumento,
      arquivo_url: arquivoUrl.trim() || null,
      observacao: observacao.trim() || null,
    };

    const { data, error } = await supabase
      .from("documentos_armamento")
      .insert([dadosDocumento])
      .select("id")
      .single();

    setSalvando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Armamentos",
        acao: "ERRO",
        descricao: "Erro ao registrar documento de armamento.",
        tabela: "documentos_armamento",
        detalhes: {
          erro: error.message,
          dados: dadosDocumento,
        },
      });

      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Armamentos",
      acao: "CRIAR",
      descricao: `Registrou o documento ${nome} para ${nomeArmamento(
        Number(armamentoId)
      )}.`,
      tabela: "documentos_armamento",
      registro_id: data?.id,
      detalhes: dadosDocumento,
    });

    limpar();
    await carregar(usuario);
    alert("Documento registrado com sucesso.");
  }

  if (bloqueado) {
    return (
      <div className="p-4 md:p-6">
        <div className="painel-premium p-10 text-center">
          <Lock className="w-16 h-16 mx-auto text-red-400 mb-4" />

          <h2 className="text-2xl font-black text-white">
            Acesso Restrito
          </h2>

          <p className="text-slate-400 mt-2">
            Você não possui permissão para acessar os documentos de armamento.
          </p>
        </div>
      </div>
    );
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
              disabled={salvando || carregando}
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

          {carregando ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-slate-400">Carregando documentos...</p>
            </div>
          ) : documentosFiltrados.length === 0 ? (
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
                    <div className="min-w-0">
                      <p className="text-slate-400 text-sm break-words">
                        {item.tipo_documento || "Documento"}
                      </p>

                      <h3 className="text-xl font-black text-white break-words">
                        {item.nome}
                      </h3>

                      <p className="text-slate-500 text-sm mt-1 break-words">
                        {nomeArmamento(item.armamento_id)}
                      </p>
                    </div>

                    <FileCheck className="w-7 h-7 text-yellow-400 shrink-0" />
                  </div>

                  {item.arquivo_url && (
                    <a
                      href={item.arquivo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-4 text-yellow-400 font-bold text-sm break-all"
                    >
                      Abrir documento
                    </a>
                  )}

                  {item.observacao && (
                    <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap break-words">
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