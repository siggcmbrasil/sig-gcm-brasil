"use client";

import { useEffect, useState } from "react";
import { Phone, Users } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigEmpty from "@/components/sig/SigEmpty";

type Contato = {
  id: number;
  nome: string;
  responsavel: string | null;
  telefone_fixo: string | null;
  celular: string | null;
  email: string | null;
  endereco: string | null;
  observacao: string | null;
};

export default function InternosPage() {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void carregar();
  }, []);

  async function carregar() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    if (!usuario?.municipio_id) {
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("contatos_cidadao")
      .select(
        "id, nome, responsavel, telefone_fixo, celular, email, endereco, observacao"
      )
      .eq("municipio_id", usuario.municipio_id)
      .eq("categoria", "INTERNO")
      .eq("ativo", true)
      .order("nome");

    if (error) {
      console.error(error);
      alert("Erro ao carregar contatos internos.");
      setCarregando(false);
      return;
    }

    setContatos(data || []);
    setCarregando(false);
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Contatos Internos"
        subtitulo="Servidores, guardas, setores administrativos e contatos internos autorizados."
        icone={Users}
      />

      {carregando ? (
        <SigCard>
          <p className="text-slate-400">Carregando contatos internos...</p>
        </SigCard>
      ) : contatos.length === 0 ? (
        <SigEmpty
          titulo="Nenhum contato cadastrado"
          descricao="Cadastre contatos com categoria Contato Interno para aparecerem aqui."
        />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {contatos.map((contato) => (
            <SigCard key={contato.id}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <Phone className="w-7 h-7 text-cyan-400" />
                </div>

                <div>
                  <h2 className="text-xl font-black text-white">
                    {contato.nome}
                  </h2>

                  {contato.responsavel && (
                    <p className="text-slate-400 text-sm mt-1">
                      Responsável: {contato.responsavel}
                    </p>
                  )}

                  <div className="mt-4 space-y-1 text-sm">
                    <p className="text-slate-300">
                      Fixo: {contato.telefone_fixo || "N/I"}
                    </p>

                    <p className="text-slate-300">
                      Celular: {contato.celular || "N/I"}
                    </p>

                    <p className="text-slate-300">
                      E-mail: {contato.email || "N/I"}
                    </p>
                  </div>

                  {contato.endereco && (
                    <p className="text-slate-500 text-sm mt-3">
                      {contato.endereco}
                    </p>
                  )}

                  {contato.observacao && (
                    <p className="text-slate-400 text-sm mt-3 whitespace-pre-wrap">
                      {contato.observacao}
                    </p>
                  )}
                </div>
              </div>
            </SigCard>
          ))}
        </div>
      )}
    </div>
  );
}