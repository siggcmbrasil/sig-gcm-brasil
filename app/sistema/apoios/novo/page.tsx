"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, PhoneCall, Save, XCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function NovoApoioPage() {
  const router = useRouter();

  const [tipo, setTipo] = useState("APOIO_OPERACIONAL");
  const [orgaoSolicitante, setOrgaoSolicitante] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [local, setLocal] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [status, setStatus] = useState("ABERTO");
  const [observacoes, setObservacoes] = useState("");

  const [guarnicoes, setGuarnicoes] = useState<any[]>([]);
  const [guardas, setGuardas] = useState<any[]>([]);
  const [viaturas, setViaturas] = useState<any[]>([]);

  const [guarnicaoId, setGuarnicaoId] = useState("");
  const [guardaId, setGuardaId] = useState("");
  const [viaturaId, setViaturaId] = useState("");

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [capturandoGps, setCapturandoGps] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    const agora = new Date();

    setData(agora.toISOString().split("T")[0]);
    setHora(
      agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );

    carregarDados();
  }, []);

  async function carregarDados() {
    if (!usuario?.municipio_id) return;

    const { data: guarnicoesData } = await supabase
      .from("guarnicoes")
      .select("id, nome")
      .eq("municipio_id", usuario.municipio_id)
      .eq("ativa", true)
      .order("nome", { ascending: true });

    const { data: guardasData } = await supabase
      .from("guardas")
      .select("id, nome, matricula")
      .eq("municipio_id", usuario.municipio_id)
      .order("nome", { ascending: true });

    const { data: viaturasData } = await supabase
      .from("viaturas")
      .select("id, prefixo, modelo, placa, status")
      .eq("municipio_id", usuario.municipio_id)
      .order("prefixo", { ascending: true });

    setGuarnicoes(guarnicoesData || []);
    setGuardas(guardasData || []);
    setViaturas(viaturasData || []);
  }

  function capturarGps() {
    if (!navigator.geolocation) {
      alert("GPS não suportado neste dispositivo.");
      return;
    }

    setCapturandoGps(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        setCapturandoGps(false);
        alert("GPS capturado com sucesso.");
      },
      () => {
        setCapturandoGps(false);
        alert("Não foi possível obter a localização.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  async function salvar() {
    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    if (!local.trim()) {
      alert("Informe o local do apoio.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("apoios").insert({
      municipio_id: usuario.municipio_id,
      usuario_id: usuario?.id || null,
      tipo,
      orgao_solicitante: orgaoSolicitante.trim(),
      solicitante: solicitante.trim(),
      local: local.trim(),
      data,
      hora,
      status,
      observacoes: observacoes.trim(),
      guarnicao_id: guarnicaoId || null,
      guarda_id: guardaId || null,
      viatura_id: viaturaId || null,
      latitude: latitude || null,
      longitude: longitude || null,
    });

    setSalvando(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert("Apoio cadastrado com sucesso.");
    router.push("/sistema/apoios");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Novo Apoio"
        subtitulo="Cadastro de apoio operacional, externo, institucional ou administrativo."
        icone={PhoneCall}
      />

      <SigCard>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo de Apoio</label>
            <select
              className="input"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="APOIO_OPERACIONAL">Apoio Operacional</option>
              <option value="APOIO_EXTERNO">Apoio Externo</option>
              <option value="POLICIA_MILITAR">Polícia Militar</option>
              <option value="POLICIA_CIVIL">Polícia Civil</option>
              <option value="SAMU">SAMU</option>
              <option value="CONSELHO_TUTELAR">Conselho Tutelar</option>
              <option value="PODER_JUDICIARIO">Poder Judiciário</option>
              <option value="MINISTERIO_PUBLICO">Ministério Público</option>
              <option value="SECRETARIA_MUNICIPAL">Secretaria Municipal</option>
              <option value="EVENTO">Evento</option>
              <option value="ESCOLAR">Apoio Escolar</option>
              <option value="INSTITUCIONAL">Apoio Institucional</option>
              <option value="ADMINISTRATIVO">Apoio Administrativo</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ABERTO">Aberto</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="label">Órgão solicitante</label>
            <input
              className="input"
              value={orgaoSolicitante}
              onChange={(e) => setOrgaoSolicitante(e.target.value)}
              placeholder="Ex: PM, Polícia Civil, SAMU, Secretaria..."
            />
          </div>

          <div>
            <label className="label">Solicitante / Responsável</label>
            <input
              className="input"
              value={solicitante}
              onChange={(e) => setSolicitante(e.target.value)}
              placeholder="Nome do solicitante ou responsável"
            />
          </div>

          <div>
            <label className="label">Local</label>
            <input
              className="input"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Local do apoio"
            />
          </div>

          <div>
            <label className="label">Data</label>
            <input
              type="date"
              className="input"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Hora</label>
            <input
              type="time"
              className="input"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Guarnição</label>
            <select
              className="input"
              value={guarnicaoId}
              onChange={(e) => setGuarnicaoId(e.target.value)}
            >
              <option value="">Selecione a guarnição</option>
              {guarnicoes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Guarda responsável</label>
            <select
              className="input"
              value={guardaId}
              onChange={(e) => setGuardaId(e.target.value)}
            >
              <option value="">Selecione o guarda</option>
              {guardas.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome} {g.matricula ? `• ${g.matricula}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Viatura</label>
            <select
              className="input"
              value={viaturaId}
              onChange={(e) => setViaturaId(e.target.value)}
            >
              <option value="">Selecione a viatura</option>
              {viaturas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.prefixo} • {v.modelo || "-"} • {v.placa || "-"}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={capturarGps}
              disabled={capturandoGps}
              className="btn-secondary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <MapPin className="w-5 h-5" />
              {capturandoGps ? "Capturando GPS..." : "Capturar GPS do Apoio"}
            </button>

            {latitude && longitude && (
              <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                <p>Latitude: {latitude}</p>
                <p>Longitude: {longitude}</p>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="label">Observações</label>
            <textarea
              className="input min-h-32 resize-none"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais do apoio..."
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mt-6">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {salvando ? "Salvando..." : "Salvar Apoio"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/sistema/central-apoios")}
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Cancelar
          </button>
        </div>
      </SigCard>
    </div>
  );
}