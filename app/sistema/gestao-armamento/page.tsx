"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function GestaoArmamentoPage() {
  const [armas, setArmas] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [tipo, setTipo] = useState("PISTOLA");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [calibre, setCalibre] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [arsenal, setArsenal] = useState("");
  const [status, setStatus] = useState("DISPONIVEL");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    const { data } = await supabase
      .from("armamentos")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false });

    setArmas(data || []);
  }

  useEffect(() => {
    if (usuario?.municipio_id) carregar();
  }, []);

  async function salvar() {
    if (!marca || !modelo || !numeroSerie) {
      alert("Preencha os campos obrigatórios.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase
      .from("armamentos")
      .insert([
        {
          municipio_id: usuario.municipio_id,
          criado_por: usuario.id,
          tipo,
          marca,
          modelo,
          calibre,
          numero_serie: numeroSerie,
          arsenal,
          status,
        },
      ]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    setMarca("");
    setModelo("");
    setCalibre("");
    setNumeroSerie("");
    setArsenal("");

    carregar();
  }

  return (
    <div className="p-6">
      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">
          Gestão de Armamento
        </h1>
      </div>

      <div className="painel-premium p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">

          <select
            className="input"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option>PISTOLA</option>
            <option>REVOLVER</option>
            <option>CARABINA</option>
            <option>ESPINGARDA</option>
            <option>FUZIL</option>
          </select>

          <input
            className="input"
            placeholder="Marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
          />

          <input
            className="input"
            placeholder="Modelo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
          />

          <input
            className="input"
            placeholder="Calibre"
            value={calibre}
            onChange={(e) => setCalibre(e.target.value)}
          />

          <input
            className="input"
            placeholder="Número de Série"
            value={numeroSerie}
            onChange={(e) => setNumeroSerie(e.target.value)}
          />

          <input
            className="input"
            placeholder="Arsenal"
            value={arsenal}
            onChange={(e) => setArsenal(e.target.value)}
          />

          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>DISPONIVEL</option>
            <option>CAUTELADA</option>
            <option>MANUTENCAO</option>
            <option>BAIXADA</option>
          </select>
        </div>

        <button
          onClick={salvar}
          disabled={salvando}
          className="sig-btn-gold mt-4"
        >
          {salvando ? "Salvando..." : "Cadastrar Armamento"}
        </button>
      </div>

      <div className="space-y-4">
        {armas.map((arma) => (
          <div
            key={arma.id}
            className="painel-premium p-5"
          >
            <h2 className="font-black text-xl">
              {arma.tipo}
            </h2>

            <p>
              {arma.marca} - {arma.modelo}
            </p>

            <p>
              Série: {arma.numero_serie}
            </p>

            <p>
              Arsenal: {arma.arsenal || "N/I"}
            </p>

            <p className="text-yellow-400">
              {arma.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}