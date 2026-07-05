"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, UserSearch } from "lucide-react";

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

type Pessoa = {
  id: number;
  nome: string;
  documento: string | null;
  tipo_documento: string | null;
  telefone: string | null;
  endereco: string | null;
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

export default function BuscaPessoaPage() {
  const [busca, setBusca] = useState("");
  const [resultado, setResultado] = useState<Pessoa[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [pesquisou, setPesquisou] = useState(false);

  async function pesquisar() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      alert("Sessão inválida. Faça login novamente.");
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
      alert("Você não possui permissão para realizar consultas.");
      return;
    }

    const termoBusca = busca.trim();

    if (termoBusca.length < 3) {
      alert("Digite pelo menos 3 caracteres.");
      return;
    }

    const motivo = prompt("Informe o motivo da consulta:");

    if (!motivo?.trim()) {
      alert("Informe o motivo da consulta.");
      return;
    }

    setCarregando(true);
    setPesquisou(true);

    const termo = `%${termoBusca}%`;

    const { data, error } = await supabase
      .from("pessoas_abordadas")
      .select("id, nome, documento, tipo_documento, telefone, endereco")
      .eq("municipio_id", usuario.municipio_id)
      .or(
        `nome.ilike.${termo},documento.ilike.${termo},telefone.ilike.${termo}`
      )
      .order("id", { ascending: false })
      .limit(50);

    setCarregando(false);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Pesquisa de Pessoas",
        acao: "ERRO",
        descricao: "Erro ao pesquisar pessoa abordada.",
        tabela: "pessoas_abordadas",
        detalhes: {
          erro: error.message,
          consulta: termoBusca,
          motivo: motivo.trim(),
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao pesquisar pessoa.");
      return;
    }

    await supabase.from("consultas_operacionais").insert({
      municipio_id: usuario.municipio_id,
      tipo: "PESSOA",
      consulta: termoBusca,
      motivo: motivo.trim(),
      resultado: data && data.length > 0 ? "ENCONTRADO" : "NAO_ENCONTRADO",
      usuario_nome: usuario.nome || usuario.email || "Usuário não identificado",
      usuario_id: usuario.id,
      criado_em: new Date().toISOString(),
    });

    await registrarAuditoria({
      modulo: "Pesquisa de Pessoas",
      acao: "CONSULTAR",
      descricao: "Realizou pesquisa de pessoa abordada.",
      tabela: "pessoas_abordadas",
      detalhes: {
        consulta: termoBusca,
        motivo: motivo.trim(),
        total_resultados: data?.length || 0,
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
      },
    });

    setResultado((data || []) as Pessoa[]);
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Pesquisa de Pessoas"
        subtitulo="Consulta segura por nome, documento ou telefone, com auditoria obrigatória."
        icone={UserSearch}
      />

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Digite nome, CPF, RG ou telefone..."
            value={busca}
            maxLength={80}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void pesquisar();
              }
            }}
          />

          <button
            type="button"
            onClick={pesquisar}
            disabled={carregando}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Search className="w-5 h-5" />
            {carregando ? "Buscando..." : "Buscar"}
          </button>
        </div>

        <p className="text-slate-500 text-xs mt-3">
          Toda consulta exige motivo e fica registrada na auditoria do SIG-GCM
          Brasil.
        </p>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">Resultados</h2>

        {carregando ? (
          <p className="text-slate-400">Consultando registros...</p>
        ) : !pesquisou ? (
          <div className="py-16 text-center">
            <UserSearch className="w-16 h-16 mx-auto text-cyan-400 mb-4" />

            <h3 className="text-2xl font-black text-white">
              Realize uma pesquisa
            </h3>

            <p className="text-slate-400 mt-2">
              Digite um termo e informe o motivo da consulta.
            </p>
          </div>
        ) : resultado.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-7xl mb-4">🔎</p>

            <h3 className="text-2xl font-black text-white">
              Nenhuma pessoa encontrada
            </h3>

            <p className="text-slate-400 mt-2">
              Não há registros neste município para a consulta informada.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resultado.map((pessoa) => (
              <Link
                key={pessoa.id}
                href={`/sistema/pessoas-abordadas/${pessoa.id}`}
                className="block rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4 hover:border-cyan-400/50 transition"
              >
                <h3 className="text-lg font-black text-white">
                  {pessoa.nome}
                </h3>

                <p className="text-sm text-slate-400 mt-1">
                  Documento: {pessoa.documento || "Não informado"} • Tipo:{" "}
                  {pessoa.tipo_documento || "N/I"} • Telefone:{" "}
                  {pessoa.telefone || "Não informado"}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Endereço: {pessoa.endereco || "Não informado"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}