"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RHDashboardPage() {
  const [dados, setDados] = useState({
    guardas: 0,
    bancoHoras: 0,
    registrosPonto: 0,
    ferias: 0,
    licencas: 0,
    atestados: 0,
    cursos: 0,
    elogios: 0,
    advertencias: 0,
  });

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    if (usuario?.municipio_id) carregar();
  }, []);

  async function contarTabela(tabela: string) {
    const { count } = await supabase
      .from(tabela)
      .select("*", { count: "exact", head: true })
      .eq("municipio_id", usuario.municipio_id);

    return count || 0;
  }

  async function carregar() {
    const [
      guardas,
      bancoHoras,
      registrosPonto,
      ferias,
      licencas,
      atestados,
      cursos,
      elogios,
      advertencias,
    ] = await Promise.all([
      contarTabela("guardas"),
      contarTabela("banco_horas"),
      contarTabela("registro_ponto"),
      contarTabela("ferias"),
      contarTabela("licencas"),
      contarTabela("atestados"),
      contarTabela("cursos"),
      contarTabela("elogios"),
      contarTabela("advertencias"),
    ]);

    setDados({
      guardas,
      bancoHoras,
      registrosPonto,
      ferias,
      licencas,
      atestados,
      cursos,
      elogios,
      advertencias,
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black">Dashboard de RH</h1>
        <p className="text-slate-400 mt-2">
          Visão geral da gestão funcional da Guarda Municipal.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card titulo="Guardas" valor={dados.guardas} icone="👮" />
        <Card titulo="Banco de Horas" valor={dados.bancoHoras} icone="⏱️" />
        <Card titulo="Registros de Ponto" valor={dados.registrosPonto} icone="🕒" />
        <Card titulo="Férias" valor={dados.ferias} icone="🏖️" />
        <Card titulo="Licenças" valor={dados.licencas} icone="📄" />
        <Card titulo="Atestados" valor={dados.atestados} icone="🏥" />
        <Card titulo="Cursos" valor={dados.cursos} icone="🎓" />
        <Card titulo="Elogios" valor={dados.elogios} icone="🏅" />
        <Card titulo="Advertências" valor={dados.advertencias} icone="⚠️" />
      </div>
    </div>
  );
}

function Card({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: string;
}) {
  return (
    <div className="painel-premium p-5">
      <p className="text-4xl">{icone}</p>
      <p className="text-slate-400 mt-4">{titulo}</p>
      <h2 className="text-4xl font-black mt-1">{valor}</h2>
    </div>
  );
}