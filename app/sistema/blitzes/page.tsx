"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Siren,
  MapPin,
  CalendarDays,
  Clock,
  Clock3,
  FileText,
  CheckCircle,
  PlayCircle,
  Car,
  Users,
  Bike,
  ShieldCheck,
} from "lucide-react";

export default function BlitzesPage() {
  const [blitzes, setBlitzes] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("TRANSITO");
  const [local, setLocal] = useState("");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [latitude, setLatitude] = useState("");
const [longitude, setLongitude] = useState("");

  const [pessoasAbordadas, setPessoasAbordadas] = useState("0");
  const [veiculosAbordados, setVeiculosAbordados] = useState("0");
  const [motosAbordadas, setMotosAbordadas] = useState("0");

  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  useEffect(() => {
    carregarBlitzes();
  }, []);

  async function carregarBlitzes() {
    setCarregando(true);
    const usuario = pegarUsuario();

    const { data, error } = await supabase
      .from("blitzes")
      .select(`
        *,
        resultados_blitz (*)
      `)
      .eq("municipio_id", usuario.municipio_id)
      .order("created_at", { ascending: false });

    if (!error) setBlitzes(data || []);
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

async function registrarAuditoria(
  acao: string,
  detalhes: string
) {
  const usuario = pegarUsuario();

  await supabase.from("auditoria_sistema").insert({
    municipio_id: usuario.municipio_id,
    usuario_id: usuario.id,
    modulo: "BLITZES",
    acao,
    detalhes,
  });
}

  async function salvarBlitz() {
    const usuario = pegarUsuario();

    if (!usuario?.municipio_id) {
      alert("Município do usuário não identificado.");
      return;
    }

    if (!nome || !local || !data || !horaInicio) {
      alert("Preencha nome, local, data e hora inicial.");
      return;
    }

    const { data: blitzCriada, error } = await supabase
      .from("blitzes")
      .insert([
        {
          municipio_id: usuario.municipio_id,
          nome,
          tipo,
          local,
          data,
          hora_inicio: horaInicio,
          hora_fim: horaFim || null,
          objetivo,
          observacoes,
          status: "PLANEJADA",
          criado_por: usuario.id,
          latitude: latitude ? Number(latitude) : null,
longitude: longitude ? Number(longitude) : null,
        },
      ])
      .select()
      .single();

    if (error) {
      alert("Erro ao salvar blitz.");
      console.error(error);
      return;
    }

    await registrarAuditoria(
  "CRIAR_BLITZ",
  `Criou a blitz ${nome} em ${local}`
);

    if (blitzCriada?.id) {
      await supabase.from("resultados_blitz").insert([
        {
          blitz_id: blitzCriada.id,
          pessoas_abordadas: Number(pessoasAbordadas || 0),
          veiculos_abordados: Number(veiculosAbordados || 0),
          motos_abordadas: Number(motosAbordadas || 0),
        },
      ]);
    }

    setNome("");
    setTipo("TRANSITO");
    setLocal("");
    setData("");
    setHoraInicio("");
    setHoraFim("");
    setObjetivo("");
    setObservacoes("");
    setLatitude("");
    setLongitude("");
    setPessoasAbordadas("0");
    setVeiculosAbordados("0");
    setMotosAbordadas("0");

    carregarBlitzes();
  }

  async function atualizarStatus(id: string, status: string) {
    const usuario = pegarUsuario();

    await supabase
      .from("blitzes")
      .update({ status })
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

      await registrarAuditoria(
  "ALTERAR_STATUS_BLITZ",
  `Alterou a blitz ${id} para ${status}`
);

    carregarBlitzes();
  }

  function resultadoDaBlitz(b: any) {
    return b.resultados_blitz?.[0] || {};
  }

  async function apagarTestes() {
  const usuario = pegarUsuario();

  if (!confirm("Apagar blitzes de teste deste município?")) return;

  const { error } = await supabase
    .from("blitzes")
    .delete()
    .eq("municipio_id", usuario.municipio_id)
    .or("nome.ilike.%teste%,local.ilike.%teste%,observacoes.ilike.%teste%");

  if (error) {
    alert("Erro ao apagar testes.");
    console.error(error);
    return;
  }

  await registrarAuditoria(
  "APAGAR_TESTES_BLITZ",
  "Apagou blitzes de teste do município"
);

  alert("Blitzes de teste apagadas.");
  carregarBlitzes();
}

  return (
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <div className="flex items-center gap-3">
          <Siren className="text-yellow-400" size={34} />
          <div>
            <h1 className="text-3xl font-black">Blitzes</h1>
            <p className="text-slate-400">
              Cadastro e acompanhamento de blitzes operacionais.
            </p>
          </div>
        </div>
      </div>

      <div className="painel-premium p-6 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Plus size={22} />
          Nova Blitz
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            className="input-premium"
            placeholder="Nome da operação"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <select
            className="input-premium"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="TRANSITO">Trânsito</option>
            <option value="LEI_SECA">Lei Seca</option>
            <option value="SATURACAO">Saturação</option>
            <option value="COMBATE_CRIME">Combate ao Crime</option>
            <option value="INTEGRADA">Integrada</option>
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
    className="
      absolute
      right-4
      top-1/2
      -translate-y-1/2
      text-slate-300
      pointer-events-none
    "
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
    className="
      absolute
      right-4
      top-1/2
      -translate-y-1/2
      text-slate-300
      pointer-events-none
    "
    size={20}
  />
</div>

          <div className="relative">
  <input
    className="input-premium pr-12"
    type="time"
    value={horaFim}
    onChange={(e) => setHoraInicio(e.target.value)}
  />

  <Clock3
    className="
      absolute
      right-4
      top-1/2
      -translate-y-1/2
      text-slate-300
      pointer-events-none
    "
    size={20}
  />
</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            className="input-premium"
            type="number"
            placeholder="Pessoas abordadas"
            value={pessoasAbordadas}
            onChange={(e) => setPessoasAbordadas(e.target.value)}
          />

          <input
            className="input-premium"
            type="number"
            placeholder="Veículos abordados"
            value={veiculosAbordados}
            onChange={(e) => setVeiculosAbordados(e.target.value)}
          />

          <input
            className="input-premium"
            type="number"
            placeholder="Motos abordadas"
            value={motosAbordadas}
            onChange={(e) => setMotosAbordadas(e.target.value)}
          />
        </div>

        <textarea
          className="input-premium w-full"
          placeholder="Objetivo da blitz"
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
          onClick={salvarBlitz}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl flex items-center gap-2"
        >
          <Plus size={18} />
          Salvar Blitz
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
        <h2 className="text-xl font-bold mb-4">Blitzes Cadastradas</h2>

        {carregando ? (
          <p className="text-slate-400">Carregando...</p>
        ) : blitzes.length === 0 ? (
          <p className="text-slate-400">Nenhuma blitz cadastrada.</p>
        ) : (
          <div className="space-y-4">
            {blitzes.map((b) => {
              const r = resultadoDaBlitz(b);

              return (
                <div
                  key={b.id}
                  className="border border-slate-700 rounded-xl p-4 bg-slate-900/60"
                >
                  <div className="flex justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-lg font-black flex items-center gap-2">
                        <Siren size={20} className="text-yellow-400" />
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                        <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-2">
                          <Users size={18} className="text-yellow-400" />
                          <span>Pessoas: {r.pessoas_abordadas || 0}</span>
                        </div>

                        <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-2">
                          <Car size={18} className="text-yellow-400" />
                          <span>Veículos: {r.veiculos_abordados || 0}</span>
                        </div>

                        <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-2">
                          <Bike size={18} className="text-yellow-400" />
                          <span>Motos: {r.motos_abordadas || 0}</span>
                        </div>
                      </div>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}