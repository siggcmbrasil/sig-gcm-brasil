"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtecaoPerfil from "@/components/ProtecaoPerfil";

type ResumoSistema = {
  municipios: number;
  municipiosAtivos: number;
  usuarios: number;
  guardas: number;
  ocorrencias: number;
};

export default function PainelDesenvolvedor() {
  const [resumo, setResumo] = useState<ResumoSistema>({
    municipios: 0,
    municipiosAtivos: 0,
    usuarios: 0,
    guardas: 0,
    ocorrencias: 0,
  });

  const [carregando, setCarregando] = useState(true);

  async function carregarResumo() {
    setCarregando(true);

    const { count: totalMunicipios } = await supabase
      .from("municipios")
      .select("*", { count: "exact", head: true });

    const { count: municipiosAtivos } = await supabase
      .from("municipios")
      .select("*", { count: "exact", head: true })
      .eq("ativo", true);

    const { count: totalUsuarios } = await supabase
      .from("usuarios")
      .select("*", { count: "exact", head: true });

    const { count: totalGuardas } = await supabase
      .from("guardas")
      .select("*", { count: "exact", head: true });

    const { count: totalOcorrencias } = await supabase
      .from("ocorrencias")
      .select("*", { count: "exact", head: true });

    setResumo({
      municipios: totalMunicipios || 0,
      municipiosAtivos: municipiosAtivos || 0,
      usuarios: totalUsuarios || 0,
      guardas: totalGuardas || 0,
      ocorrencias: totalOcorrencias || 0,
    });

    setCarregando(false);
  }

  useEffect(() => {
    carregarResumo();
  }, []);

  return (
    <ProtecaoPerfil
  perfisPermitidos={["DESENVOLVEDOR"]}
>
      <div className="p-3 md:p-6 pb-24">
        <header className="mb-6 border-b border-slate-800 pb-5">
          <h1 className="text-3xl md:text-5xl font-bold">
            🧠 Painel do Desenvolvedor
          </h1>

          <p className="text-slate-400 mt-2">
            Central mestre do SIG-GCM Brasil.
          </p>
        </header>

        {carregando ? (
          <p className="text-slate-400">Carregando painel mestre...</p>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <CardDev titulo="Municípios" valor={resumo.municipios} icone="🏛️" />
            <CardDev
              titulo="Municípios Ativos"
              valor={resumo.municipiosAtivos}
              icone="✅"
            />
            <CardDev titulo="Usuários" valor={resumo.usuarios} icone="👤" />
            <CardDev titulo="Guardas" valor={resumo.guardas} icone="👮" />
            <CardDev titulo="Ocorrências" valor={resumo.ocorrencias} icone="🚨" />
          </section>
        )}
      </div>
    </ProtecaoPerfil>
  );
}

function CardDev({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: string;
}) {
  return (
    <div className="card">
      <div className="text-4xl mb-4">{icone}</div>
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-4xl font-black mt-2">{valor}</h2>
    </div>
  );
}