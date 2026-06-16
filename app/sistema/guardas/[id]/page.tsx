"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  nome: string;
  matricula?: string;
  status?: string;
  data_nascimento?: string;
  foto_url?: string;
  telefone?: string;
  email?: string;
};

export default function DossieGuardaPage() {
  const params = useParams();
  const id = params.id;

  const [guarda, setGuarda] = useState<Guarda | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarGuarda();
  }, []);

  async function carregarGuarda() {
    const { data } = await supabase
      .from("guardas")
      .select("*")
      .eq("id", id)
      .single();

    setGuarda(data);
    setCarregando(false);
  }

  if (carregando) {
    return <div className="p-6 text-white">Carregando dossiê...</div>;
  }

  if (!guarda) {
    return <div className="p-6 text-white">Guarda não encontrado.</div>;
  }

  return (
    <div className="p-6 text-white space-y-6">
      <Link href="/sistema/guardas" className="text-blue-400 font-bold">
        ← Voltar para Guardas
      </Link>

      <div className="painel-premium p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-yellow-500 bg-slate-800 flex items-center justify-center text-6xl">
          {guarda.foto_url ? (
            <img src={guarda.foto_url} className="w-full h-full object-cover" />
          ) : (
            "👮"
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-4xl font-black">
            👮 {guarda.nome}
          </h1>

          <p className="text-slate-400 mt-2">
            Matrícula: {guarda.matricula || "-"}
          </p>

          <p className="text-slate-400">
            Status: {guarda.status || "Não informado"}
          </p>

          <p className="text-slate-400">
            E-mail: {guarda.email || "-"}
          </p>

          <p className="text-slate-400">
            Telefone: {guarda.telefone || "-"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <CardDossie titulo="Documentos" icone="📄" href={`/sistema/guardas/${id}/documentos`} />
        <CardDossie titulo="Cursos" icone="🎓" href={`/sistema/guardas/${id}/cursos`} />
        <CardDossie titulo="Histórico Profissional" icone="🎖️" href={`/sistema/guardas/${id}/historico`} />
        <CardDossie titulo="Escalas" icone="📅" href={`/sistema/guardas/${id}/escalas`} />
        <CardDossie titulo="Ocorrências" icone="🚨" href={`/sistema/guardas/${id}/ocorrencias`} />
        <CardDossie titulo="Patrulhamentos" icone="📍" href={`/sistema/guardas/${id}/patrulhamentos`} />
        <CardDossie titulo="Elogios" icone="🏆" href={`/sistema/guardas/${id}/elogios`} />
        <CardDossie titulo="Advertências" icone="⚠️" href={`/sistema/guardas/${id}/advertencias`} />
        <CardDossie titulo="Estatísticas" icone="📊" href={`/sistema/guardas/${id}/estatisticas`} />
      </div>
    </div>
  );
}

function CardDossie({ titulo, icone, href }: any) {
  return (
    <Link
      href={href}
      className="painel-premium p-6 hover:scale-105 transition block"
    >
      <div className="text-5xl mb-4">{icone}</div>
      <h2 className="text-xl font-black">{titulo}</h2>
    </Link>
  );
}