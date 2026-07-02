"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

export default function AgendaInstitucionalPage() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [titulo, setTitulo] = useState("");
  const [dataEvento, setDataEvento] = useState("");

  const usuario =
    JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

  async function carregar() {
    const { data } = await supabase
      .from("agenda_institucional")
      .select("*")
      .eq("municipio_id", usuario.municipio_id);

    setEventos(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar() {
  if (!titulo.trim()) {
    alert("Informe o título.");
    return;
  }

  if (!dataEvento) {
    alert("Informe a data.");
    return;
  }

  const { error } = await supabase
    .from("agenda_institucional")
    .insert([
      {
        municipio_id: usuario.municipio_id,
        titulo,
        data_evento: dataEvento,
        criado_por: usuario.id,
      },
    ]);

  if (error) {
    alert(error.message);
    return;
  }

  await registrarAuditoria({
    modulo: "Agenda Institucional",
    acao: "CRIAR",
    descricao: `Criou o evento "${titulo}" para ${dataEvento}.`,
  });

  setTitulo("");
  setDataEvento("");

  carregar();
}

  return (
    <div className="p-6">
      <h1 className="text-3xl font-black">
        Agenda Institucional
      </h1>
    </div>
  );
}