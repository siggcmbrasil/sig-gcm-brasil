"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PontosVisitaPage() {
  const [pontos, setPontos] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("ESCOLA");
  const [endereco, setEndereco] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [carregando, setCarregando] = useState(true);

  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  async function carregar() {
    setCarregando(true);

    const usuario = pegarUsuario();
    const municipioId = Number(usuario?.municipio_id);

    if (!municipioId) {
      alert("Município do usuário não identificado. Faça login novamente.");
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("pontos_visita")
      .select("*")
      .eq("municipio_id", municipioId)
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar pontos de visita.");
      setCarregando(false);
      return;
    }

    setPontos(data || []);
    setCarregando(false);
  }

  async function salvar() {
    const usuario = pegarUsuario();
    const municipioId = Number(usuario?.municipio_id);

    if (!municipioId) {
      alert("Município do usuário não identificado. Faça login novamente.");
      return;
    }

    if (!nome.trim()) {
      alert("Informe o nome do local.");
      return;
    }

    const { error } = await supabase.from("pontos_visita").insert({
      municipio_id: municipioId,
      nome: nome.trim(),
      tipo,
      endereco: endereco.trim(),
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      ativo: true,
    });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setNome("");
    setTipo("ESCOLA");
    setEndereco("");
    setLatitude("");
    setLongitude("");

    carregar();
  }

  async function excluir(id: number) {
    if (!confirm("Excluir ponto?")) return;

    const usuario = pegarUsuario();
    const municipioId = Number(usuario?.municipio_id);

    const { error } = await supabase
      .from("pontos_visita")
      .delete()
      .eq("id", id)
      .eq("municipio_id", municipioId);

    if (error) {
      console.error(error);
      alert("Erro ao excluir ponto.");
      return;
    }

    carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="p-6 pb-24">
      <Link href="/sistema/visitas" className="text-blue-400 font-bold">
        ← Voltar
      </Link>

      <div className="painel-premium p-6 mt-6">
        <h1 className="text-3xl font-black">Pontos de Visita</h1>

        <p className="text-slate-400 mt-2">
          Escolas, prefeituras, comércios e locais que terão QR Code.
        </p>
      </div>

      <div className="painel-premium p-6 mt-6 space-y-4">
        <input
          className="input"
          placeholder="Nome do local"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <select
          className="input"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="ESCOLA">Escola</option>
          <option value="PREFEITURA">Prefeitura</option>
          <option value="COMERCIO">Comércio</option>
          <option value="PRACA">Praça</option>
          <option value="OUTRO">Outro</option>
        </select>

        <input
          className="input"
          placeholder="Endereço"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
        />

        <input
          className="input"
          placeholder="Latitude"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
        />

        <input
          className="input"
          placeholder="Longitude"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
        />

        <button onClick={salvar} className="sig-btn-gold">
          Salvar Ponto
        </button>
      </div>

      <div className="space-y-4 mt-6">
        {carregando ? (
          <div className="painel-premium p-5 text-slate-400">
            Carregando pontos...
          </div>
        ) : pontos.length === 0 ? (
          <div className="painel-premium p-5 text-slate-400">
            Nenhum ponto de visita cadastrado.
          </div>
        ) : (
          pontos.map((item) => (
            <div key={item.id} className="painel-premium p-5">
              <h2 className="text-xl font-black">{item.nome}</h2>

              <p className="text-yellow-400">{item.tipo}</p>

              {item.endereco && (
                <p className="text-slate-400 mt-2">{item.endereco}</p>
              )}

              <p className="text-slate-500 text-sm mt-2">
                Lat: {item.latitude || "-"} • Long: {item.longitude || "-"}
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <Link
                  href={`/sistema/visitas/qrcode?ponto=${item.id}`}
                  className="bg-blue-700 px-4 py-2 rounded-xl font-bold"
                >
                  📷 QR Code
                </Link>

                <Link
                  href={`/sistema/visitas/checkin?ponto=${item.id}`}
                  className="bg-green-700 px-4 py-2 rounded-xl font-bold"
                >
                  ✅ Testar Check-in
                </Link>

                <button
                  onClick={() => excluir(item.id)}
                  className="bg-red-700 px-4 py-2 rounded-xl font-bold"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}