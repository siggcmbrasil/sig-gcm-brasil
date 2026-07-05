"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Phone, XCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

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

export default function CadastroContatoPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("TELEFONE_UTIL");
  const [responsavel, setResponsavel] = useState("");
  const [telefoneFixo, setTelefoneFixo] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
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
        "PLANTONISTA",
      ].includes(usuario.perfil)
    ) {
      alert("Você não possui permissão para cadastrar contato.");
      return;
    }

    if (!nome.trim()) {
      alert("Informe o nome do contato.");
      return;
    }

    if (!telefoneFixo.trim() && !celular.trim() && !email.trim()) {
      alert("Informe pelo menos telefone fixo, celular ou e-mail.");
      return;
    }

    setSalvando(true);

    const { data, error } = await supabase
      .from("contatos_cidadao")
      .insert({
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        nome: nome.trim(),
        categoria,
        responsavel: responsavel.trim() || null,
        telefone_fixo: telefoneFixo.trim() || null,
        celular: celular.trim() || null,
        email: email.trim() || null,
        endereco: endereco.trim() || null,
        observacao: observacao.trim() || null,
        ativo: true,
      })
      .select("id, nome")
      .single();

    setSalvando(false);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Contatos do Cidadão",
        acao: "ERRO",
        descricao: "Erro ao cadastrar contato.",
        tabela: "contatos_cidadao",
        detalhes: {
          erro: error.message,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao salvar contato.");
      return;
    }

    await registrarAuditoria({
      modulo: "Contatos do Cidadão",
      acao: "CRIAR",
      descricao: `Cadastrou o contato ${data?.nome}.`,
      tabela: "contatos_cidadao",
      registro_id: data?.id,
      detalhes: {
        nome: data?.nome,
        categoria,
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
      },
    });

    alert("Contato cadastrado com sucesso.");
    router.push("/sistema/portal-cidadao/contatos");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Cadastrar Contato"
        subtitulo="Adicionar novo telefone, órgão ou instituição ao Portal do Cidadão."
        icone={Phone}
      />

      <SigCard>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nome do contato</label>
            <input
              className="input"
              placeholder="Ex: SAMU, Conselho Tutelar, Prefeitura..."
              value={nome}
              maxLength={120}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Categoria</label>
            <select
              className="input"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="TELEFONE_UTIL">Telefone Útil</option>
              <option value="ORGAO_PUBLICO">Órgão Público</option>
              <option value="EMERGENCIA">Emergência</option>
              <option value="PARCEIRO">Instituição Parceira</option>
              <option value="INTERNO">Contato Interno</option>
            </select>
          </div>

          <div>
            <label className="label">Responsável</label>
            <input
              className="input"
              placeholder="Nome do responsável ou setor"
              value={responsavel}
              maxLength={120}
              onChange={(e) => setResponsavel(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Telefone fixo</label>
            <input
              className="input"
              placeholder="(00) 0000-0000"
              value={telefoneFixo}
              maxLength={30}
              onChange={(e) => setTelefoneFixo(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Celular</label>
            <input
              className="input"
              placeholder="(00) 00000-0000"
              value={celular}
              maxLength={30}
              onChange={(e) => setCelular(e.target.value)}
            />
          </div>

          <div>
            <label className="label">E-mail</label>
            <input
              className="input"
              placeholder="email@exemplo.com"
              value={email}
              maxLength={120}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Endereço</label>
            <input
              className="input"
              placeholder="Rua, bairro, número ou referência"
              value={endereco}
              maxLength={180}
              onChange={(e) => setEndereco(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="label">Observações</label>
          <textarea
            className="input min-h-[120px]"
            placeholder="Horário de atendimento, informações extras ou orientação ao cidadão..."
            value={observacao}
            maxLength={1000}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-3 mt-6">
          <SigButton
            type="gold"
            icon={Save}
            onClick={salvar}
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Salvar Contato"}
          </SigButton>

          <button
            type="button"
            onClick={() => router.push("/sistema/portal-cidadao/contatos")}
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