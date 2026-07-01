"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PhoneCall,
  PlusCircle,
  Building2,
  Calendar,
  FileText,
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
      return;
    }

    setApoios(data || []);
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Apoios"
        subtitulo="Registro de apoios operacionais e institucionais."
        icone={PhoneCall}
      />

      <div className="flex justify-end">
        <Link
          href="/sistema/apoios/novo"
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusCircle size={18} />
          Novo Apoio
        </Link>
      </div>

      {carregando ? (
        <SigCard>
          <p className="text-slate-400">
            Carregando apoios...
          </p>
        </SigCard>
      ) : apoios.length === 0 ? (
        <SigCard>
          <div className="text-center py-10">
            <PhoneCall
              className="mx-auto text-slate-500 mb-4"
              size={50}
            />

            <h2 className="text-xl font-black text-white">
              Nenhum apoio registrado
            </h2>

            <p className="text-slate-400 mt-2">
              Cadastre o primeiro apoio operacional.
            </p>
          </div>
        </SigCard>
      ) : (
        <div className="space-y-4">
          {apoios.map((item) => (
            <SigCard key={item.id}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2
                      className="text-cyan-400"
                      size={18}
                    />

                    <h2 className="text-lg font-black text-white">
                      {item.tipo || "Apoio"}
                    </h2>
                  </div>

                  <p className="text-slate-400 mt-1">
                    {item.orgao_solicitante ||
                      "Órgão não informado"}
                  </p>

                  <p className="text-slate-500 text-sm mt-2">
                    {item.local}
                  </p>
                </div>

                <div className="text-right">
                  <p className="flex items-center gap-2 text-slate-400 justify-end">
                    <Calendar size={16} />
                    {item.data || "-"}
                  </p>

                  <span className="inline-block mt-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-bold text-cyan-400">
                    {item.status || "ABERTO"}
                  </span>
                </div>
              </div>

              {item.observacoes && (
                <div className="mt-4 border-t border-slate-800 pt-4">
                  <p className="text-sm text-slate-400">
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