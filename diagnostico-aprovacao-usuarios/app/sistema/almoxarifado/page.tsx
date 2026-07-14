"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  Package,
  ShieldAlert,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type UsuarioLogado = {
  id: number;
  nome?: string;
  perfil?: string;
  municipio_id: number;
};

type MovimentoAlmoxarifado = {
  id: number;
  municipio_id: number;
  item: string;
  categoria: string | null;
  unidade: string | null;
  quantidade: number | string | null;
  criado_em: string | null;
};

type EstoqueItem = {
  item: string;
  categoria: string;
  unidade: string;
  quantidade: number;
};

export default function AlmoxarifadoPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [entradas, setEntradas] = useState<MovimentoAlmoxarifado[]>([]);
  const [saidas, setSaidas] = useState<MovimentoAlmoxarifado[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const usuarioSalvo = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    if (!usuarioSalvo?.id || !usuarioSalvo?.municipio_id) {
      alert("Sessão inválida. Faça login novamente.");
      setCarregando(false);
      return;
    }

    setUsuario(usuarioSalvo);
    carregar(usuarioSalvo);
  }, []);

  async function carregar(usuarioAtual: UsuarioLogado) {
    try {
      setCarregando(true);

      const { data: listaEntradas, error: erroEntradas } = await supabase
        .from("almoxarifado_entradas")
        .select(
          "id, municipio_id, item, categoria, unidade, quantidade, criado_em"
        )
        .eq("municipio_id", usuarioAtual.municipio_id)
        .order("criado_em", { ascending: false })
        .range(0, 99);

      if (erroEntradas) {
        await registrarAuditoria({
          modulo: "Almoxarifado",
          acao: "ERRO",
          descricao: "Erro ao carregar entradas do almoxarifado.",
          tabela: "almoxarifado_entradas",
          detalhes: {
            erro: erroEntradas.message,
            municipio_id: usuarioAtual.municipio_id,
          },
        });

        alert("Erro ao carregar entradas do almoxarifado.");
        return;
      }

      const { data: listaSaidas, error: erroSaidas } = await supabase
        .from("almoxarifado_saidas")
        .select(
          "id, municipio_id, item, categoria, unidade, quantidade, criado_em"
        )
        .eq("municipio_id", usuarioAtual.municipio_id)
        .order("criado_em", { ascending: false })
        .range(0, 99);

      if (erroSaidas) {
        await registrarAuditoria({
          modulo: "Almoxarifado",
          acao: "ERRO",
          descricao: "Erro ao carregar saídas do almoxarifado.",
          tabela: "almoxarifado_saidas",
          detalhes: {
            erro: erroSaidas.message,
            municipio_id: usuarioAtual.municipio_id,
          },
        });

        alert("Erro ao carregar saídas do almoxarifado.");
        return;
      }

      setEntradas(listaEntradas || []);
      setSaidas(listaSaidas || []);

      await registrarAuditoria({
  modulo: "Almoxarifado",
  acao: "ACESSO",
  descricao: "Acessou o painel do almoxarifado.",
  tabela: "almoxarifado_entradas",
  detalhes: {
    total_entradas: listaEntradas?.length || 0,
    total_saidas: listaSaidas?.length || 0,
    municipio_id: usuarioAtual.municipio_id,
    usuario_id: usuarioAtual.id,
  },
});
    } finally {
      setCarregando(false);
    }
  }

  const estoque = useMemo(() => {
    const mapa = new Map<string, EstoqueItem>();

    entradas.forEach((entrada) => {
      const item = entrada.item?.trim() || "Item não informado";
      const categoria = entrada.categoria?.trim() || "Sem categoria";
      const unidade = entrada.unidade?.trim() || "UN";
      const chave = `${item}-${categoria}-${unidade}`;

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          item,
          categoria,
          unidade,
          quantidade: 0,
        });
      }

      mapa.get(chave)!.quantidade += Number(entrada.quantidade || 0);
    });

    saidas.forEach((saida) => {
      const item = saida.item?.trim() || "Item não informado";
      const categoria = saida.categoria?.trim() || "Sem categoria";
      const unidade = saida.unidade?.trim() || "UN";
      const chave = `${item}-${categoria}-${unidade}`;

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          item,
          categoria,
          unidade,
          quantidade: 0,
        });
      }

      mapa.get(chave)!.quantidade -= Number(saida.quantidade || 0);
    });

    return Array.from(mapa.values());
  }, [entradas, saidas]);

  const resumo = useMemo(() => {
    return {
      itens: estoque.length,
      entradas: entradas.length,
      saidas: saidas.length,
      baixo: estoque.filter(
        (item) => item.quantidade > 0 && item.quantidade <= 5
      ).length,
    };
  }, [estoque, entradas, saidas]);

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Almoxarifado"
        subtitulo="Controle de materiais de consumo, EPIs, uniformes e suprimentos da Guarda Municipal."
        icone={Package}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SigCard>
          <Boxes className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-slate-400 text-sm">Itens em estoque</p>
          <h2 className="text-3xl font-black text-white mt-2">
            {carregando ? "..." : resumo.itens}
          </h2>
        </SigCard>

        <SigCard>
          <ArrowDownCircle className="w-8 h-8 text-emerald-400 mb-3" />
          <p className="text-slate-400 text-sm">Entradas</p>
          <h2 className="text-3xl font-black text-white mt-2">
            {carregando ? "..." : resumo.entradas}
          </h2>
        </SigCard>

        <SigCard>
          <ArrowUpCircle className="w-8 h-8 text-yellow-400 mb-3" />
          <p className="text-slate-400 text-sm">Saídas</p>
          <h2 className="text-3xl font-black text-white mt-2">
            {carregando ? "..." : resumo.saidas}
          </h2>
        </SigCard>

        <SigCard>
          <ShieldAlert className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-slate-400 text-sm">Estoque baixo</p>
          <h2 className="text-3xl font-black text-red-400 mt-2">
            {carregando ? "..." : resumo.baixo}
          </h2>
        </SigCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          texto="Consultar saldo, categorias e alertas."
        />

        <Atalho
          href="/sistema/almoxarifado/saidas"
          icone="📤"
          titulo="Saídas"
          texto="Controlar entrega de materiais."
        />
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white">
          Materiais Controlados
        </h2>

        <p className="text-sm text-slate-400 mt-1">
          Categorias recomendadas para controle institucional.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-5">
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
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white">
          Estoque Atual
        </h2>

        {carregando ? (
          <p className="text-slate-400 mt-4">Carregando estoque...</p>
        ) : estoque.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-cyan-400 mb-4" />
            <h3 className="text-2xl font-black text-white">
              Nenhum material registrado
            </h3>
            <p className="text-slate-400 mt-2">
              Registre uma entrada para começar o controle do almoxarifado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="text-left py-3 pr-4">Item</th>
                  <th className="text-left py-3 pr-4">Categoria</th>
                  <th className="text-left py-3 pr-4">Unidade</th>
                  <th className="text-left py-3 pr-4">Saldo</th>
                  <th className="text-left py-3 pr-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {estoque.map((item) => (
                  <tr
                    key={`${item.item}-${item.categoria}-${item.unidade}`}
                    className="border-b border-slate-900"
                  >
                    <td className="py-3 pr-4 text-white font-bold">
                      {item.item}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      {item.categoria}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      {item.unidade}
                    </td>
                    <td className="py-3 pr-4 text-white font-black">
                      {item.quantidade}
                    </td>
                    <td className="py-3 pr-4">
                      {item.quantidade <= 0 ? (
                        <span className="text-red-400 font-bold">
                          Sem estoque
                        </span>
                      ) : item.quantidade <= 5 ? (
                        <span className="text-yellow-400 font-bold">
                          Baixo
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold">
                          Normal
                        </span>
                      )}
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