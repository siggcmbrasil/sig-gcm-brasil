"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function FeedSIGPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [texto, setTexto] = useState("");

  const usuario =
    JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

  async function carregar() {
    const { data } = await supabase
      .from("feed_sig")
      .select("*")
      .order("id", {
        ascending: false,
      });

    setPosts(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function publicar() {
    await supabase
      .from("feed_sig")
      .insert([
        {
          usuario_id: usuario.id,
          municipio_id:
            usuario.municipio_id,
          texto,
        },
      ]);

    carregar();
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-black mb-6">
        Feed SIG-GCM Brasil
      </h1>
    </div>
  );
}