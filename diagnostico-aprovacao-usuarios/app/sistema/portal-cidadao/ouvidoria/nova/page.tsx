"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Save, XCircle } from "lucide-react";

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

export default function NovaOuvidoriaPage() {
  const router = useRouter();

  const [nomeContato, setNomeContato] = useState("");
  const [telefoneContato, setTelefoneContato] = useState("");
  const [emailContato, setEmailContato] = useState("");
  const [tipo, setTipo] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      alert("Sessão inválida.");
      return;
    }

    if (!tipo.trim()) {
      alert("Informe o tipo.");
      return;
    }

    if (mensagem.trim().length < 10) {
      alert("A mensagem deve ter pelo menos 10 caracteres.");
      return;
    }

    setSalvando(true);

    const protocolo = `OUV-${new Date().getFullYear()}-${Date.now()}`;

    const { data, error } = await supabase
      .from("ouvidoria_cidadao")
      .insert({
        municipio_id: usuario.municipio_id,
        protocolo,
        nome_contato: nomeContato.trim() || null,
        telefone_contato: telefoneContato.trim() || null,
        email_contato: emailContato.trim() || null,
        tipo: tipo.trim(),
        assunto: assunto.trim() || null,
        mensagem: mensagem.trim(),
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
        modulo: "Ouvidoria",
        acao: "ERRO",
        descricao: "Erro ao salvar registro da ouvidoria.",
        tabela: "ouvidoria_cidadao",
        detalhes: {
          erro: error.message,
          tipo: tipo.trim(),
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao salvar registro.");
      return;
    }

    await registrarAuditoria({
      modulo: "Ouvidoria",
      acao: "CRIAR",
      descricao: `Criou registro de ouvidoria ${data?.protocolo}.`,
      tabela: "ouvidoria_cidadao",
      registro_id: data?.id,
      detalhes: {
        protocolo: data?.protocolo,
        tipo: tipo.trim(),
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
      },
    });

    alert(`Registro criado com sucesso. Protocolo: ${protocolo}`);
    router.push("/sistema/portal-cidadao/ouvidoria");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Novo Registro"
        subtitulo="Registrar manifestação da ouvidoria."
        icone={MessageSquare}
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
              <label className="label">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="input mt-2"
              >
                <option value="">Selecione</option>
                <option value="RECLAMACAO">Reclamação</option>
                <option value="SUGESTAO">Sugestão</option>
                <option value="ELOGIO">Elogio</option>
                <option value="DENUNCIA_ADMINISTRATIVA">
                  Denúncia Administrativa
                </option>
              </select>
            </div>

            <Campo label="Assunto" value={assunto} onChange={setAssunto} />
          </div>

          <div>
            <label className="label">Mensagem</label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={6}
              maxLength={2000}
              placeholder="Digite a manifestação..."
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
              {salvando ? "Salvando..." : "Salvar Registro"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/sistema/portal-cidadao/ouvidoria")}
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