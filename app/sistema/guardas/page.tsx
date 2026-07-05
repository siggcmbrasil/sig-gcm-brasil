"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Users } from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import { registrarAuditoria } from "@/lib/auditoria";

type Guarda = {
  id: number;
  matricula: string;
  nome: string;
  cargo: string;
  telefone: string | null;
  status: string;
  municipio_id: number;
  data_nascimento: string | null;
  foto_url: string | null;
  graduacao?: string | null;
  lotacao?: string | null;
  ativo?: boolean | null;
};

export default function GuardasPage() {
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";
  const municipioId = usuarioLogado?.municipio_id;
  const podeEditar = perfilUsuario !== "CONSULTA";

  useEffect(() => {
    carregarGuardas();
  }, []);

  async function carregarGuardas() {
    if (!municipioId) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase
      .from("guardas")
      .select("*")
      .eq("municipio_id", municipioId)
      .eq("ativo", true)
      .order("id", { ascending: false });

    setCarregando(false);

    if (error) {
      console.error(error);
      alert("Erro ao carregar guardas.");
      return;
    }

    setGuardas(data || []);
  }

  async function desativarGuarda(id: number) {
    if (!podeEditar) {
      alert("Você não possui permissão para desativar guardas.");
      return;
    }

    const guardaDesativado = guardas.find((g) => g.id === id);

    if (
      !confirm(
        `Desativar o guarda ${
          guardaDesativado?.nome || `ID ${id}`
        }?\n\nEle não será apagado do banco. O histórico ficará preservado.`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("guardas")
      .update({
        ativo: false,
        status: "INATIVO",
        desativado_em: new Date().toISOString(),
        desativado_por: usuarioLogado?.id || null,
      })
      .eq("id", id)
      .eq("municipio_id", municipioId);

    if (error) {
      console.error(error);
      alert("Erro ao desativar guarda.");
      return;
    }

    await registrarAuditoria({
      modulo: "Guardas",
      acao: "DESATIVAR",
      tabela: "guardas",
      descricao: `Desativou o guarda ${
        guardaDesativado?.nome || `ID ${id}`
      }.`,
      detalhes: {
        guarda_id: id,
        nome: guardaDesativado?.nome || null,
        matricula: guardaDesativado?.matricula || null,
        municipio_id: municipioId,
      },
    });

    carregarGuardas();
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  const guardasFiltrados = guardas.filter((guarda) => {
    const texto = `
      ${guarda.matricula}
      ${guarda.nome}
      ${guarda.cargo}
      ${guarda.telefone || ""}
      ${guarda.status}
      ${guarda.graduacao || ""}
      ${guarda.lotacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="p-4 md:p-6 pb-24 space-y-6">
        <SigPageHeader
          titulo="Guardas"
          subtitulo="Lista do efetivo cadastrado no SIG-GCM Brasil."
          icone={Users}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SigCard>
            <p className="text-slate-400 text-sm">Efetivo total</p>
            <h2 className="text-4xl font-black text-white mt-2">
              {guardas.length}
            </h2>
          </SigCard>

          <SigCard>
            <p className="text-slate-400 text-sm">Em serviço</p>
            <h2 className="text-4xl font-black text-emerald-400 mt-2">
              {guardas.filter((g) => g.status === "Em serviço").length}
            </h2>
          </SigCard>

          <SigCard>
            <p className="text-slate-400 text-sm">Folga</p>
            <h2 className="text-4xl font-black text-yellow-400 mt-2">
              {guardas.filter((g) => g.status === "Folga").length}
            </h2>
          </SigCard>

          <SigCard>
            <p className="text-slate-400 text-sm">Férias</p>
            <h2 className="text-4xl font-black text-cyan-400 mt-2">
              {guardas.filter((g) => g.status === "Férias").length}
            </h2>
          </SigCard>
        </div>

        <SigCard>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />

              <input
                className="input pl-12"
                placeholder="Buscar por nome, matrícula, cargo, lotação ou status..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            {podeEditar && (
              <Link
                href="/sistema/guardas/novo"
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Novo Guarda
              </Link>
            )}
          </div>
        </SigCard>

        <SigCard>
          <h2 className="text-xl font-black text-white mb-5">
            Lista de Guardas
          </h2>

          {carregando ? (
            <p className="text-slate-400">Carregando guardas...</p>
          ) : guardasFiltrados.length === 0 ? (
            <p className="text-slate-400">Nenhum guarda encontrado.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {guardasFiltrados.map((guarda) => (
                <div
                  key={guarda.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-cyan-500/30 bg-slate-900 flex items-center justify-center">
                      {guarda.foto_url ? (
                        <img
                          src={guarda.foto_url}
                          alt={guarda.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">👮</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-black text-white">
                        {guarda.nome}
                      </h3>

                      <p className="text-sm text-slate-400">
                        {guarda.graduacao || guarda.cargo}
                      </p>

                      <p className="text-sm text-cyan-400 font-bold">
                        {guarda.matricula}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-slate-400">
                    <p>Telefone: {guarda.telefone || "-"}</p>
                    <p>Lotação: {guarda.lotacao || "-"}</p>
                    <p>Nascimento: {formatarData(guarda.data_nascimento)}</p>
                  </div>

                  <div className="mt-4">
                    <Status status={guarda.status} />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/sistema/guardas/${guarda.id}`}
                      className="btn-primary text-sm"
                    >
                      Dossiê
                    </Link>

                    {podeEditar && (
                      <>
                        <Link
                          href={`/sistema/guardas/novo?id=${guarda.id}`}
                          className="btn-secondary text-sm"
                        >
                          Editar
                        </Link>

                        <button
                          type="button"
                          onClick={() => desativarGuarda(guarda.id)}
                          className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-sm font-bold text-white hover:bg-red-800 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Desativar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SigCard>
      </div>
    </ProtecaoModulo>
  );
}

function Status({ status }: { status: string }) {
  let cor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";

  if (status === "Folga") {
    cor = "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
  }

  if (status === "Férias") {
    cor = "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
  }

  if (status === "Afastado" || status === "INATIVO") {
    cor = "bg-red-500/10 text-red-400 border-red-500/30";
  }

  return (
    <span
      className={`inline-block rounded-full border px-3 py-1 text-xs font-black ${cor}`}
    >
      {status}
    </span>
  );
}