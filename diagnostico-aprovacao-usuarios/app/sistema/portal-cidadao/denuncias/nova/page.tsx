"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareWarning, Save, XCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type UsuarioLogado = {
  id: string;
  nome?: string;
  email?: string;
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
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      municipio_id: Number(usuario.municipio_id),
    };
  } catch {
    return null;
  }
}

export default function NovaDenunciaCidadaoPage() {
  const router = useRouter();

  const [anonima, setAnonima] = useState(false);
  const [nomeContato, setNomeContato] = useState("");
  const [telefoneContato, setTelefoneContato] = useState("");
  const [tipo, setTipo] = useState("");
  const [local, setLocal] = useState("");
  const [relato, setRelato] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvarDenuncia() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      alert("Sessão inválida.");
      return;
    }

    if (!tipo.trim()) {
      alert("Informe o tipo da denúncia.");
      return;
    }

    if (relato.trim().length < 10) {
      alert("O relato deve ter pelo menos 10 caracteres.");
      return;
    }

    if (!anonima && !nomeContato.trim() && !telefoneContato.trim()) {
      alert("Informe nome ou telefone do cidadão, ou marque como anônima.");
      return;
    }

    setSalvando(true);

    const protocolo = `DEN-${new Date().getFullYear()}-${Date.now()}`;

    const { data, error } = await supabase
      .from("denuncias_cidadao")
      .insert({
        municipio_id: usuario.municipio_id,
        protocolo,
        anonima,
        nome_contato: anonima ? null : nomeContato.trim() || null,
        telefone_contato: anonima ? null : telefoneContato.trim() || null,
        tipo: tipo.trim(),
        local: local.trim() || null,
        relato: relato.trim(),
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
        modulo: "Denúncias do Cidadão",
        acao: "ERRO",
        descricao: "Erro ao registrar denúncia do cidadão.",
        tabela: "denuncias_cidadao",
        detalhes: {
          erro: error.message,
          tipo,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao registrar denúncia.");
      return;
    }

    await registrarAuditoria({
      modulo: "Denúncias do Cidadão",
      acao: "CRIAR",
      descricao: `Registrou denúncia ${data?.protocolo}.`,
      tabela: "denuncias_cidadao",
      registro_id: data?.id,
      detalhes: {
        protocolo: data?.protocolo,
        tipo,
        anonima,
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
      },
    });

    alert(`Denúncia registrada com sucesso. Protocolo: ${protocolo}`);
    router.push("/sistema/portal-cidadao/denuncias");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Nova Denúncia"
        subtitulo="Registre uma denúncia recebida pelo Portal do Cidadão."
        icone={MessageSquareWarning}
      />

      <SigCard>
        <div className="space-y-5">
          <label className="flex items-center gap-3 text-slate-200 font-bold">
            <input
              type="checkbox"
              checked={anonima}
              onChange={(e) => setAnonima(e.target.checked)}
              className="h-5 w-5 accent-emerald-500"
            />
            Denúncia anônima
          </label>

          {!anonima && (
            <div className="grid md:grid-cols-2 gap-4">
              <Campo
                label="Nome do cidadão"
                value={nomeContato}
                onChange={setNomeContato}
                placeholder="Nome do cidadão"
              />

              <Campo
                label="Telefone para contato"
                value={telefoneContato}
                onChange={setTelefoneContato}
                placeholder="(00) 00000-0000"
              />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo da denúncia</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="input"
              >
                <option value="">Selecione</option>
                <option value="PERTURBACAO_SOSSEGO">
                  Perturbação do sossego
                </option>
                <option value="TRANSITO">Trânsito</option>
                <option value="MARIA_DA_PENHA">Maria da Penha</option>
                <option value="VIOLENCIA">Violência</option>
                <option value="PATRIMONIO_PUBLICO">Patrimônio público</option>
                <option value="ILUMINACAO_PUBLICA">Iluminação pública</option>
                <option value="CRIME_AMBIENTAL">Crime ambiental</option>
                <option value="VEICULO_ABANDONADO">Veículo abandonado</option>
                <option value="OUTROS">Outros</option>
              </select>
            </div>

            <Campo
              label="Local"
              value={local}
              onChange={setLocal}
              placeholder="Rua, bairro ou referência"
            />
          </div>

          <div>
            <label className="label">Relato da denúncia</label>
            <textarea
              value={relato}
              onChange={(e) => setRelato(e.target.value)}
              placeholder="Descreva a denúncia..."
              maxLength={2000}
              rows={6}
              className="input mt-2"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <button
              type="button"
              onClick={salvarDenuncia}
              disabled={salvando}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              <Save size={18} />
              {salvando ? "Salvando..." : "Registrar Denúncia"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/sistema/portal-cidadao/denuncias")}
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={120}
        className="input mt-2"
      />
    </div>
  );
}