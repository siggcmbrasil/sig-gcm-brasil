"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegistroPontoPage() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const u = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    setUsuario(u);

    carregar(u);
  }, []);

  async function carregar(u: any) {
    const { data } = await supabase
      .from("registro_ponto")
      .select("*")
      .eq("municipio_id", u.municipio_id)
      .order("data_hora", { ascending: false });

    setRegistros(data || []);
  }

  async function registrar(tipo: string) {
    if (!usuario) return;

    const { error } = await supabase
      .from("registro_ponto")
      .insert([
        {
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
          tipo,
          data_hora: new Date().toISOString(),
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    carregar(usuario);
  }

  return (
    <div className="p-6">
      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">
          Registro de Ponto
        </h1>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => registrar("ENTRADA")}
          className="sig-btn-gold"
        >
          Entrada
        </button>

        <button
          onClick={() => registrar("SAIDA")}
          className="sig-btn-gold"
        >
          Saída
        </button>

        <button
          onClick={() => registrar("INTERVALO")}
          className="sig-btn-gold"
        >
          Intervalo
        </button>

        <button
          onClick={() => registrar("RETORNO")}
          className="sig-btn-gold"
        >
          Retorno
        </button>
      </div>

      <div className="space-y-4">
        {registros.map((item) => (
          <div
            key={item.id}
            className="painel-premium p-4"
          >
            <p className="font-bold">
              {item.tipo}
            </p>

            <p>
              {new Date(
                item.data_hora
              ).toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}