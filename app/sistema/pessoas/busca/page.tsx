"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, UserSearch } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function BuscaPessoaPage() {
  const [busca, setBusca] = useState("");
  const [resultado, setResultado] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  async function pesquisar() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    if (!busca.trim()) {
      alert("Digite nome, CPF, RG ou telefone.");
      return;
    }

    setCarregando(true);

    const termo = `%${busca.trim()}%`;

    const { data, error } = await supabase
      .from("pessoas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .or(`nome.ilike.${termo},cpf.ilike.${termo},rg.ilike.${termo},telefone.ilike.${termo}`)
      .order("id", { ascending: false });

    setCarregando(false);

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.from("consultas_operacionais").insert({
  municipio_id: usuario.municipio_id,
  tipo: "PESSOA",
  consulta: busca.trim(),
  motivo: "Pesquisa de pessoa no SIG",
  resultado: data && data.length > 0 ? "ENCONTRADO" : "NÃO ENCONTRADO",
  usuario_nome: usuario.nome || usuario.email || "Usuário não identificado",
  criado_em: new Date().toISOString(),
});

    setResultado(data || []);
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Pesquisa de Pessoas"
        subtitulo="Localize pessoas por nome, CPF, RG ou telefone."
        icone={UserSearch}
      />

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Digite nome, CPF, RG ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") pesquisar();
            }}
          />

          <button
            onClick={pesquisar}
            disabled={carregando}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Search className="w-5 h-5" />
            {carregando ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Resultados
        </h2>

        {resultado.length === 0 ? (
          <p className="text-slate-400">Nenhuma pessoa encontrada.</p>
        ) : (
          <div className="space-y-3">
            {resultado.map((pessoa) => (
              <Link
                key={pessoa.id}
                href={`/sistema/pessoas/${pessoa.id}`}
                className="block rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4 hover:border-cyan-400/50 transition"
              >
                <h3 className="text-lg font-black text-white">
                  {pessoa.nome}
                </h3>

                <p className="text-sm text-slate-400 mt-1">
                  CPF: {pessoa.cpf || "Não informado"} • Telefone:{" "}
                  {pessoa.telefone || "Não informado"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}