"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  ShieldCheck,
  MapPin,
  CalendarDays,
  Clock,
  Clock3,
  FileText,
  CheckCircle,
  PlayCircle,
} from "lucide-react";

export default function BarreirasPage() {
  const [barreiras, setBarreiras] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("SEGURANCA");
  const [local, setLocal] = useState("");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  useEffect(() => {
    carregarBarreiras();
  }, []);

  async function carregarBarreiras() {
    setCarregando(true);
    const usuario = pegarUsuario();

    const { data, error } = await supabase
      .from("barreiras")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("created_at", { ascending: false });

    if (!error) setBarreiras(data || []);
    setCarregando(false);
  }

  function usarMinhaLocalizacao() {
  if (!navigator.geolocation) {
    alert("Geolocalização não suportada.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const precisao = Math.round(pos.coords.accuracy);

      if (precisao > 100) {
        alert(
          `Localização muito imprecisa: ${precisao} metros.\nUse pelo celular com GPS ligado ou preencha manualmente.`
        );
        return;
      }

      setLatitude(String(pos.coords.latitude));
      setLongitude(String(pos.coords.longitude));

      alert(`Localização capturada com precisão de ${precisao} metros.`);
    },
    () => {
      alert("Não foi possível obter sua localização.");
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    }
  );
}

  async function salvarBarreira() {
    const usuario = pegarUsuario();

    if (!usuario?.municipio_id) {
      alert("Município do usuário não identificado.");
      return;
    }

    if (!nome || !local || !data || !horaInicio) {
      alert("Preencha nome, local, data e hora inicial.");
      return;
    }

    const { error } = await supabase.from("barreiras").insert([
      {
        municipio_id: usuario.municipio_id,
        nome,
        tipo,
        local,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        data,
        hora_inicio: horaInicio,
        hora_fim: horaFim || null,
        objetivo,
        observacoes,
        status: "PLANEJADA",
        criado_por: null,
      },
    ]);

    if (error) {
      alert("Erro ao salvar barreira.");
      console.error(error);
      return;
    }

    setNome("");
    setTipo("SEGURANCA");
    setLocal("");
    setData("");
    setHoraInicio("");
    setHoraFim("");
    setObjetivo("");
    setObservacoes("");
    setLatitude("");
    setLongitude("");

    carregarBarreiras();
  }

  async function atualizarStatus(id: string, status: string) {
    const usuario = pegarUsuario();

    await supabase
      .from("barreiras")
      .update({ status })
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    carregarBarreiras();
  }

  async function apagarTestes() {
  const usuario = pegarUsuario();

  if (!confirm("Apagar barreiras de teste deste município?")) return;

  const { error } = await supabase
    .from("barreiras")
    .delete()
    .eq("municipio_id", usuario.municipio_id)
    .or("nome.ilike.%teste%,local.ilike.%teste%,observacoes.ilike.%teste%");

  if (error) {
    alert("Erro ao apagar testes.");
    console.error(error);
    return;
  }

  alert("Barreiras de teste apagadas.");
  carregarBarreiras();
}

  return (
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-yellow-400" size={34} />
          <div>
            <h1 className="text-3xl font-black">Barreiras</h1>
            <p className="text-slate-400">
              Cadastro e controle de barreiras operacionais.
            </p>
          </div>
        </div>
      </div>

      <div className="painel-premium p-6 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Plus size={22} />
          Nova Barreira
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            className="input-premium"
            placeholder="Nome da barreira"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <select
            className="input-premium"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="EDUCATIVA">Educativa</option>
            <option value="FISCALIZACAO">Fiscalização</option>
            <option value="SEGURANCA">Segurança</option>
            <option value="APOIO_POLICIAL">Apoio Policial</option>
            <option value="EVENTO">Evento</option>
          </select>

          <input
            className="input-premium"
            placeholder="Local"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
          />

          <input
  className="input-premium"
  placeholder="Latitude"
  value={latitude}
  onChange={(e) => setLatitude(e.target.value)}
/>

<input
  className="input-premium"
  placeholder="Longitude"
  value={longitude}
  onChange={(e) => setLongitude(e.target.value)}
/>

<button
  type="button"
  onClick={usarMinhaLocalizacao}
  className="
    bg-cyan-700
    hover:bg-cyan-600
    px-4 py-3
    rounded-xl
    font-bold
    text-white
  "
>
  📍 Usar minha localização
</button>

          <div className="relative">
            <input
              className="input-premium pr-12"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
            <CalendarDays
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
              size={20}
            />
          </div>

          <div className="relative">
            <input
              className="input-premium pr-12"
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
            />
            <Clock3
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
              size={20}
            />
          </div>

          <div className="relative">
            <input
              className="input-premium pr-12"
              type="time"
              value={horaFim}
              onChange={(e) => setHoraFim(e.target.value)}
            />
            <Clock3
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
              size={20}
            />
          </div>
        </div>

        <textarea
          className="input-premium w-full"
          placeholder="Objetivo da barreira"
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
        />

        <textarea
          className="input-premium w-full"
          placeholder="Observações"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        <button
          onClick={salvarBarreira}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl flex items-center gap-2"
        >
          <Plus size={18} />
          Salvar Barreira
        </button>
      </div>

      <button
  type="button"
  onClick={apagarTestes}
  className="bg-red-700 hover:bg-red-600 text-white font-bold px-5 py-3 rounded-xl"
>
  Apagar testes
</button>

      <div className="painel-premium p-6">
        <h2 className="text-xl font-bold mb-4">Barreiras Cadastradas</h2>

        {carregando ? (
          <p className="text-slate-400">Carregando...</p>
        ) : barreiras.length === 0 ? (
          <p className="text-slate-400">Nenhuma barreira cadastrada.</p>
        ) : (
          <div className="space-y-4">
            {barreiras.map((b) => (
              <div
                key={b.id}
                className="border border-slate-700 rounded-xl p-4 bg-slate-900/60"
              >
                <div className="flex justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-lg font-black flex items-center gap-2">
                      <ShieldCheck size={20} className="text-yellow-400" />
                      {b.nome}
                    </h3>

                    <p className="text-slate-400 flex items-center gap-2 mt-1">
                      <MapPin size={16} /> {b.local}
                    </p>

                    <p className="text-slate-400 flex items-center gap-2">
                      <CalendarDays size={16} /> {b.data}
                    </p>

                    <p className="text-slate-400 flex items-center gap-2">
                      <Clock size={16} />
                      {b.hora_inicio} {b.hora_fim ? `até ${b.hora_fim}` : ""}
                    </p>

                    {b.objetivo && (
                      <p className="text-slate-300 flex items-center gap-2 mt-2">
                        <FileText size={16} /> {b.objetivo}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-900 text-blue-200 text-sm font-bold text-center">
                      {b.status}
                    </span>

                    <button
                      onClick={() => atualizarStatus(b.id, "EM_ANDAMENTO")}
                      className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      <PlayCircle size={16} />
                      Iniciar
                    </button>

                    <button
                      onClick={() => atualizarStatus(b.id, "FINALIZADA")}
                      className="bg-green-600 hover:bg-green-500 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Finalizar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}