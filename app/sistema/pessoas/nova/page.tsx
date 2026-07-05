"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, UserPlus, XCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

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

function mascaraCPF(valor: string) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function mascaraTelefone(valor: string) {
  const n = valor.replace(/\D/g, "").slice(0, 11);

  if (n.length <= 10) {
    return n
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return n
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export default function NovaPessoaPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("CPF");
  const [documento, setDocumento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [profissao, setProfissao] = useState("");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);

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
      alert("Você não possui permissão para cadastrar pessoa.");
      return;
    }

    if (!nome.trim()) {
      alert("Informe o nome da pessoa.");
      return;
    }

    if (nome.trim().length < 3) {
      alert("Nome muito curto.");
      return;
    }

    setSalvando(true);

    if (documento.trim()) {
      const { data: existente, error: erroDuplicidade } = await supabase
        .from("pessoas_abordadas")
        .select("id")
        .eq("municipio_id", usuario.municipio_id)
        .eq("documento", documento.trim())
        .maybeSingle();

      if (erroDuplicidade) {
        console.error(erroDuplicidade);
        setSalvando(false);
        alert("Erro ao verificar duplicidade.");
        return;
      }

      if (existente) {
        setSalvando(false);
        alert("Já existe pessoa com este documento neste município.");
        return;
      }
    }

    const { data, error } = await supabase
      .from("pessoas_abordadas")
      .insert({
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        nome: nome.trim(),
        tipo_documento: tipoDocumento,
        documento: documento.trim() || null,
        telefone: telefone.trim() || null,
        endereco: endereco.trim() || null,
        profissao: profissao.trim() || null,
        observacao: observacao.trim() || null,
      })
      .select("id, nome")
      .single();

    setSalvando(false);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Pessoas Abordadas",
        acao: "ERRO",
        descricao: "Erro ao cadastrar pessoa abordada.",
        tabela: "pessoas_abordadas",
        detalhes: {
          erro: error.message,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao cadastrar pessoa.");
      return;
    }

    await registrarAuditoria({
      modulo: "Pessoas Abordadas",
      acao: "CRIAR",
      descricao: `Cadastrou a pessoa ${data?.nome}.`,
      tabela: "pessoas_abordadas",
      registro_id: data?.id,
      detalhes: {
        nome: data?.nome,
        tipo_documento: tipoDocumento,
        documento: documento.trim() || null,
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
      },
    });

    alert("Pessoa cadastrada com sucesso.");
    router.push("/sistema/pessoas-abordadas");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Nova Pessoa Abordada"
        subtitulo="Cadastro de pessoa abordada ou vinculada a ocorrência."
        icone={UserPlus}
      />

      <SigCard>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Nome completo</label>
            <input
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome completo"
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
              onChange={(e) =>
                setDocumento(
                  tipoDocumento === "CPF"
                    ? mascaraCPF(e.target.value)
                    : e.target.value
                )
              }
              placeholder="Número do documento"
              maxLength={40}
            />
          </div>

          <div>
            <label className="label">Telefone</label>
            <input
              className="input"
              value={telefone}
              onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
              maxLength={20}
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
              placeholder="Rua, bairro ou referência"
              maxLength={180}
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Observação</label>
            <textarea
              className="input min-h-32 resize-none"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Informações adicionais..."
              maxLength={1000}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mt-6">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {salvando ? "Salvando..." : "Salvar Pessoa"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/sistema/pessoas-abordadas")}
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Cancelar
          </button>
        </div>
      </SigCard>
    </div>
  );
}