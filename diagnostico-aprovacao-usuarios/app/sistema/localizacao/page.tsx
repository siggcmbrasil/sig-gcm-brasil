"use client";

import { useState } from "react";
import {
  MapPin,
  Navigation,
  Trash2,
  Send,
  Car,
  Footprints,
  Bike,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

export default function PatrulhamentoGpsPage() {
  const [tipo, setTipo] = useState("VIATURA");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  async function enviarLocalizacao() {
    if (!navigator.geolocation) {
      alert("GPS não suportado neste dispositivo.");
      return;
    }

    const usuario = pegarUsuario();

    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Usuário ou município não identificado.");
      return;
    }

    setEnviando(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const dados = {
            guarda_id: usuario.id,
            nome: usuario.nome || "Usuário sem nome",
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            precisao: pos.coords.accuracy || null,
            municipio_id: usuario.municipio_id,
            status: tipo,
            observacao: observacao.trim() || null,
            atualizado_em: new Date().toISOString(),
          };

          const { data: existente, error: erroBusca } = await supabase
            .from("localizacoes_tempo_real")
            .select("id")
            .eq("guarda_id", usuario.id)
            .eq("municipio_id", usuario.municipio_id)
            .maybeSingle();

          if (erroBusca) throw erroBusca;

          const { error } = existente
            ? await supabase
                .from("localizacoes_tempo_real")
                .update(dados)
                .eq("id", existente.id)
                .eq("municipio_id", usuario.municipio_id)
            : await supabase.from("localizacoes_tempo_real").insert(dados);

          if (error) throw error;

          await registrarAuditoria({
            modulo: "Localização em Tempo Real",
            acao: existente ? "ATUALIZAR_LOCALIZACAO" : "CRIAR_LOCALIZACAO",
            tabela: "localizacoes_tempo_real",
            descricao: `Atualizou localização em tempo real como ${tipo}.`,
            detalhes: {
              guarda_id: usuario.id,
              municipio_id: usuario.municipio_id,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              precisao: pos.coords.accuracy || null,
              tipo,
            },
          });

          alert("Localização atualizada!");
          setObservacao("");
        } catch (error: any) {
          console.error("Erro completo ao enviar localização:", error);

          alert(
            error?.message ||
              "Erro ao enviar localização. Verifique o console."
          );
        } finally {
          setEnviando(false);
        }
      },
      (erro) => {
        console.error(erro);
        alert("Não foi possível obter sua localização.");
        setEnviando(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  async function limparMeusPontos() {
    const confirmar = confirm("Deseja excluir sua localização do mapa?");
    if (!confirmar) return;

    const usuario = pegarUsuario();

    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Usuário ou município não identificado.");
      return;
    }

    const { error } = await supabase
      .from("localizacoes_tempo_real")
      .delete()
      .eq("guarda_id", usuario.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      console.error("Erro ao excluir pontos:", error);
      alert("Erro ao excluir localização.");
      return;
    }

    await registrarAuditoria({
      modulo: "Localização em Tempo Real",
      acao: "REMOVER_LOCALIZACAO",
      tabela: "localizacoes_tempo_real",
      descricao: "Removeu a própria localização do mapa operacional.",
      detalhes: {
        guarda_id: usuario.id,
        municipio_id: usuario.municipio_id,
      },
    });

    alert("Localização removida do mapa.");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Localização em Tempo Real"
        subtitulo="Compartilhe sua posição atual com o Centro Operacional."
        icone={MapPin}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <InfoCard
          titulo="Alta precisão"
          texto="Usa o GPS do dispositivo para enviar latitude e longitude."
          icone={Navigation}
        />

        <InfoCard
          titulo="Mapa Operacional"
          texto="Sua localização aparece na central em tempo real."
          icone={MapPin}
        />

        <InfoCard
          titulo="Multi-município"
          texto="A localização fica vinculada ao município do usuário logado."
          icone={Send}
        />
      </div>

      <SigCard>
        <div className="space-y-5">
          <div>
            <label className="label">Tipo de deslocamento</label>

            <div className="grid md:grid-cols-3 gap-3 mt-2">
              <TipoBotao
                ativo={tipo === "VIATURA"}
                titulo="Viatura"
                icone={Car}
                onClick={() => setTipo("VIATURA")}
              />

              <TipoBotao
                ativo={tipo === "A_PE"}
                titulo="A pé"
                icone={Footprints}
                onClick={() => setTipo("A_PE")}
              />

              <TipoBotao
                ativo={tipo === "MOTO"}
                titulo="Motocicleta"
                icone={Bike}
                onClick={() => setTipo("MOTO")}
              />
            </div>
          </div>

          <div>
            <label className="label">Observação</label>

            <textarea
              className="input h-28 resize-none"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: ronda preventiva na Praça da Matriz."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <SigButton
              type="blue"
              onClick={enviarLocalizacao}
              disabled={enviando}
            >
              <Send className="w-4 h-4" />
              {enviando ? "Enviando..." : "Atualizar localização"}
            </SigButton>

            <SigButton type="red" onClick={limparMeusPontos}>
              <Trash2 className="w-4 h-4" />
              Remover minha localização
            </SigButton>
          </div>
        </div>
      </SigCard>
    </div>
  );
}

function InfoCard({
  titulo,
  texto,
  icone: Icone,
}: {
  titulo: string;
  texto: string;
  icone: any;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
      <Icone className="w-7 h-7 text-blue-400 mb-3" />

      <h3 className="text-white font-black">{titulo}</h3>

      <p className="text-sm text-slate-400 mt-1">{texto}</p>
    </div>
  );
}

function TipoBotao({
  ativo,
  titulo,
  icone: Icone,
  onClick,
}: {
  ativo: boolean;
  titulo: string;
  icone: any;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        ativo
          ? "border-blue-500 bg-blue-950/60 text-white"
          : "border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-900"
      }`}
    >
      <Icone className="w-6 h-6 mb-2" />

      <span className="font-black">{titulo}</span>
    </button>
  );
}