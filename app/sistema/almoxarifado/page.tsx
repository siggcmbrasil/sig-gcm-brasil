"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AlmoxarifadoPage() {
  const [entradas, setEntradas] = useState<any[]>([]);
  const [saidas, setSaidas] = useState<any[]>([]);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    if (!usuario?.municipio_id) return;

    const { data: listaEntradas } = await supabase
      .from("almoxarifado_entradas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id);

    const { data: listaSaidas } = await supabase
      .from("almoxarifado_saidas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id);

    setEntradas(listaEntradas || []);
    setSaidas(listaSaidas || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    const mapa = new Map<string, any>();

    entradas.forEach((entrada) => {
      const chave = `${entrada.item}-${entrada.categoria}-${entrada.unidade}`;

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          quantidade: 0,
        });
      }

      mapa.get(chave).quantidade += Number(entrada.quantidade || 0);
    });

    saidas.forEach((saida) => {
      const chave = `${saida.item}-${saida.categoria}-${saida.unidade}`;

      if (mapa.has(chave)) {
        mapa.get(chave).quantidade -= Number(saida.quantidade || 0);
      }
    });

    const estoque = Array.from(mapa.values());

    return {
      itens: estoque.length,
      entradas: entradas.length,
      saidas: saidas.length,
      baixo: estoque.filter(
        (item) => Number(item.quantidade || 0) > 0 && Number(item.quantidade || 0) <= 5
      ).length,
    };
  }, [entradas, saidas]);

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-slate-400 font-semibold">
          Gestão de Materiais
        </p>

        <h1 className="text-2xl md:text-3xl font-black text-white">
          📦 Almoxarifado
        </h1>

        <p className="text-slate-400 mt-2">
          Controle de materiais de consumo, EPIs, uniformes e suprimentos da Guarda Municipal.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card titulo="Itens" valor={String(resumo.itens)} />
        <Card titulo="Entradas" valor={String(resumo.entradas)} />
        <Card titulo="Saídas" valor={String(resumo.saidas)} />
        <Card titulo="Estoque Baixo" valor={String(resumo.baixo)} />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Atalho
          href="/sistema/almoxarifado/entrada"
          icone="📥"
          titulo="Entradas"
          texto="Registrar materiais recebidos."
        />

        <Atalho
          href="/sistema/almoxarifado/estoque"
          icone="📦"
          titulo="Estoque"
          texto="Consultar saldo e alertas."
        />

        <Atalho
          href="/sistema/almoxarifado/saidas"
          icone="📤"
          titulo="Saídas"
          texto="Controlar entrega de materiais."
        />

            </div>

      <div className="painel-premium p-6">
        <h2 className="text-xl font-black text-white">
          Materiais Controlados
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 mt-5">
          <Item texto="👕 Uniformes e coturnos" />
          <Item texto="🦺 EPIs e coletes refletivos" />
          <Item texto="📄 Materiais de expediente" />
          <Item texto="🖨️ Toners e cartuchos" />
          <Item texto="🧹 Materiais de limpeza" />
          <Item texto="🚧 Cones e sinalizadores" />
          <Item texto="🔦 Lanternas, pilhas e baterias" />
          <Item texto="🥤 Água e suprimentos" />
          <Item texto="📦 Materiais operacionais diversos" />
        </div>
      </div>
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="painel-premium p-5">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-2xl md:text-3xl font-black text-white">{valor}</h2>
    </div>
  );
}

function Atalho({
  href,
  icone,
  titulo,
  texto,
}: {
  href: string;
  icone: string;
  titulo: string;
  texto: string;
}) {
  return (
    <Link
      href={href}
      className="painel-premium p-5 hover:scale-[1.02] transition block"
    >
      <p className="text-4xl mb-3">{icone}</p>
      <h2 className="text-xl font-black text-white">{titulo}</h2>
      <p className="text-slate-400 text-sm mt-2">{texto}</p>
    </Link>
  );
}

function Item({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 text-slate-200 font-medium">
      {texto}
    </div>
  );
}