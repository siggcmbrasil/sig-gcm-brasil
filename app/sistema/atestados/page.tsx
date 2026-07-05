"use client";

import { useEffect, useState } from "react";
import { FileText, Lock } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type UsuarioLogado = {
  id: number;
  perfil?: string;
  municipio_id: number;
};

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

export default function AtestadosPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);

  const [guardaId, setGuardaId] = useState("");
  const [tipo, setTipo] = useState("MEDICO");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [dias, setDias] = useState("");
  const [cid, setCid] = useState("");
  const [observacao, setObservacao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function iniciar() {
      const dados = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      ) as UsuarioLogado;

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
          modulo: "Atestados",
          acao: "ACESSO_NEGADO",
          descricao: "Tentativa de acesso ao módulo de atestados sem permissão.",
          tabela: "atestados",
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
        modulo: "Atestados",
        acao: "ACESSO",
        descricao: "Acessou o módulo de atestados.",
        tabela: "atestados",
        detalhes: {
          usuario_id: dados.id,
          municipio_id: dados.municipio_id,
        },
      });

      await carregarGuardas(dados);
    }

    iniciar();
  }, []);

  async function carregarGuardas(usuarioAtual: UsuarioLogado) {
    setCarregando(true);

    const { data, error } = await supabase
      .from("guardas")
      .select("id, nome, matricula")
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("nome")
      .range(0, 499);

    setCarregando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Atestados",
        acao: "ERRO",
        descricao: "Erro ao carregar guardas para registro de atestado.",
        tabela: "guardas",
        detalhes: {
          erro: error.message,
          municipio_id: usuarioAtual.municipio_id,
        },
      });

      alert("Erro ao carregar guardas.");
      return;
    }

    setGuardas(data || []);
  }

  async function enviarArquivo() {
    if (!arquivo || !usuario?.municipio_id) return null;

    const tamanhoMaximo = 10 * 1024 * 1024;

    if (arquivo.size > tamanhoMaximo) {
      alert("Arquivo muito grande. Envie arquivo de até 10MB.");
      return null;
    }

    const tiposPermitidos = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!tiposPermitidos.includes(arquivo.type)) {
      alert("Formato inválido. Envie PDF, JPG ou PNG.");
      return null;
    }

    const extensao = arquivo.name.split(".").pop()?.toLowerCase() || "pdf";

    const nomeArquivo = `atestados/${usuario.municipio_id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extensao}`;

    const { error } = await supabase.storage
      .from("documentos")
      .upload(nomeArquivo, arquivo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      await registrarAuditoria({
        modulo: "Atestados",
        acao: "ERRO",
        descricao: "Erro ao enviar arquivo de atestado.",
        tabela: "atestados",
        detalhes: {
          erro: error.message,
          municipio_id: usuario.municipio_id,
        },
      });

      alert(error.message);
      return null;
    }

    const { data } = supabase.storage
      .from("documentos")
      .getPublicUrl(nomeArquivo);

    return data.publicUrl;
  }

  async function salvar() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!guardaId || !dataInicio || !dias) {
      alert("Preencha guarda, data inicial e dias.");
      return;
    }

    if (Number(dias) <= 0 || Number(dias) > 365) {
      alert("Informe uma quantidade de dias válida.");
      return;
    }

    if (dataFim && dataFim < dataInicio) {
      alert("Data final não pode ser menor que a data inicial.");
      return;
    }

    if (cid.length > 30) {
      alert("CID muito grande.");
      return;
    }

    if (observacao.length > 3000) {
      alert("Observação muito grande.");
      return;
    }

    setSalvando(true);

    const arquivoUrl = await enviarArquivo();

    const dadosAtestado = {
      municipio_id: usuario.municipio_id,
      guarda_id: Number(guardaId),
      tipo,
      data_inicio: dataInicio,
      data_fim: dataFim || null,
      dias: Number(dias),
      cid: cid.trim() || null,
      observacao: observacao.trim() || null,
      arquivo_url: arquivoUrl,
      criado_por: usuario.id,
    };

    const { data, error } = await supabase
      .from("atestados")
      .insert([dadosAtestado])
      .select("id")
      .single();

    setSalvando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Atestados",
        acao: "ERRO",
        descricao: "Erro ao registrar atestado.",
        tabela: "atestados",
        detalhes: {
          erro: error.message,
          dados: dadosAtestado,
        },
      });

      alert(error.message);
      return;
    }

    const guarda = guardas.find(
      (item) => String(item.id) === String(guardaId)
    );

    await registrarAuditoria({
      modulo: "Atestados",
      acao: "CRIAR",
      descricao: `Registrou atestado ${tipo} para ${
        guarda?.nome || "guarda não informado"
      }, período ${dataInicio} até ${dataFim || "não informado"}, ${dias} dia(s).`,
      tabela: "atestados",
      registro_id: data?.id,
      detalhes: {
        guarda_id: Number(guardaId),
        tipo,
        data_inicio: dataInicio,
        data_fim: dataFim || null,
        dias: Number(dias),
        possui_arquivo: Boolean(arquivoUrl),
      },
    });

    alert("Atestado registrado.");

    setGuardaId("");
    setTipo("MEDICO");
    setDataInicio("");
    setDataFim("");
    setDias("");
    setCid("");
    setObservacao("");
    setArquivo(null);
  }

  if (carregando) {
    return (
      <div className="p-4 md:p-6">
        <div className="painel-premium p-10 text-center">
          <p className="text-slate-400">Carregando atestados...</p>
        </div>
      </div>
    );
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
            Você não possui permissão para acessar atestados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-yellow-400" />

          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Atestados
            </h1>

            <p className="text-slate-400 mt-1">
              Registro de atestados médicos e afastamentos temporários.
            </p>
          </div>
        </div>
      </div>

      <div className="painel-premium p-6 space-y-4">
        <div>
          <label className="label">Guarda</label>
          <select
            className="input"
            value={guardaId}
            onChange={(e) => setGuardaId(e.target.value)}
          >
            <option value="">Selecione o Guarda</option>

            {guardas.map((guarda) => (
              <option key={guarda.id} value={guarda.id}>
                {guarda.nome} - {guarda.matricula || "Sem matrícula"}
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
            <option value="MEDICO">Médico</option>
            <option value="ODONTOLOGICO">Odontológico</option>
            <option value="ACIDENTE">Acidente</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label">Data inicial</label>
            <input
              type="date"
              className="input"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Data final</label>
            <input
              type="date"
              className="input"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Dias</label>
            <input
              type="number"
              className="input"
              placeholder="Dias"
              value={dias}
              onChange={(e) => setDias(e.target.value.replace(/\D/g, ""))}
            />
          </div>
        </div>

        <div>
          <label className="label">CID</label>
          <input
            className="input"
            placeholder="CID"
            value={cid}
            onChange={(e) => setCid(e.target.value.toUpperCase())}
          />
        </div>

        <div>
          <label className="label">Observação</label>
          <textarea
            className="input min-h-32 resize-none"
            placeholder="Observação"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Arquivo</label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="input"
            onChange={(e) => setArquivo(e.target.files?.[0] || null)}
          />
        </div>

        <button
          onClick={salvar}
          disabled={salvando}
          className="sig-btn-gold disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar Atestado"}
        </button>
      </div>
    </div>
  );
}