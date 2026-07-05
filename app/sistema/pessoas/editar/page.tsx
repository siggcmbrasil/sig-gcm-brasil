"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, UserPen } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

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

export default function EditarPessoaPage() {
  const router = useRouter();
  const params = useParams();

  const id = Number(params.id);

  const [nome, setNome] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("CPF");
  const [documento, setDocumento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [profissao, setProfissao] = useState("");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void carregarPessoa();
  }, []);

  async function carregarPessoa() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      alert("Sessão inválida.");
      router.push("/login");
      return;
    }

    if (!id || Number.isNaN(id)) {
      alert("ID inválido.");
      router.push("/sistema/pessoas-abordadas");
      return;
    }

    const { data, error } = await supabase
      .from("pessoas_abordadas")
      .select(
        "id, nome, tipo_documento, documento, telefone, endereco, profissao, observacao"
      )
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id)
      .single();

    setCarregando(false);

    if (error || !data) {
      alert("Pessoa não encontrada.");
      router.push("/sistema/pessoas-abordadas");
      return;
    }

    setNome(data.nome || "");
    setTipoDocumento(data.tipo_documento || "CPF");
    setDocumento(data.documento || "");
    setTelefone(data.telefone || "");
    setEndereco(data.endereco || "");
    setProfissao(data.profissao || "");
    setObservacao(data.observacao || "");
  }

  async function salvar() {
    const usuario = obterUsuarioLogado();

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
        "CMT_GUARNICAO",
        "PLANTONISTA",
        "GUARDA",
      ].includes(usuario.perfil)
    ) {
      alert("Você não possui permissão.");
      return;
    }

    if (!nome.trim()) {
      alert("Informe o nome.");
      return;
    }

    if (nome.trim().length < 3) {
      alert("Nome muito curto.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase
      .from("pessoas_abordadas")
      .update({
        nome: nome.trim(),
        tipo_documento: tipoDocumento,
        documento: documento.trim() || null,
        telefone: telefone.trim() || null,
        endereco: endereco.trim() || null,
        profissao: profissao.trim() || null,
        observacao: observacao.trim() || null,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    setSalvando(false);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Pessoas Abordadas",
        acao: "ERRO",
        descricao: "Erro ao editar pessoa abordada.",
        tabela: "pessoas_abordadas",
        registro_id: id,
        detalhes: {
          erro: error.message,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao salvar alterações.");
      return;
    }

    await registrarAuditoria({
      modulo: "Pessoas Abordadas",
      acao: "EDITAR",
      descricao: `Atualizou os dados de ${nome}.`,
      tabela: "pessoas_abordadas",
      registro_id: id,
      detalhes: {
        nome: nome.trim(),
        tipo_documento: tipoDocumento,
        documento: documento.trim() || null,
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
      },
    });

    alert("Pessoa atualizada com sucesso.");
    router.push("/sistema/pessoas-abordadas");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Editar Pessoa Abordada"
        subtitulo="Atualize os dados da pessoa registrada em abordagem."
        icone={UserPen}
      />

      <SigCard>
        {carregando ? (
          <p className="text-slate-400">Carregando pessoa...</p>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Nome</label>
                <input
                  className="input"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo"
                  maxLength={120}
                />
              </div>

              <div>
                <label className="label">Tipo de documento</label>
                <select
                  className="input"
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                >
                  <option value="CPF">CPF</option>
                  <option value="RG">RG</option>
                  <option value="CNH">CNH</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div>
                <label className="label">Documento</label>
                <input
                  className="input"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  placeholder="Número do documento"
                  maxLength={40}
                />
              </div>

              <div>
                <label className="label">Telefone</label>
                <input
                  className="input"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Telefone"
                  maxLength={30}
                />
              </div>

              <div>
                <label className="label">Profissão</label>
                <input
                  className="input"
                  value={profissao}
                  onChange={(e) => setProfissao(e.target.value)}
                  placeholder="Profissão"
                  maxLength={80}
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Endereço</label>
                <input
                  className="input"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Endereço"
                  maxLength={180}
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Observação</label>
                <textarea
                  className="input min-h-32"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Observações"
                  maxLength={1000}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="btn-primary mt-6 inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {salvando ? "Salvando..." : "Salvar Alterações"}
            </button>
          </>
        )}
      </SigCard>
    </div>
  );
}