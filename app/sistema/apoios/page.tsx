"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PhoneCall,
  PlusCircle,
  Building2,
  Calendar,
  MapPin,
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

type Apoio = {
  id: number;
  municipio_id: number;
  tipo: string | null;
  orgao_solicitante: string | null;
  local: string | null;
  data: string | null;
  status: string | null;
  observacoes: string | null;
};

export default function ApoiosPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [apoios, setApoios] = useState<Apoio[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function iniciar() {
      const dados = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      );

      if (!dados?.id || !dados?.municipio_id) {
        alert("Sessão inválida. Faça login novamente.");
        setCarregando(false);
        return;
      }

      setUsuario(dados);

      await registrarAuditoria({
        modulo: "Apoios",
        acao: "ACESSO",
        descricao: "Acessou a listagem de apoios.",
        tabela: "apoios",
        detalhes: {
          usuario_id: dados.id,
          municipio_id: dados.municipio_id,
        },
      });

      await carregar(dados);
    }

    iniciar();
  }, []);

  async function carregar(usuarioAtual: UsuarioLogado) {
    setCarregando(true);

    const { data, error } = await supabase
      .from("apoios")
      .select(
        "id, municipio_id, tipo, orgao_solicitante, local, data, status, observacoes"
      )
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("id", { ascending: false })
      .range(0, 99);

    setCarregando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Apoios",
        acao: "ERRO",
        descricao: "Erro ao carregar apoios.",
        tabela: "apoios",
        detalhes: {
          erro: error.message,
          municipio_id: usuarioAtual.municipio_id,
        },
      });

      alert("Erro ao carregar apoios.");
      return;
    }

    setApoios(data || []);
  }

  const totalAbertos = apoios.filter(
    (item) => (item.status || "ABERTO") === "ABERTO"
  ).length;

  const totalFinalizados = apoios.filter(
    (item) => item.status === "FINALIZADO"
  ).length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Apoios"
        subtitulo="Registro de apoios operacionais e institucionais do município."
        icone={PhoneCall}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SigCard>
          <PhoneCall className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-slate-400 text-sm">Total de apoios</p>
          <h2 className="text-4xl font-black text-white mt-2">
            {carregando ? "..." : apoios.length}
          </h2>
        </SigCard>

        <SigCard>
          <Building2 className="w-8 h-8 text-yellow-400 mb-3" />
          <p className="text-slate-400 text-sm">Abertos</p>
          <h2 className="text-4xl font-black text-yellow-400 mt-2">
            {carregando ? "..." : totalAbertos}
          </h2>
        </SigCard>

        <SigCard>
          <Calendar className="w-8 h-8 text-emerald-400 mb-3" />
          <p className="text-slate-400 text-sm">Finalizados</p>
          <h2 className="text-4xl font-black text-emerald-400 mt-2">
            {carregando ? "..." : totalFinalizados}
          </h2>
        </SigCard>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <p className="text-sm text-slate-400">
          Exibindo os últimos 100 apoios registrados.
        </p>

        <Link
          href="/sistema/apoios/novo"
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          <PlusCircle size={18} />
          Novo Apoio
        </Link>
      </div>

      {carregando ? (
        <SigCard>
          <p className="text-slate-400">Carregando apoios...</p>
        </SigCard>
      ) : apoios.length === 0 ? (
        <SigCard>
          <div className="text-center py-12">
            <PhoneCall className="mx-auto text-slate-500 mb-4" size={56} />

            <h2 className="text-xl font-black text-white">
              Nenhum apoio registrado
            </h2>

            <p className="text-slate-400 mt-2">
              Cadastre o primeiro apoio operacional do município.
            </p>
          </div>
        </SigCard>
      ) : (
        <div className="space-y-4">
          {apoios.map((item) => (
            <SigCard key={item.id}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Building2 className="text-cyan-400 shrink-0" size={18} />

                    <h2 className="text-lg font-black text-white break-words">
                      {item.tipo || "Apoio"}
                    </h2>
                  </div>

                  <p className="text-slate-400 mt-1 break-words">
                    {item.orgao_solicitante || "Órgão não informado"}
                  </p>

                  <p className="text-slate-500 text-sm mt-2 flex items-center gap-2 break-words">
                    <MapPin size={15} />
                    {item.local || "Local não informado"}
                  </p>
                </div>

                <div className="md:text-right">
                  <p className="flex items-center gap-2 text-slate-400 md:justify-end">
                    <Calendar size={16} />
                    {item.data
                      ? new Date(`${item.data}T00:00:00`).toLocaleDateString(
                          "pt-BR"
                        )
                      : "-"}
                  </p>

                  <span className="inline-block mt-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-bold text-cyan-400">
                    {item.status || "ABERTO"}
                  </span>
                </div>
              </div>

              {item.observacoes && (
                <div className="mt-4 border-t border-slate-800 pt-4">
                  <p className="text-sm text-slate-400 whitespace-pre-wrap break-words">
                    {item.observacoes}
                  </p>
                </div>
              )}
            </SigCard>
          ))}
        </div>
      )}
    </div>
  );
}