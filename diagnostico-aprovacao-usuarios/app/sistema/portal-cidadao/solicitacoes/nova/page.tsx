"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Save, XCircle } from "lucide-react";

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

export default function NovaSolicitacaoPage() {
  const router = useRouter();

  const [nomeContato, setNomeContato] = useState("");
  const [telefoneContato, setTelefoneContato] = useState("");
  const [emailContato, setEmailContato] = useState("");
  const [tipo, setTipo] = useState("");
  const [local, setLocal] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      alert("Sessão inválida.");
      return;
    }

    if (!tipo.trim()) {
      alert("Informe o tipo da solicitação.");
      return;
    }

    if (descricao.trim().length < 10) {
      alert("A descrição deve ter pelo menos 10 caracteres.");
      return;
    }

    setSalvando(true);

    const protocolo = `SOL-${new Date().getFullYear()}-${Date.now()}`;

    const { data, error } = await supabase
      .from("solicitacoes_cidadao")
      .insert({
        municipio_id: usuario.municipio_id,
        protocolo,
        nome_contato: nomeContato.trim() || null,
        telefone_contato: telefoneContato.trim() || null,
        email_contato: emailContato.trim() || null,
        tipo: tipo.trim(),
        local: local.trim() || null,
        descricao: descricao.trim(),
        status: "PENDENTE",
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .select("id, protocolo")
      .single();

    setSalvando(false);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Solicitações do Cidadão",
        acao: "ERRO",
        descricao: "Erro ao salvar solicitação do cidadão.",
        tabela: "solicitacoes_cidadao",
        detalhes: {
          erro: error.message,
          tipo: tipo.trim(),
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao salvar solicitação.");
      return;
    }

    await registrarAuditoria({
      modulo: "Solicitações do Cidadão",
      acao: "CRIAR",
      descricao: `Criou solicitação ${data?.protocolo}.`,
      tabela: "solicitacoes_cidadao",
      registro_id: data?.id,
      detalhes: {
        protocolo: data?.protocolo,
        tipo: tipo.trim(),
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
      },
    });

    alert(`Solicitação criada com sucesso. Protocolo: ${protocolo}`);
    router.push("/sistema/portal-cidadao/solicitacoes");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Nova Solicitação"
        subtitulo="Registrar pedido de apoio, serviço ou demanda do cidadão."
        icone={ClipboardList}
      />

      <SigCard>
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Campo label="Nome" value={nomeContato} onChange={setNomeContato} />

            <Campo
              label="Telefone"
              value={telefoneContato}
              onChange={setTelefoneContato}
            />

            <Campo
              label="E-mail"
              value={emailContato}
              onChange={setEmailContato}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo de solicitação</label>

              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="input mt-2"
              >
                <option value="">Selecione</option>
                <option value="APOIO_EVENTO">Apoio em evento</option>
                <option value="RONDA_PREVENTIVA">Ronda preventiva</option>
                <option value="ORIENTACAO_CIDADAO">
                  Orientação ao cidadão
                </option>
                <option value="FISCALIZACAO_TRANSITO">
                  Fiscalização de trânsito
                </option>
                <option value="APOIO_ESCOLAR">Apoio escolar</option>
                <option value="PERTURBACAO_SOSSEGO">
                  Perturbação do sossego
                </option>
                <option value="ANIMAIS_SOLTOS">Animais soltos</option>
                <option value="OUTROS_SERVICOS">Outros serviços</option>
              </select>
            </div>

            <Campo label="Local" value={local} onChange={setLocal} />
          </div>

          <div>
            <label className="label">Descrição</label>

            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={6}
              maxLength={2000}
              placeholder="Descreva a solicitação..."
              className="input mt-2"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              <Save size={18} />
              {salvando ? "Salvando..." : "Salvar Solicitação"}
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/sistema/portal-cidadao/solicitacoes")
              }
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <XCircle size={18} />
              Cancelar
            </button>
          </div>
        </div>
      </SigCard>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        value={value}
        maxLength={120}
        onChange={(e) => onChange(e.target.value)}
        className="input mt-2"
      />
    </div>
  );
}