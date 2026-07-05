"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  Loader2,
  MapPinCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

const RAIO_PERMITIDO_METROS = 200;
const BUCKET_FOTOS_RONDA = "documentos-guardas";

type UsuarioLogado = {
  id: string;
  nome?: string;
  perfil: string;
  municipio_id: number;
};

type PontoRonda = {
  id: number;
  plano_id: number;
  latitude: number | null;
  longitude: number | null;
  nome_local: string | null;
};

function obterUsuarioLogado(): UsuarioLogado | null {
  try {
    const salvo = localStorage.getItem("usuarioLogado");
    if (!salvo) return null;

    const usuario = JSON.parse(salvo);

    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) {
      return null;
    }

    return {
      id: String(usuario.id),
      nome: usuario.nome,
      perfil: usuario.perfil,
      municipio_id: Number(usuario.municipio_id),
    };
  } catch {
    return null;
  }
}

export default function CheckinRondaPage() {
  const params = useSearchParams();
  const pontoId = params.get("ponto");

  const [status, setStatus] = useState("");
  const [observacao, setObservacao] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  function calcularDistanciaMetros(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  async function fazerUploadFoto() {
    if (!foto || !pontoId) return null;

    if (!foto.type.startsWith("image/")) {
      throw new Error("Envie apenas imagem.");
    }

    if (foto.size > 5 * 1024 * 1024) {
      throw new Error("A foto deve ter no máximo 5MB.");
    }

    const nomeSeguro = foto.name.replace(/[^a-zA-Z0-9.-]/g, "_");

    const nomeArquivo = `rondas/checkins/${pontoId}/${Date.now()}-${nomeSeguro}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_FOTOS_RONDA)
      .upload(nomeArquivo, foto, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error(uploadError);
      throw new Error("Erro ao enviar foto.");
    }

    const { data } = supabase.storage
      .from(BUCKET_FOTOS_RONDA)
      .getPublicUrl(nomeArquivo);

    return data.publicUrl;
  }

  async function buscarPonto(usuario: UsuarioLogado) {
    const { data, error } = await supabase
      .from("pontos_ronda")
      .select("id, plano_id, latitude, longitude, nome_local")
      .eq("id", Number(pontoId))
      .eq("municipio_id", usuario.municipio_id)
      .single();

    if (error || !data) {
      throw new Error("Ponto não encontrado.");
    }

    return data as PontoRonda;
  }

  async function fazerCheckin() {
    if (enviando) return;

    if (!pontoId || !Number.isFinite(Number(pontoId))) {
      alert("Ponto inválido.");
      return;
    }

    if (!navigator.geolocation) {
      alert("GPS não suportado neste dispositivo.");
      return;
    }

    const usuario = obterUsuarioLogado();

    if (!usuario) {
      alert("Sessão inválida.");
      return;
    }

    setEnviando(true);
    setStatus("Iniciando check-in...");

    try {
      const ponto = await buscarPonto(usuario);

      const pontoLatitude = Number(ponto.latitude);
      const pontoLongitude = Number(ponto.longitude);

      if (!Number.isFinite(pontoLatitude) || !Number.isFinite(pontoLongitude)) {
        throw new Error("Este ponto não possui latitude e longitude cadastradas.");
      }

      setStatus("Obtendo localização GPS...");

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const latitudeAtual = pos.coords.latitude;
            const longitudeAtual = pos.coords.longitude;
            const precisao = pos.coords.accuracy;

            const distancia = calcularDistanciaMetros(
              latitudeAtual,
              longitudeAtual,
              pontoLatitude,
              pontoLongitude
            );

            const distanciaArredondada = Math.round(distancia);

            if (distancia > RAIO_PERMITIDO_METROS) {
              await registrarAuditoria({
                modulo: "Rondas",
                acao: "BLOQUEADO",
                descricao: "Check-in de ronda bloqueado por distância.",
                tabela: "checkins_ronda",
                detalhes: {
                  ponto_id: Number(pontoId),
                  plano_id: ponto.plano_id,
                  distancia_metros: distanciaArredondada,
                  latitude: latitudeAtual,
                  longitude: longitudeAtual,
                  precisao,
                  municipio_id: usuario.municipio_id,
                  usuario_id: usuario.id,
                },
              });

              setStatus(
                `Fora da área permitida. Distância atual: ${distanciaArredondada} metros.`
              );

              alert(
                `Check-in bloqueado. Você está a ${distanciaArredondada} metros do ponto. Aproxime-se até ${RAIO_PERMITIDO_METROS} metros.`
              );

              setEnviando(false);
              return;
            }

            const hojeInicio = new Date();
hojeInicio.setHours(0, 0, 0, 0);

const hojeFim = new Date();
hojeFim.setHours(23, 59, 59, 999);

const { data: checkinExistente, error: erroDuplicado } = await supabase
  .from("checkins_ronda")
  .select("id")
  .eq("municipio_id", usuario.municipio_id)
  .eq("ponto_id", Number(pontoId))
  .eq("usuario_id", usuario.id)
  .gte("criado_em", hojeInicio.toISOString())
  .lte("criado_em", hojeFim.toISOString())
  .maybeSingle();

if (erroDuplicado) {
  console.error(erroDuplicado);
  alert("Erro ao verificar check-in duplicado.");
  setEnviando(false);
  return;
}

if (checkinExistente) {
  alert("Você já realizou check-in neste ponto hoje.");
  setStatus("Check-in duplicado bloqueado.");
  setEnviando(false);
  return;
}

            setStatus(foto ? "Enviando foto..." : "Registrando check-in...");

            const fotoUrl = await fazerUploadFoto();

            setStatus("Salvando check-in...");

            const { data, error } = await supabase
              .from("checkins_ronda")
              .insert({
                municipio_id: usuario.municipio_id,
                ponto_id: Number(pontoId),
                plano_id: ponto.plano_id,
                usuario_id: usuario.id,
                nome: usuario.nome || "Usuário não identificado",
                latitude: latitudeAtual,
                longitude: longitudeAtual,
                precisao,
                distancia_metros: distanciaArredondada,
                observacao: observacao.trim() || "Check-in via QR Code",
                foto_url: fotoUrl,
                criado_em: new Date().toISOString(),
              })
              .select("id")
              .single();

            if (error) {
              console.error(error);

              await registrarAuditoria({
                modulo: "Rondas",
                acao: "ERRO",
                descricao: "Erro ao registrar check-in de ronda.",
                tabela: "checkins_ronda",
                detalhes: {
                  erro: error.message,
                  ponto_id: Number(pontoId),
                  plano_id: ponto.plano_id,
                  municipio_id: usuario.municipio_id,
                  usuario_id: usuario.id,
                },
              });

              alert("Erro ao registrar check-in.");
              setStatus("Erro ao registrar check-in.");
              setEnviando(false);
              return;
            }

            await registrarAuditoria({
              modulo: "Rondas",
              acao: "CHECKIN",
              descricao: `Realizou check-in no ponto ${ponto.nome_local || ponto.id}.`,
              tabela: "checkins_ronda",
              registro_id: data?.id,
              detalhes: {
                ponto_id: Number(pontoId),
                plano_id: ponto.plano_id,
                distancia_metros: distanciaArredondada,
                latitude: latitudeAtual,
                longitude: longitudeAtual,
                precisao,
                municipio_id: usuario.municipio_id,
                usuario_id: usuario.id,
              },
            });

            setStatus("Check-in registrado com sucesso!");
            alert("Check-in registrado com sucesso!");

            setObservacao("");
            setFoto(null);
            setEnviando(false);
          } catch (error: any) {
            console.error(error);
            setStatus(error.message || "Erro ao registrar check-in.");
            alert(error.message || "Erro ao registrar check-in.");
            setEnviando(false);
          }
        },
        (erro) => {
          console.error(erro);
          setStatus("Erro ao obter GPS.");
          alert("Permita o acesso à localização.");
          setEnviando(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    } catch (error: any) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Rondas",
        acao: "ERRO",
        descricao: "Erro antes de registrar check-in de ronda.",
        tabela: "checkins_ronda",
        detalhes: {
          erro: error.message,
          ponto_id: pontoId,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      setStatus(error.message || "Erro ao iniciar check-in.");
      alert(error.message || "Erro ao iniciar check-in.");
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020b1c] text-white p-4 md:p-6 flex flex-col justify-center">
      <div className="max-w-2xl mx-auto w-full space-y-5">
        <div>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <MapPinCheck className="text-green-400" size={34} />
            Check-in de Ronda
          </h1>

          <p className="text-slate-400">
            Raio permitido: {RAIO_PERMITIDO_METROS} metros do ponto cadastrado.
          </p>
        </div>

        <div className="bg-blue-950/40 border border-blue-800 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="text-yellow-400 shrink-0 mt-1" size={22} />

          <p className="text-slate-300 text-sm">
            O check-in só será aceito se o GPS do dispositivo estiver dentro da
            área permitida do ponto da ronda.
          </p>
        </div>

        <div className="painel-premium p-5 space-y-4">
          <div>
            <label className="label">Observação</label>

            <textarea
              className="input mt-2 min-h-[120px]"
              placeholder="Ex: local verificado, sem alterações."
              value={observacao}
              maxLength={1000}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          <div>
            <label className="label flex items-center gap-2">
              <Camera size={18} />
              Foto do local
            </label>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="input mt-2"
              onChange={(e) => setFoto(e.target.files?.[0] || null)}
            />

            <p className="text-xs text-slate-500 mt-2">
              Formato: imagem. Tamanho máximo: 5MB.
            </p>
          </div>
        </div>

        {status && (
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-300 font-bold">
            {status}
          </div>
        )}

        <button
          type="button"
          onClick={fazerCheckin}
          disabled={enviando}
          className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2"
        >
          {enviando ? (
            <>
              <Loader2 size={22} className="animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              <CheckCircle size={22} />
              Fazer Check-in
            </>
          )}
        </button>
      </div>
    </div>
  );
}