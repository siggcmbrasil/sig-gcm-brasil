"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  MapPin,
  Save,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function OcorrenciaExpressa() {
  const router = useRouter();

  const [tipo, setTipo] = useState("");
  const [local, setLocal] = useState("");
  const [descricao, setDescricao] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [capturandoGps, setCapturandoGps] = useState(false);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

      const perfisPermitidos = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "CMT_GUARNICAO",
  "PLANTONISTA",
  "GUARDA",
];

function podeCriarOcorrencia() {
  return perfisPermitidos.includes(usuario?.perfil);
}

  function obterLocalizacao() {
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

  async function salvarExpressa() {
    if (!tipo.trim() || !local.trim() || !descricao.trim()) {
      alert("Preencha tipo, local e descrição.");
      return;
    }

if (!usuario?.id || !usuario?.municipio_id) {
  alert("Usuário inválido ou sem município. Faça login novamente.");
  return;
}

if (!podeCriarOcorrencia()) {
  alert("Seu perfil não tem permissão para registrar ocorrência.");
  return;
}

    setSalvando(true);

    const agora = new Date();
    const protocolo = "OC-" + Date.now();
    const data = agora.toISOString().split("T")[0];
    const hora = agora.toTimeString().slice(0, 8);

    const fotosUrls: string[] = [];

    if (fotos.length > 0) {
      for (const foto of fotos) {
        const nomeSeguro = foto.name
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zA-Z0-9.]/g, "-");

const nomeArquivo = `${usuario.municipio_id}/${protocolo}-${Date.now()}-${nomeSeguro}`;

        const { error: uploadError } = await supabase.storage
          .from("fotos-ocorrencias")
          .upload(nomeArquivo, foto);

        if (uploadError) {
          console.error(uploadError);
          alert("Erro ao enviar uma das fotos.");
          setSalvando(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("fotos-ocorrencias")
          .getPublicUrl(nomeArquivo);

        fotosUrls.push(urlData.publicUrl);
      }
    }

    const { error } = await supabase.from("ocorrencias").insert([
      {
        protocolo,
        tipo: tipo.trim(),
        status: "Aberta",
        data,
        hora,
        bairro: "",
        local: local.trim(),
        numero: "",
        envolvidos: "",
        descricao: descricao.trim(),
        foto_url: fotosUrls[0] || "",
        fotos_urls: JSON.stringify(fotosUrls),
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        municipio_id: usuario.municipio_id,
        usuario_id: usuario?.id || null,
      },
    ]);

    setSalvando(false);

    if (error) {
      console.error(error);
      alert("Erro ao salvar ocorrência.");
      return;
    }

await registrarAuditoria({
  modulo: "OCORRENCIAS",
  acao: "CRIAR_EXPRESSA",
  descricao: `Criou ocorrência expressa ${protocolo}.`,
  registro_id: protocolo,
});

alert("Ocorrência expressa salva com sucesso!");
router.push("/sistema/ocorrencias");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Ocorrência Expressa"
        subtitulo="Registro rápido para uso em campo pelo celular."
        icone={AlertTriangle}
      />

      <SigCard>
        <div className="space-y-5">
          <div>
            <label className="label">Tipo da ocorrência</label>

            <select
              className="input"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="Perturbação do sossego">Perturbação do sossego</option>
              <option value="Apoio ao cidadão">Apoio ao cidadão</option>
              <option value="Patrulhamento preventivo">Patrulhamento preventivo</option>
              <option value="Fiscalização">Fiscalização</option>
              <option value="Acidente">Acidente</option>
              <option value="Conselho Tutelar">Conselho Tutelar</option>
              <option value="CAPS">CAPS</option>
              <option value="Apoio em evento esportivo">Apoio em evento esportivo</option>
              <option value="Apoio em evento cultural">Apoio em evento cultural</option>
              <option value="Apoio em evento religioso">Apoio em evento religioso</option>
              <option value="Ronda escolar">Ronda escolar</option>
              <option value="Apoio à escola">Apoio à escola</option>
              <option value="Apoio à saúde">Apoio à saúde</option>
              <option value="Apoio ao CRAS">Apoio ao CRAS</option>
              <option value="Apoio à fiscalização municipal">
                Apoio à fiscalização municipal
              </option>
              <option value="Averiguação de denúncia">Averiguação de denúncia</option>
              <option value="Apoio à Polícia Militar">Apoio à Polícia Militar</option>
              <option value="Apoio à Polícia Civil">Apoio à Polícia Civil</option>
              <option value="Orientação ao público">Orientação ao público</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="label">Local</label>

            <input
              className="input"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex: Praça Principal"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={obterLocalizacao}
              disabled={capturandoGps}
              className="btn-secondary w-full text-lg disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              {capturandoGps ? "Capturando GPS..." : "Capturar GPS Atual"}
            </button>

            {latitude && longitude && (
              <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                <p>Latitude: {latitude}</p>
                <p>Longitude: {longitude}</p>
              </div>
            )}
          </div>

          <div>
            <label className="label">Descrição rápida</label>

            <textarea
              className="input h-40 resize-none"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva rapidamente o fato..."
            />
          </div>

          <div>
            <label className="label">Fotos</label>

            <input
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              className="input"
              onChange={(e) => setFotos(Array.from(e.target.files || []))}
            />

            <p className="text-sm text-slate-500 mt-2">
              No celular, este campo pode abrir a câmera ou galeria.
            </p>

            {fotos.length > 0 && (
              <p className="text-sm text-emerald-400 mt-2 inline-flex items-center gap-2">
                <Camera className="w-4 h-4" />
                {fotos.length} foto(s) selecionada(s).
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={salvarExpressa}
            disabled={salvando}
            className="btn-primary w-full text-xl disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {salvando ? "Salvando..." : "Salvar Ocorrência Expressa"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/sistema/ocorrencias")}
            className="btn-secondary w-full text-xl inline-flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Cancelar
          </button>
        </div>
      </SigCard>
    </div>
  );
}