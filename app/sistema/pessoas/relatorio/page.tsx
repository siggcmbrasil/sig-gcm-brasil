"use client";

import { useEffect, useState } from "react";
import { FileText, Users } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function RelatorioPessoasPage() {
  const [pessoas, setPessoas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    if (!usuario?.municipio_id) {
      setCarregando(false);
      return;
    }

    const { data } = await supabase
      .from("pessoas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false });

    setPessoas(data || []);
    setCarregando(false);
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Relatório de Pessoas"
        subtitulo="Resumo das pessoas cadastradas e abordadas."
        icone={FileText}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <SigCard>
          <Users className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">Total</h3>
          <p className="text-4xl font-black text-white mt-2">
            {pessoas.length}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Pessoas cadastradas
          </p>
        </SigCard>

        <SigCard>
          <h3 className="text-lg font-black text-white">Com CPF</h3>
          <p className="text-4xl font-black text-cyan-400 mt-2">
            {pessoas.filter((p) => p.cpf).length}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Registros identificados
          </p>
        </SigCard>

        <SigCard>
          <h3 className="text-lg font-black text-white">Sem CPF</h3>
          <p className="text-4xl font-black text-yellow-400 mt-2">
            {pessoas.filter((p) => !p.cpf).length}
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
          <p className="text-slate-400">Nenhuma pessoa cadastrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="text-left py-3">Nome</th>
                  <th className="text-left py-3">CPF</th>
                  <th className="text-left py-3">Telefone</th>
                </tr>
              </thead>

              <tbody>
                {pessoas.slice(0, 20).map((pessoa) => (
                  <tr key={pessoa.id} className="border-b border-slate-900">
                    <td className="py-3 font-bold text-white">
                      {pessoa.nome}
                    </td>
                    <td className="text-slate-400">
                      {pessoa.cpf || "-"}
                    </td>
                    <td className="text-slate-400">
                      {pessoa.telefone || "-"}
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