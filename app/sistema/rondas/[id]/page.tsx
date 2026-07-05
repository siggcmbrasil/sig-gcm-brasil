"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPinned,
  QrCode,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigCard from "@/components/sig/SigCard";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

type PlanoRonda = {
  id: number;
  nome: string;
  descricao: string | null;
};

type PontoRonda = {
  id: number;
  nome_local: string;
  latitude: number | null;
  longitude: number | null;
  ordem: number | null;
  obrigatorio: boolean | null;
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
      perfil: usuario.perfil,
      municipio_id: Number(usuario.municipio_id),
    };
  } catch {
    return null;
  }
}

export default function DetalheRondaPage() {
  const params = useParams();
  const id = Number(params.id);

  const [plano, setPlano] = useState<PlanoRonda | null>(null);
  const [pontos, setPontos] = useState<PontoRonda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [nomeLocal, setNomeLocal] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [ordem, setOrdem] = useState("");

  useEffect(() => {
    if (id) {
      void carregar();
    }
  }, [id]);

  async function carregar() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      alert("Sessão inválida.");
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const [planoResp, pontosResp] = await Promise.all([
      supabase
        .from("planos_ronda")
        .select("id, nome, descricao")
        .eq("id", id)
        .eq("municipio_id", usuario.municipio_id)
        .single(),

      supabase
        .from("pontos_ronda")
        .select("id, nome_local, latitude, longitude, ordem, obrigatorio")
        .eq("plano_id", id)
        .eq("municipio_id", usuario.municipio_id)
        .order("ordem", { ascending: true }),
    ]);

    setCarregando(false);

    if (planoResp.error || pontosResp.error) {
      const erro = planoResp.error || pontosResp.error;

      console.error(erro);

      await registrarAuditoria({
        modulo: "Rondas",
        acao: "ERRO",
        descricao: "Erro ao carregar detalhes do plano de ronda.",
        tabela: "pontos_ronda",
        detalhes: {
          erro: erro?.message,
          plano_id: id,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao carregar plano de ronda.");
      return;
    }

    setPlano(planoResp.data as PlanoRonda);
    setPontos((pontosResp.data || []) as PontoRonda[]);
  }

  async function salvarPonto() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      alert("Sessão inválida.");
      return;
    }

    if (!nomeLocal.trim()) {
      alert("Informe o nome do local.");
      return;
    }

    const lat = latitude.trim() ? Number(latitude.replace(",", ".")) : null;
    const lng = longitude.trim() ? Number(longitude.replace(",", ".")) : null;
    const ordemFinal = ordem.trim() ? Number(ordem) : pontos.length + 1;

    if (lat !== null && !Number.isFinite(lat)) {
      alert("Latitude inválida.");
      return;
    }

    if (lng !== null && !Number.isFinite(lng)) {
      alert("Longitude inválida.");
      return;
    }

    if (!Number.isFinite(ordemFinal) || ordemFinal <= 0) {
      alert("Ordem inválida.");
      return;
    }

    setSalvando(true);

    const { data, error } = await supabase
      .from("pontos_ronda")
      .insert({
        municipio_id: usuario.municipio_id,
        plano_id: id,
        nome_local: nomeLocal.trim(),
        latitude: lat,
        longitude: lng,
        ordem: ordemFinal,
        obrigatorio: true,
        criado_em: new Date().toISOString(),
      })
      .select("id, nome_local")
      .single();

    setSalvando(false);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Rondas",
        acao: "ERRO",
        descricao: "Erro ao salvar ponto de ronda.",
        tabela: "pontos_ronda",
        detalhes: {
          erro: error.message,
          plano_id: id,
          nome_local: nomeLocal.trim(),
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao salvar ponto.");
      return;
    }

    await registrarAuditoria({
      modulo: "Rondas",
      acao: "CRIAR",
      descricao: `Criou ponto de ronda ${data?.nome_local}.`,
      tabela: "pontos_ronda",
      registro_id: data?.id,
      detalhes: {
        plano_id: id,
        nome_local: data?.nome_local,
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
      },
    });

    setNomeLocal("");
    setLatitude("");
    setLongitude("");
    setOrdem("");

    await carregar();
  }

  async function excluirPonto(pontoId: number) {
    if (!confirm("Excluir este ponto da ronda?")) return;

    const usuario = obterUsuarioLogado();

    if (!usuario) {
      alert("Sessão inválida.");
      return;
    }

    const { error } = await supabase
      .from("pontos_ronda")
      .delete()
      .eq("id", pontoId)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Rondas",
        acao: "ERRO",
        descricao: "Erro ao excluir ponto de ronda.",
        tabela: "pontos_ronda",
        registro_id: pontoId,
        detalhes: {
          erro: error.message,
          plano_id: id,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao excluir ponto.");
      return;
    }

    await registrarAuditoria({
      modulo: "Rondas",
      acao: "EXCLUIR",
      descricao: "Excluiu ponto de ronda.",
      tabela: "pontos_ronda",
      registro_id: pontoId,
      detalhes: {
        plano_id: id,
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
      },
    });

    await carregar();
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <Link
        href="/sistema/rondas"
        className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300"
      >
        <ArrowLeft size={18} />
        Voltar aos Planos
      </Link>

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-3xl bg-blue-500/10 border border-blue-500/30 p-4">
            <ShieldCheck className="w-10 h-10 text-blue-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-blue-400 font-black">
              Plano de Ronda
            </p>

            <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
              {plano?.nome || "Plano de Ronda"}
            </h1>

            <p className="text-slate-400 mt-2">
              {plano?.descricao || "Cadastro de pontos da ronda."}
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-3 gap-4">
        <ResumoCard titulo="Pontos" valor={pontos.length} />
        <ResumoCard
          titulo="Com GPS"
          valor={pontos.filter((p) => p.latitude && p.longitude).length}
        />
        <ResumoCard
          titulo="Obrigatórios"
          valor={pontos.filter((p) => p.obrigatorio !== false).length}
        />
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
          <MapPinned className="text-blue-400" size={22} />
          Novo Ponto da Ronda
        </h2>

        <div className="space-y-4">
          <div>
            <label className="label">Nome do local</label>
            <input
              className="input mt-2"
              placeholder="Ex: Praça da Matriz"
              value={nomeLocal}
              maxLength={120}
              onChange={(e) => setNomeLocal(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Latitude</label>
              <input
                className="input mt-2"
                placeholder="-11.620000"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Longitude</label>
              <input
                className="input mt-2"
                placeholder="-38.805000"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Ordem</label>
              <input
                className="input mt-2"
                placeholder="1"
                value={ordem}
                onChange={(e) =>
                  setOrdem(e.target.value.replace(/\D/g, ""))
                }
              />
            </div>
          </div>

          <button
            type="button"
            onClick={salvarPonto}
            disabled={salvando}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {salvando ? "Salvando..." : "Salvar Ponto"}
          </button>
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
          <MapPinned className="text-blue-400" size={22} />
          Pontos Cadastrados
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando pontos...</p>
        ) : pontos.length === 0 ? (
          <div className="py-12 text-center">
            <MapPinned className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-black text-white">
              Nenhum ponto cadastrado
            </h3>
            <p className="text-slate-400 mt-2">
              Cadastre o primeiro ponto desta ronda.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pontos.map((ponto) => (
              <div
                key={ponto.id}
                className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <h3 className="font-black text-white flex items-center gap-2">
                    <MapPinned size={18} className="text-blue-400" />
                    {ponto.ordem || "-"}º {ponto.nome_local}
                  </h3>

                  <p className="text-slate-400 text-sm mt-1">
                    {ponto.latitude ?? "Sem latitude"},{" "}
                    {ponto.longitude ?? "Sem longitude"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/sistema/rondas/qrcode?ponto=${ponto.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 font-bold text-sm text-white hover:bg-blue-600"
                  >
                    <QrCode size={16} />
                    QR Code
                  </Link>

                  <button
                    type="button"
                    onClick={() => excluirPonto(ponto.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-3 py-2 font-bold text-sm text-white hover:bg-red-600"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <SigCard>
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-4xl font-black text-white mt-2">{valor}</h2>
      <p className="text-slate-500 text-xs mt-1">Pontos de ronda</p>
    </SigCard>
  );
}