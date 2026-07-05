"use client";

import { useEffect, useState } from "react";
import { FileText, Users } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

type Pessoa = {
  id: number;
  nome: string;
  documento: string | null;
  tipo_documento: string | null;
  telefone: string | null;
  data: string | null;
  local: string | null;
  guarda: string | null;
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

export default function RelatorioPessoasPage() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void carregar();
  }, []);

  async function carregar() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("pessoas_abordadas")
      .select(
        "id, nome, documento, tipo_documento, telefone, data, local, guarda"
      )
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false })
      .limit(200);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Relatório de Pessoas",
        acao: "ERRO",
        descricao: "Erro ao carregar relatório de pessoas abordadas.",
        tabela: "pessoas_abordadas",
        detalhes: {
          erro: error.message,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao carregar relatório.");
      setCarregando(false);
      return;
    }

    await registrarAuditoria({
      modulo: "Relatório de Pessoas",
      acao: "ACESSO",
      descricao: "Acessou relatório de pessoas abordadas.",
      tabela: "pessoas_abordadas",
      detalhes: {
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
        total_registros: data?.length || 0,
      },
    });

    setPessoas((data || []) as Pessoa[]);
    setCarregando(false);
  }

  const hoje = new Date().toISOString().split("T")[0];

  const comDocumento = pessoas.filter((p) => p.documento).length;
  const semDocumento = pessoas.filter((p) => !p.documento).length;
  const registrosHoje = pessoas.filter((p) => p.data === hoje).length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Relatório de Pessoas Abordadas"
        subtitulo="Resumo das pessoas registradas em abordagens e ocorrências."
        icone={FileText}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <Users className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">Total</h3>
          <p className="text-4xl font-black text-white mt-2">
            {pessoas.length}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Pessoas registradas
          </p>
        </SigCard>

        <SigCard>
          <h3 className="text-lg font-black text-white">Hoje</h3>
          <p className="text-4xl font-black text-blue-400 mt-2">
            {registrosHoje}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Registros de hoje
          </p>
        </SigCard>

        <SigCard>
          <h3 className="text-lg font-black text-white">Com documento</h3>
          <p className="text-4xl font-black text-cyan-400 mt-2">
            {comDocumento}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Registros identificados
          </p>
        </SigCard>

        <SigCard>
          <h3 className="text-lg font-black text-white">Sem documento</h3>
          <p className="text-4xl font-black text-yellow-400 mt-2">
            {semDocumento}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Registros incompletos
          </p>
        </SigCard>
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Últimos registros
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando...</p>
        ) : pessoas.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-7xl mb-4">👤</p>
            <h3 className="text-2xl font-black text-white">
              Nenhuma pessoa registrada
            </h3>
            <p className="text-slate-400 mt-2">
              Os registros aparecerão aqui após as abordagens.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/60">
                <tr>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Documento</th>
                  <th className="text-left p-3">Telefone</th>
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Local</th>
                  <th className="text-left p-3">Guarda</th>
                </tr>
              </thead>

              <tbody>
                {pessoas.slice(0, 20).map((pessoa) => (
                  <tr key={pessoa.id} className="border-b border-slate-900">
                    <td className="p-3 font-bold text-white">
                      {pessoa.nome}
                    </td>

                    <td className="p-3 text-slate-400">
                      {pessoa.documento || "-"}
                    </td>

                    <td className="p-3 text-slate-400">
                      {pessoa.telefone || "-"}
                    </td>

                    <td className="p-3 text-slate-400">
                      {pessoa.data || "-"}
                    </td>

                    <td className="p-3 text-slate-400">
                      {pessoa.local || "-"}
                    </td>

                    <td className="p-3 text-slate-400">
                      {pessoa.guarda || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SigCard>
    </div>
  );
}