"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, ShieldAlert } from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

export default function NovaAdvertenciaPage() {
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [guardaId, setGuardaId] = useState("");
  const [tipo, setTipo] = useState("ESCRITA");
  const [motivo, setMotivo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregarGuardas();
  }, []);

  async function carregarGuardas() {
    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("guardas")
      .select("id, nome, matricula")
      .eq("municipio_id", usuario.municipio_id)
      .eq("status", "ATIVO")
      .order("nome", { ascending: true });

    if (error) {
      console.error(error);
      alert("Erro ao carregar guardas.");
      setCarregando(false);
      return;
    }

    setGuardas(data || []);
    setCarregando(false);
  }

  async function salvar() {
    if (!usuario?.municipio_id || !usuario?.id) {
      alert("Sessão inválida.");
      return;
    }

    if (!["ADMIN", "COMANDANTE", "DIRETOR"].includes(usuario.perfil)) {
      alert("Você não possui permissão para criar advertência.");
      return;
    }

    if (!guardaId) {
      alert("Selecione um guarda.");
      return;
    }

    if (!motivo.trim()) {
      alert("Informe o motivo.");
      return;
    }

    if (motivo.trim().length < 5) {
      alert("O motivo deve ter pelo menos 5 caracteres.");
      return;
    }

    if (!descricao.trim()) {
      alert("Informe a descrição.");
      return;
    }

    if (descricao.trim().length < 10) {
      alert("A descrição deve ter pelo menos 10 caracteres.");
      return;
    }

    if (new Date(data) > new Date()) {
      alert("A data da advertência não pode ser futura.");
      return;
    }

    const guarda = guardas.find((g) => String(g.id) === guardaId);

    if (!guarda) {
      alert("Guarda inválido.");
      return;
    }

    setSalvando(true);

    const dados = {
      municipio_id: usuario.municipio_id,
      guarda_id: Number(guardaId),
      advertido_por: usuario.id,
      tipo,
      motivo: motivo.trim(),
      descricao: descricao.trim(),
      data_advertencia: data,
      status: "ATIVA",
    };

    const { data: criada, error } = await supabase
      .from("advertencias")
      .insert(dados)
      .select("id")
      .single();

    if (error) {
      console.error(error);
      alert(error.message || "Erro ao salvar advertência.");
      setSalvando(false);
      return;
    }

    await registrarAuditoria({
      modulo: "Advertências",
      acao: "CRIAR",
      descricao: `Criou advertência ${tipo} para ${guarda.nome}.`,
      tabela: "advertencias",
      registro_id: criada?.id,
      detalhes: {
        guarda_id: guarda.id,
        guarda_nome: guarda.nome,
        matricula: guarda.matricula,
        tipo,
        motivo: motivo.trim(),
        data,
      },
    });

    alert("Advertência cadastrada com sucesso.");

    setGuardaId("");
    setTipo("ESCRITA");
    setMotivo("");
    setDescricao("");
    setData(new Date().toISOString().split("T")[0]);
    setSalvando(false);
  }

  return (
    <ProtecaoModulo modulo="advertencias">
      <div className="p-4 md:p-6 pb-24 space-y-6">
        <div className="painel-premium p-6">
          <Link
            href="/sistema/advertencias"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Advertências
          </Link>

          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
              <ShieldAlert className="w-10 h-10 text-yellow-400" />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-black">
                Controle Disciplinar
              </p>

              <h1 className="text-3xl md:text-4xl font-black text-white mt-2">
                Nova Advertência
              </h1>

              <p className="text-slate-400 mt-2 max-w-3xl">
                Registre uma advertência disciplinar vinculada ao guarda, com
                auditoria e rastreabilidade por município.
              </p>
            </div>
          </div>
        </div>

        <div className="painel-premium p-6 max-w-4xl">
          {carregando ? (
            <p className="text-slate-400">Carregando guardas...</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label">Guarda advertido *</label>
                <select
                  value={guardaId}
                  onChange={(e) => setGuardaId(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Selecione o Guarda</option>

                  {guardas.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome} {g.matricula ? `- ${g.matricula}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Tipo *</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="input w-full"
                >
                  <option value="VERBAL">Verbal</option>
                  <option value="ESCRITA">Escrita</option>
                  <option value="DISCIPLINAR">Disciplinar</option>
                  <option value="ADMINISTRATIVA">Administrativa</option>
                </select>
              </div>

              <div>
                <label className="label">Data *</label>
                <input
                  type="date"
                  className="input w-full"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Motivo *</label>
                <input
                  className="input w-full"
                  placeholder="Ex: Descumprimento de ordem de serviço"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  maxLength={150}
                />

                <p className="text-xs text-slate-500 mt-1">
                  {motivo.length}/150 caracteres
                </p>
              </div>

              <div>
                <label className="label">Descrição detalhada *</label>
                <textarea
                  className="input w-full min-h-40"
                  placeholder="Descreva os fatos de forma clara e objetiva..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  maxLength={2000}
                />

                <p className="text-xs text-slate-500 mt-1">
                  {descricao.length}/2000 caracteres
                </p>
              </div>

              <button
                onClick={salvar}
                disabled={salvando}
                className="sig-btn-gold w-full inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save className="w-5 h-5" />
                {salvando ? "Salvando..." : "Salvar Advertência"}
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtecaoModulo>
  );
}