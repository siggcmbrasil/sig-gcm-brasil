"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileBottomNav from "@/components/MobileBottomNav";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  ArrowLeft,
  FileText,
  MapPin,
  AlignLeft,
  Save,
  Shield,
  Car,
} from "lucide-react";

export default function NovaOcorrenciaMobilePage() {
  const router = useRouter();

  const [tipo, setTipo] = useState("");
  const [local, setLocal] = useState("");
  const [bairro, setBairro] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("MÉDIA");
  const [salvando, setSalvando] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [guarnicoes, setGuarnicoes] = useState<any[]>([]);
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [locais, setLocais] = useState<any[]>([]);
  const [guarnicaoId, setGuarnicaoId] = useState("");
  const [viaturaId, setViaturaId] = useState("");

  useEffect(() => {
    carregarApoio();
  }, []);

  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

async function carregarApoio() {
  const usuario = pegarUsuario();

  if (!usuario?.id || !usuario?.municipio_id) {
    alert("Usuário inválido ou sem município. Faça login novamente.");
    return;
  }

  const municipioId = usuario.municipio_id;

    const { data: guarnicoesData } = await supabase
      .from("guarnicoes")
      .select("id, nome")
      .eq("municipio_id", municipioId)
      .eq("ativa", true)
      .order("nome");

    const { data: viaturasData } = await supabase
      .from("viaturas")
      .select("id, prefixo")
      .eq("municipio_id", municipioId)
      .order("prefixo");

    const { data: locaisData } = await supabase
      .from("locais")
      .select("id, nome, bairro")
      .eq("municipio_id", municipioId)
      .order("nome");

    setGuarnicoes(guarnicoesData || []);
    setViaturas(viaturasData || []);
    setLocais(locaisData || []);
  }

  function capturarGPS() {
  if (!navigator.geolocation) {
    alert("GPS não suportado neste dispositivo.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
      alert("GPS capturado com sucesso.");
    },
    () => {
      alert("Não foi possível capturar o GPS.");
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  );
}

  function gerarProtocolo() {
    const agora = new Date();

    return `OC-${agora.getFullYear()}${String(
      agora.getMonth() + 1
    ).padStart(2, "0")}${String(agora.getDate()).padStart(
      2,
      "0"
    )}-${Date.now().toString().slice(-5)}`;
  }

  async function salvarOcorrencia() {
    if (!tipo || !local) {
      alert("Preencha o tipo e o local da ocorrência.");
      return;
    }

    setSalvando(true);

    const usuario = pegarUsuario();
    
    if (!usuario?.id || !usuario?.municipio_id) {
  alert("Usuário inválido ou sem município.");
  setSalvando(false);
  return;
}
    const agora = new Date();

    const { error } = await supabase.from("ocorrencias").insert([
      {
        municipio_id: usuario.municipio_id,
        protocolo: gerarProtocolo(),
        tipo,
        local,
        bairro,
        descricao,
        prioridade,
        status: "Aberta",
        latitude,
        longitude,
        data: agora.toISOString().slice(0, 10),
        hora: agora.toTimeString().slice(0, 5),
        guarnicao_id: guarnicaoId ? Number(guarnicaoId) : null,
        viatura_id: viaturaId ? Number(viaturaId) : null,
        guarda_responsavel_id: usuario.guarda_id || usuario.id || null,
        criado_por: usuario.id ? String(usuario.id) : null,
      },
    ]);

    setSalvando(false);

    if (error) {
      console.error(error);
      alert(error.message || "Erro ao salvar ocorrência.");
      return;
    }

await registrarAuditoria({
  modulo: "OCORRENCIAS",
  acao: "CRIAR_MOBILE",
  descricao: `Criou ocorrência mobile: ${tipo}.`,
  registro_id: local,
});

alert("Ocorrência registrada com sucesso.");
router.push("/sistema/mobile/ocorrencias");
  }

  return (
    <main className="min-h-screen bg-[#02060f] text-white p-4 pb-28">
      <header className="mb-5">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-2 text-sm mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
          <p className="text-blue-400 text-sm font-bold">
            Registro Mobile
          </p>

          <h1 className="text-3xl font-black mt-1">
            Nova Ocorrência
          </h1>

          <p className="text-slate-400 text-sm mt-2">
            Registro rápido para uso operacional em campo.
          </p>
        </div>
      </header>

      <section className="space-y-4">
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
          <label className="text-sm text-slate-400 mb-2 block">
            Tipo da ocorrência
          </label>

          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-400" />

            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="bg-transparent outline-none flex-1 text-white"
            >
              <option value="">Selecione</option>
              <option value="Apoio">Apoio</option>
              <option value="Perturbação do Sossego">
                Perturbação do Sossego
              </option>
              <option value="Averiguação">Averiguação</option>
              <option value="Trânsito">Trânsito</option>
              <option value="Violência Doméstica">
                Violência Doméstica
              </option>
              <option value="Furto/Roubo">Furto/Roubo</option>
              <option value="Abordagem">Abordagem</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
        </div>

        {locais.length > 0 && (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
            <label className="text-sm text-slate-400 mb-3 block">
              Locais rápidos
            </label>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {locais.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setLocal(l.nome);
                    setBairro(l.bairro || "");
                  }}
                  className="shrink-0 px-4 py-2 rounded-2xl bg-blue-600/20 text-blue-300 text-sm border border-blue-500/30"
                >
                  {l.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
          <label className="text-sm text-slate-400 mb-2 block">
            Local
          </label>

          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-green-400" />

            <input
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Rua, praça, bairro ou referência"
              className="bg-transparent outline-none flex-1 text-white"
            />
          </div>
        </div>

        <button
  type="button"
  onClick={capturarGPS}
  className="w-full rounded-3xl bg-emerald-700 border border-emerald-500 p-4 font-black active:scale-95"
>
  📍 Capturar GPS da Ocorrência
</button>

{latitude && longitude && (
  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
    GPS capturado:
    <br />
    Latitude: {latitude}
    <br />
    Longitude: {longitude}
  </div>
)}

        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
          <label className="text-sm text-slate-400 mb-2 block">
            Bairro
          </label>

          <input
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            placeholder="Bairro"
            className="bg-transparent outline-none w-full text-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
            <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              Guarnição
            </label>

            <select
              value={guarnicaoId}
              onChange={(e) => setGuarnicaoId(e.target.value)}
              className="bg-transparent outline-none w-full text-white"
            >
              <option value="">Selecione a guarnição</option>
              {guarnicoes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
            <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
              <Car className="w-4 h-4 text-green-400" />
              Viatura
            </label>

            <select
              value={viaturaId}
              onChange={(e) => setViaturaId(e.target.value)}
              className="bg-transparent outline-none w-full text-white"
            >
              <option value="">Selecione a viatura</option>
              {viaturas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.prefixo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
          <label className="text-sm text-slate-400 mb-2 block">
            Prioridade
          </label>

          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
            className="bg-transparent outline-none w-full text-white"
          >
            <option value="BAIXA">Baixa</option>
            <option value="MÉDIA">Média</option>
            <option value="ALTA">Alta</option>
          </select>
        </div>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
          <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
            <AlignLeft className="w-4 h-4" />
            Descrição
          </label>

          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva resumidamente o fato..."
            className="bg-transparent outline-none w-full min-h-32 resize-none text-white"
          />
        </div>

        <button
          onClick={salvarOcorrencia}
          disabled={salvando}
          className="w-full rounded-3xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 p-5 font-black text-lg flex items-center justify-center gap-3"
        >
          <Save className="w-6 h-6" />
          {salvando ? "Salvando..." : "Salvar Ocorrência"}
        </button>
      </section>

      <MobileBottomNav />
    </main>
  );
}