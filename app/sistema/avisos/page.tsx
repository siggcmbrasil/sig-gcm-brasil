"use client";

import { useEffect, useState } from "react";
import { Megaphone, Trash2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import ProtecaoModulo from "@/components/ProtecaoModulo";

type Aviso = {
  id: number;
  titulo: string;
  descricao: string;
  criado_em: string | null;
};

type UsuarioLogado = {
  id: number;
  perfil?: string;
  municipio_id: number;
};

export default function AvisosPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function iniciar() {
      const dados = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      ) as UsuarioLogado;

      if (!dados?.id || !dados?.municipio_id) {
        alert("Sessão inválida.");
        setCarregando(false);
        return;
      }

      setUsuario(dados);

      await registrarAuditoria({
        modulo: "Avisos",
        acao: "ACESSO",
        descricao: "Acessou a tela de avisos.",
        tabela: "avisos",
        detalhes: {
          usuario_id: dados.id,
          municipio_id: dados.municipio_id,
        },
      });

      await carregarAvisos(dados);
    }

    iniciar();
  }, []);

  async function carregarAvisos(usuarioAtual: UsuarioLogado) {
    setCarregando(true);

    const { data, error } = await supabase
      .from("avisos")
      .select("id, titulo, descricao, criado_em")
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("id", { ascending: false })
      .range(0, 99);

    setCarregando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Avisos",
        acao: "ERRO",
        descricao: "Erro ao carregar avisos.",
        tabela: "avisos",
        detalhes: {
          erro: error.message,
          municipio_id: usuarioAtual.municipio_id,
        },
      });

      alert("Erro ao carregar avisos.");
      return;
    }

    setAvisos(data || []);
  }

  async function salvarAviso() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!titulo.trim() || !descricao.trim()) {
      alert("Preencha título e descrição.");
      return;
    }

    if (titulo.length > 120) {
      alert("Título muito grande.");
      return;
    }

    if (descricao.length > 2000) {
      alert("Descrição muito grande.");
      return;
    }

    setSalvando(true);

    const dadosAviso = {
      municipio_id: usuario.municipio_id,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      criado_por: usuario.id,
    };

    const { data, error } = await supabase
      .from("avisos")
      .insert([dadosAviso])
      .select("id")
      .single();

    setSalvando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Avisos",
        acao: "ERRO",
        descricao: "Erro ao salvar aviso.",
        tabela: "avisos",
        detalhes: {
          erro: error.message,
          dados: dadosAviso,
        },
      });

      alert("Erro ao salvar aviso.");
      return;
    }

    await registrarAuditoria({
      modulo: "Avisos",
      acao: "CRIAR",
      descricao: `Criou o aviso: ${titulo.trim()}.`,
      tabela: "avisos",
      registro_id: data?.id,
      detalhes: dadosAviso,
    });

    alert("Aviso cadastrado com sucesso.");

    setTitulo("");
    setDescricao("");
    await carregarAvisos(usuario);
  }

  async function excluirAviso(id: number) {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    const aviso = avisos.find((item) => item.id === id);

    const motivo = prompt("Informe o motivo da exclusão:");

    if (!motivo?.trim()) {
      alert("Informe o motivo da exclusão.");
      return;
    }

    const { error } = await supabase
      .from("avisos")
      .delete()
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      await registrarAuditoria({
        modulo: "Avisos",
        acao: "ERRO",
        descricao: "Erro ao excluir aviso.",
        tabela: "avisos",
        registro_id: id,
        detalhes: {
          erro: error.message,
          aviso,
          motivo,
        },
      });

      alert("Erro ao excluir aviso.");
      return;
    }

    await registrarAuditoria({
      modulo: "Avisos",
      acao: "EXCLUIR",
      descricao: `Excluiu o aviso: ${aviso?.titulo || id}.`,
      tabela: "avisos",
      registro_id: id,
      detalhes: {
        motivo,
        aviso,
      },
    });

    alert("Aviso excluído com sucesso.");
    await carregarAvisos(usuario);
  }

  return (
    <ProtecaoModulo modulo="avisos">
      <div className="p-4 md:p-6 pb-24 space-y-6 text-white">
        <div className="painel-premium p-6">
          <div className="flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-yellow-400" />

            <div>
              <h1 className="text-2xl md:text-3xl font-black">
                Avisos
              </h1>

              <p className="text-slate-400 mt-1">
                Cadastre comunicados e avisos internos do sistema.
              </p>
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-bold mb-4">Novo Aviso</h2>

            <div className="space-y-4">
              <div>
                <label className="label">Título</label>
                <input
                  className="input"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Plantão Operacional"
                />
              </div>

              <div>
                <label className="label">Descrição</label>
                <textarea
                  className="input min-h-32 resize-none"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o aviso..."
                />
              </div>

              <button
                type="button"
                onClick={salvarAviso}
                disabled={salvando}
                className="sig-btn-gold w-full disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar Aviso"}
              </button>
            </div>
          </div>

          <div className="painel-premium p-6 lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">
              Avisos Cadastrados
            </h2>

            {carregando ? (
              <p className="text-slate-400">Carregando avisos...</p>
            ) : avisos.length === 0 ? (
              <p className="text-slate-400">Nenhum aviso cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {avisos.map((aviso) => (
                  <div
                    key={aviso.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-yellow-400">
                          {aviso.titulo}
                        </h3>

                        <p className="text-slate-300 mt-2 whitespace-pre-wrap">
                          {aviso.descricao}
                        </p>

                        <p className="text-xs text-slate-500 mt-3">
                          {aviso.criado_em
                            ? new Date(aviso.criado_em).toLocaleString("pt-BR")
                            : "Data não informada"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => excluirAviso(aviso.id)}
                        className="rounded-xl px-4 py-2 bg-red-950/60 border border-red-900 text-red-300 font-bold inline-flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </ProtecaoModulo>
  );
}