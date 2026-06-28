"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Local = {
  id: number;
  nome: string;
  tipo: string;
  endereco: string | null;
  referencia: string | null;
  nivel_atencao: string;
  latitude: number | null;
  longitude: number | null;
  raio_metros: number | null;
};

const tipos = [
  "Todos",
  "Rua",
  "Bairro",
  "Comunidade",
  "Fazenda",
  "Povoado",
  "Avenida",
  "Praça",
  "Escola",
  "Posto de Saúde",
  "Local Público",
  "Órgão Público",
  "Igreja",
  "Campo",
  "Quadra",
  "Comércio",
  "Outro",
];

export default function LocaisPage() {
  const [locais, setLocais] = useState<Local[]>([]);
  const [filtro, setFiltro] = useState("Todos");

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("Rua");
  const [endereco, setEndereco] = useState("");
  const [referencia, setReferencia] = useState("");
  const [nivelAtencao, setNivelAtencao] = useState("Baixo");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [raioMetros, setRaioMetros] = useState("200");
  const [editando, setEditando] = useState<number | null>(null);

  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

  async function carregarLocais() {
    const { data, error } = await supabase
  .from("locais")
  .select("id,nome,tipo,endereco,referencia,nivel_atencao,latitude,longitude,raio_metros")
  .eq("municipio_id", usuarioLogado.municipio_id)
  .order("nome", { ascending: true });

    if (error) {
      alert("Erro ao carregar locais.");
      console.error(error);
      return;
    }

    setLocais(data || []);
  }

  useEffect(() => {
    carregarLocais();
  }, []);

  function limpar() {
    setEditando(null);
    setNome("");
    setTipo("Rua");
    setEndereco("");
    setReferencia("");
    setLatitude("");
    setLongitude("");
    setRaioMetros("200");
    setNivelAtencao("Baixo");
  }

  function capturarPontoGPS() {
  if (!navigator.geolocation) {
    alert("GPS não disponível neste dispositivo.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setLatitude(String(pos.coords.latitude));
      setLongitude(String(pos.coords.longitude));
      alert("Ponto GPS capturado com sucesso.");
    },
    (erro) => {
      console.error(erro);
      alert("Não foi possível capturar o GPS.");
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  );
}

  async function salvar() {
    if (!nome.trim()) {
      alert("Digite o nome do local.");
      return;
    }

    const dados = {
  municipio_id: usuarioLogado.municipio_id,
  nome,
  tipo,
  endereco,
  referencia,
  nivel_atencao: nivelAtencao,
  latitude: latitude ? Number(latitude) : null,
  longitude: longitude ? Number(longitude) : null,
  raio_metros: raioMetros ? Number(raioMetros) : 200,
  ativo: true,
};

    if (editando) {
      await supabase
  .from("locais")
  .update(dados)
  .eq("id", editando)
  .eq("municipio_id", usuarioLogado.municipio_id);
    } else {
      await supabase.from("locais").insert([dados]);
    }

    limpar();
    carregarLocais();
  }

  function editar(local: Local) {
    setEditando(local.id);
    setNome(local.nome);
    setTipo(local.tipo);
    setEndereco(local.endereco || "");
    setReferencia(local.referencia || "");
    setLatitude(local.latitude ? String(local.latitude) : "");
    setLongitude(local.longitude ? String(local.longitude) : "");
    setRaioMetros(local.raio_metros ? String(local.raio_metros) : "200");
    setNivelAtencao(local.nivel_atencao || "Baixo");
  }

  async function excluir(id: number) {
    if (!confirm("Deseja excluir este local?")) return;

    await supabase
  .from("locais")
  .delete()
  .eq("id", id)
  .eq("municipio_id", usuarioLogado.municipio_id);
    carregarLocais();
  }

  const listaFiltrada =
    filtro === "Todos"
      ? locais
      : locais.filter((local) => local.tipo === filtro);

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">Cadastro de Locais</h1>
        <p className="text-slate-400">
          Cadastre ruas, bairros, comunidades, povoados, fazendas, escolas e locais públicos.
        </p>
      </header>

      <section className="card space-y-4 mb-6">
        <h2 className="text-2xl font-bold">
          {editando ? "Editar Local" : "Novo Local"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nome do local</label>
            <input
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Rua do Araci"
            />
          </div>

          <div>
            <label className="label">Tipo</label>
            <select
              className="input"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              {tipos
                .filter((item) => item !== "Todos")
                .map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="label">Endereço / Bairro</label>
            <input
              className="input"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Ex: Centro"
            />
          </div>

          <div>
            <label className="label">Referência</label>
            <input
              className="input"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ex: Próximo à praça"
            />
          </div>

          <div>
            <label className="label">Nível de atenção</label>
            <select
              className="input"
              value={nivelAtencao}
              onChange={(e) => setNivelAtencao(e.target.value)}
            >
              <option>Baixo</option>
              <option>Médio</option>
              <option>Alto</option>
              <option>Crítico</option>
              <option>Estratégico</option>
            </select>
          </div>
        </div>

        <div>
  <label className="label">Raio de reconhecimento (metros)</label>
  <input
    className="input"
    type="number"
    value={raioMetros}
    onChange={(e) => setRaioMetros(e.target.value)}
    placeholder="Ex: 200"
  />
</div>

<div>
  <label className="label">Latitude</label>
  <input
    className="input"
    value={latitude}
    onChange={(e) => setLatitude(e.target.value)}
    placeholder="-11.620000"
  />
</div>

<div>
  <label className="label">Longitude</label>
  <input
    className="input"
    value={longitude}
    onChange={(e) => setLongitude(e.target.value)}
    placeholder="-38.800000"
  />
</div>

<div className="md:col-span-2">
  <button
    type="button"
    onClick={capturarPontoGPS}
    className="bg-green-700 hover:bg-green-800 px-5 py-3 rounded-xl font-semibold"
  >
    📍 Capturar ponto GPS atual
  </button>
</div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={salvar}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
          >
            {editando ? "Atualizar" : "Salvar"}
          </button>

          <button
            type="button"
            onClick={limpar}
            className="bg-slate-700 hover:bg-slate-600 px-5 py-3 rounded-xl"
          >
            Limpar
          </button>
        </div>
      </section>

      <section className="card space-y-4">
        <div>
          <label className="label">Separar por tipo</label>
          <select
            className="input"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          >
            {tipos.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <h2 className="text-2xl font-bold">Locais cadastrados</h2>

        {listaFiltrada.length === 0 ? (
          <p className="text-slate-400">Nenhum local cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {listaFiltrada.map((local) => (
              <div
                key={local.id}
                className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div>
                  <h3 className="text-xl font-bold">{local.nome}</h3>
                  <p className="text-slate-400">
                    {local.tipo} • {local.endereco || "Sem bairro/endereço"}
                  </p>
                  <p className="text-sm text-blue-400">
                    Nível: {local.nivel_atencao}
                  </p>
                  {local.latitude && local.longitude && (
  <p className="text-sm text-green-400">
    📍 GPS cadastrado • Raio: {local.raio_metros || 200}m
  </p>
)}
                  {local.referencia && (
                    <p className="text-sm text-slate-400">
                      Referência: {local.referencia}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => editar(local)}
                    className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => excluir(local.id)}
                    className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}