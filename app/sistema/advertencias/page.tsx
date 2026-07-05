"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Eye,
  FileText,
  Plus,
  Search,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";

type Advertencia = {
  id: number;
  municipio_id: number;
  guarda_id: number;
  advertido_por: number | null;
  tipo: string | null;
  motivo: string | null;
  descricao: string | null;
  data_advertencia: string | null;
  status: string | null;
  anexo: string | null;
  criado_em: string;
  guardas:
    | {
        nome: string | null;
        matricula: string | null;
      }[]
    | null;
};

export default function AdvertenciasPage() {
  const [advertencias, setAdvertencias] = useState<Advertencia[]>([]);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregarAdvertencias();

    registrarAuditoria({
      modulo: "Advertências",
      acao: "ACESSO",
      descricao: "Acessou a página de advertências.",
    });
  }, []);

  async function carregarAdvertencias() {
    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);

    let query = supabase
      .from("advertencias")
      .select(`
        id,
        municipio_id,
        guarda_id,
        advertido_por,
        tipo,
        motivo,
        descricao,
        data_advertencia,
        status,
        anexo,
        criado_em,
        guardas (
          nome,
          matricula
        )
      `)
      .eq("municipio_id", usuario.municipio_id)
      .order("data_advertencia", { ascending: false })
      .limit(100);

    if (statusFiltro) {
      query = query.eq("status", statusFiltro);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      alert("Erro ao carregar advertências.");
      setCarregando(false);
      return;
    }

    setAdvertencias((data || []) as Advertencia[]);
    setCarregando(false);
  }

  const filtradas = advertencias.filter((item) => {
    const guarda = item.guardas?.[0];

    const texto = `
      ${guarda?.nome || ""}
      ${guarda?.matricula || ""}
      ${item.tipo || ""}
      ${item.motivo || ""}
      ${item.status || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  const resumo = useMemo(() => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    return {
      total: advertencias.length,
      ativas: advertencias.filter((a) => a.status === "ATIVA").length,
      mes: advertencias.filter((a) => {
        if (!a.data_advertencia) return false;

        const d = new Date(a.data_advertencia);

        return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
      }).length,
      guardas: new Set(advertencias.map((a) => a.guarda_id)).size,
    };
  }, [advertencias]);

  return (
    <ProtecaoModulo modulo="advertencias">
      <div className="p-4 md:p-6 pb-24 space-y-6">
        <div className="painel-premium p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-black">
                Controle Disciplinar
              </p>

              <h1 className="text-3xl md:text-4xl font-black text-white mt-2">
                ⚠️ Advertências
              </h1>

              <p className="text-slate-400 mt-2">
                Controle disciplinar dos guardas municipais com auditoria,
                filtros e histórico institucional.
              </p>
            </div>

            {["ADMIN", "COMANDANTE", "DIRETOR"].includes(usuario.perfil) && (
              <Link
                href="/sistema/advertencias/nova"
                className="sig-btn-gold inline-flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nova Advertência
              </Link>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card titulo="Total" valor={resumo.total} icone={FileText} cor="text-cyan-400" />
          <Card titulo="Ativas" valor={resumo.ativas} icone={ShieldAlert} cor="text-yellow-400" />
          <Card titulo="Este Mês" valor={resumo.mes} icone={CalendarDays} cor="text-blue-400" />
          <Card titulo="Guardas Advertidos" valor={resumo.guardas} icone={UserRound} cor="text-red-400" />
        </div>

        <div className="painel-premium p-5">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
              <Search className="w-5 h-5 text-slate-400" />

              <input
                className="w-full bg-transparent outline-none text-white"
                placeholder="Pesquisar por guarda, matrícula, tipo ou motivo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <select
              className="input"
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="ATIVA">Ativa</option>
              <option value="ARQUIVADA">Arquivada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>

            <button type="button" onClick={carregarAdvertencias} className="sig-btn-gold">
              Filtrar
            </button>
          </div>
        </div>

        <div className="painel-premium p-6">
          <h2 className="text-xl font-black text-white mb-4">
            Histórico Disciplinar
          </h2>

          {carregando ? (
            <p className="text-slate-400">Carregando advertências...</p>
          ) : filtradas.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-slate-500 mx-auto mb-3" />

              <p className="text-slate-400">
                Nenhuma advertência encontrada.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="p-3 text-left">Data</th>
                    <th className="p-3 text-left">Guarda</th>
                    <th className="p-3 text-left">Tipo</th>
                    <th className="p-3 text-left">Motivo</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {filtradas.map((item) => {
                    const guarda = item.guardas?.[0];

                    return (
                      <tr key={item.id} className="text-slate-300">
                        <td className="p-3 whitespace-nowrap">
                          {item.data_advertencia
                            ? new Date(item.data_advertencia).toLocaleDateString("pt-BR")
                            : "-"}
                        </td>

                        <td className="p-3">
                          <p className="font-bold text-white">
                            {guarda?.nome || "Guarda não informado"}
                          </p>

                          <p className="text-xs text-slate-500">
                            Matrícula: {guarda?.matricula || "-"}
                          </p>
                        </td>

                        <td className="p-3 text-yellow-400 font-bold">
                          {item.tipo || "-"}
                        </td>

                        <td className="p-3 max-w-md">
                          {item.motivo || "-"}
                        </td>

                        <td className="p-3">
                          <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-black">
                            {item.status || "ATIVA"}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <Link
                            href={`/sistema/advertencias/${item.id}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 font-bold"
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtecaoModulo>
  );
}

function Card({
  titulo,
  valor,
  icone: Icone,
  cor,
}: {
  titulo: string;
  valor: number;
  icone: any;
  cor: string;
}) {
  return (
    <div className="painel-premium p-5">
      <Icone className={`w-8 h-8 ${cor} mb-3`} />

      <p className="text-slate-400 text-sm">{titulo}</p>

      <h2 className="text-3xl font-black text-white mt-1">
        {valor}
      </h2>
    </div>
  );
}