"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { Trash2 } from "lucide-react";

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
  const [busca, setBusca] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

 async function carregar() {
  if (!usuario?.municipio_id) return;

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
    if (!usuario?.id || !usuario?.municipio_id) {
  alert("Sessão inválida.");
  return;
}
    if (
  !marca.trim() ||
  !modelo.trim() ||
  !numeroSerie.trim()
) {
      alert("Preencha os campos obrigatórios.");
      return;
    }

    setSalvando(true);

    const { data: existente } = await supabase
  .from("armamentos")
  .select("id")
  .eq("municipio_id", usuario.municipio_id)
  .eq("numero_serie", numeroSerie.trim().toUpperCase())
  .maybeSingle();

if (existente) {
  alert("Já existe um armamento com este número de série.");
  setSalvando(false);
  return;
}

    const { error } = await supabase
      .from("armamentos")
      .insert([
        {
          municipio_id: usuario.municipio_id,
          criado_por: usuario.id,
          tipo,
          marca: marca.trim().toUpperCase(),
modelo: modelo.trim().toUpperCase(),
calibre: calibre.trim().toUpperCase(),
numero_serie: numeroSerie.trim().toUpperCase(),
arsenal: arsenal.trim().toUpperCase(),
          status,
        },
      ]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
  modulo: "Armamentos",
  acao: "CRIAR",
  tabela: "armamentos",
  descricao: `Cadastrou armamento ${tipo} ${marca} ${modelo}.`,
  detalhes: {
    tipo,
    marca,
    modelo,
    numero_serie: numeroSerie,
    status,
  },
});

    setMarca("");
    setModelo("");
    setCalibre("");
    setNumeroSerie("");
    setArsenal("");

    carregar();
  }

  async function excluir(id: number) {
  if (!confirm("Excluir armamento?")) return;

  const { error } = await supabase
    .from("armamentos")
    .delete()
    .eq("id", id)
    .eq("municipio_id", usuario.municipio_id);

  if (error) {
    alert("Erro ao excluir.");
    return;
  }

  await registrarAuditoria({
    modulo: "Armamentos",
    acao: "EXCLUIR",
    tabela: "armamentos",
    descricao: `Excluiu armamento ID ${id}.`,
  });

  carregar();
}
const lista = armas.filter((a) =>
  `
    ${a.tipo}
    ${a.marca}
    ${a.modelo}
    ${a.numero_serie}
    ${a.status}
  `
    .toLowerCase()
    .includes(busca.toLowerCase())
);

  return (
  <ProtecaoModulo modulo="armamentos">
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
  <input
    className="input"
    placeholder="Pesquisar armamento..."
    value={busca}
    onChange={(e) => setBusca(e.target.value)}
  />

  {armas.length === 0 ? (
    <div className="painel-premium p-6 text-center">
      <p className="text-slate-400">
        Nenhum armamento cadastrado.
      </p>
    </div>
  ) : (
    lista.map((arma) => (
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

            <button
  onClick={() => excluir(arma.id)}
  className="mt-4 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-xl flex items-center gap-2"
>
  <Trash2 className="w-4 h-4" />
  Excluir
</button>
          </div>
        ))
)}
      </div>
        </div>
  </ProtecaoModulo>
);
}