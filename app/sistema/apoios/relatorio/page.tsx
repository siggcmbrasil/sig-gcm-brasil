"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PhoneCall,
  PlusCircle,
  Building2,
  Calendar,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function ApoiosPage() {
  const [apoios, setApoios] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    if (!usuario?.municipio_id) {
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("apoios")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false });

    setCarregando(false);

    if (error) {
      console.error(error);
      alert("Erro ao carregar apoios.");
      return;
    }

    setApoios(data || []);
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Apoios"
        subtitulo="Lista e acompanhamento dos apoios operacionais e institucionais."
        icone={PhoneCall}
      />

      <div className="flex justify-end">
        <Link
          href="/sistema/apoios/novo"
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          Novo Apoio
        </Link>
      </div>

      {carregando ? (
        <SigCard>
          <p className="text-slate-400">Carregando apoios...</p>
        </SigCard>
      ) : apoios.length === 0 ? (
        <SigCard>
          <div className="text-center py-14">
            <PhoneCall className="w-16 h-16 mx-auto text-cyan-400 mb-4" />

            <h2 className="text-2xl font-black text-white">
              Nenhum apoio registrado
            </h2>

            <p className="text-slate-400 mt-2">
              Cadastre o primeiro apoio operacional ou institucional.
            </p>
          </div>
        </SigCard>
      ) : (
        <div className="space-y-4">
          {apoios.map((item) => (
            <SigCard key={item.id}>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-cyan-400" />

                    <h2 className="text-xl font-black text-white">
                      {item.tipo || "Apoio"}
                    </h2>
                  </div>

                  <p className="text-slate-400 mt-2">
                    Órgão: {item.orgao_solicitante || "Não informado"}
                  </p>

                  <p className="text-slate-400">
                    Solicitante: {item.solicitante || "Não informado"}
                  </p>

                  <p className="text-slate-500 text-sm mt-2">
                    Local: {item.local || "-"}
                  </p>
                </div>

                <div className="md:text-right">
                  <p className="inline-flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    {item.data || "-"} {item.hora ? `às ${item.hora}` : ""}
                  </p>

                  <div>
                    <span className="inline-block mt-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-bold text-cyan-400">
                      {item.status || "ABERTO"}
                    </span>
                  </div>
                </div>
              </div>

              {item.observacoes && (
                <div className="mt-4 border-t border-slate-800 pt-4">
                  <p className="text-sm text-slate-400 whitespace-pre-wrap">
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