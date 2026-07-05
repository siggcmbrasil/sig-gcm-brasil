"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Megaphone,
  Calendar,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type Comunicado = {
  id: number;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  criado_em: string;
};

export default function ComunicadosPage() {
  const [comunicados, setComunicados] =
    useState<Comunicado[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const usuario = JSON.parse(
      localStorage.getItem(
        "usuarioLogado"
      ) || "{}"
    );

    if (!usuario?.municipio_id) {
      setCarregando(false);
      return;
    }

    const { data } = await supabase
      .from("comunicados_portal")
      .select(`
        id,
        titulo,
        descricao,
        categoria,
        criado_em
      `)
      .eq(
        "municipio_id",
        usuario.municipio_id
      )
      .eq("publicado", true)
      .order("criado_em", {
        ascending: false,
      })
      .limit(50);

    setComunicados(data || []);
    setCarregando(false);
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Comunicados"
        subtitulo="Avisos oficiais da Guarda Municipal."
        icone={Bell}
      />

      {carregando ? (
        <SigCard>
          <p className="text-slate-400">
            Carregando comunicados...
          </p>
        </SigCard>
      ) : comunicados.length === 0 ? (
        <SigCard>
          <div className="text-center py-16">
            <Bell className="w-16 h-16 mx-auto text-cyan-400 mb-4" />

            <h2 className="text-2xl font-black">
              Nenhum comunicado
            </h2>

            <p className="text-slate-400 mt-2">
              Não existem comunicados
              publicados.
            </p>
          </div>
        </SigCard>
      ) : (
        <div className="grid gap-4">
          {comunicados.map((item) => (
            <SigCard key={item.id}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Megaphone className="w-7 h-7 text-cyan-400" />
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs font-black">
                      {item.categoria ||
                        "COMUNICADO"}
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-white">
                    {item.titulo}
                  </h2>

                  {item.descricao && (
                    <p className="text-slate-300 mt-3 whitespace-pre-wrap">
                      {item.descricao}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-4">
                    <Calendar className="w-4 h-4" />

                    {new Date(
                      item.criado_em
                    ).toLocaleString(
                      "pt-BR"
                    )}
                  </div>
                </div>
              </div>
            </SigCard>
          ))}
        </div>
      )}
    </div>
  );
}