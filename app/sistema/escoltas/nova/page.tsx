"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CarFront, Save } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function NovaEscoltaPage() {
  const router = useRouter();

  const [tipo, setTipo] = useState("ESCOLTA");
  const [localOrigem, setLocalOrigem] = useState("");
  const [localDestino, setLocalDestino] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [guarnicoes, setGuarnicoes] = useState<any[]>([]);
  const [guardas, setGuardas] = useState<any[]>([]);
  const [viaturas, setViaturas] = useState<any[]>([]);

  const [guarnicaoId, setGuarnicaoId] = useState("");
  const [guardaId, setGuardaId] = useState("");
  const [viaturaId, setViaturaId] = useState("");

  const [salvando, setSalvando] = useState(false);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
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

  async function salvar() {
    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    if (!localOrigem.trim() || !localDestino.trim()) {
      alert("Informe origem e destino.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("escoltas").insert({
      municipio_id: usuario.municipio_id,
      usuario_id: usuario?.id || null,
      tipo,
      local_origem: localOrigem.trim(),
      local_destino: localDestino.trim(),
      solicitante: solicitante.trim(),
      observacoes: observacoes.trim(),
      guarnicao_id: guarnicaoId || null,
      guarda_id: guardaId || null,
      viatura_id: viaturaId || null,
      data: new Date().toISOString().split("T")[0],
      status: "ABERTA",
    });

    setSalvando(false);

    if (error) {
  console.error(error);
  alert(error.message);
  return;
}

await registrarAuditoria({
  modulo: "Escoltas",
  acao: "CRIAR",
  descricao: `Cadastrou escolta de ${localOrigem.trim()} para ${localDestino.trim()}.`,
  tabela: "escoltas",
  detalhes: {
    tipo,
    origem: localOrigem.trim(),
    destino: localDestino.trim(),
    solicitante: solicitante.trim(),
    guarnicao_id: guarnicaoId || null,
    guarda_id: guardaId || null,
    viatura_id: viaturaId || null,
  },
});

alert("Escolta cadastrada com sucesso.");
    router.push("/sistema/escoltas");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Nova Escolta"
        subtitulo="Cadastro de escolta, deslocamento oficial ou apoio com viatura."
        icone={CarFront}
      />

      <SigCard>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="ESCOLTA">Escolta</option>
              <option value="DESLOCAMENTO_OFICIAL">Deslocamento Oficial</option>
              <option value="APOIO_COM_VIATURA">Apoio com Viatura</option>
            </select>
          </div>

          <div>
            <label className="label">Solicitante</label>
            <input
              className="input"
              value={solicitante}
              onChange={(e) => setSolicitante(e.target.value)}
              placeholder="Órgão, secretaria ou responsável"
            />
          </div>

          <div>
            <label className="label">Origem</label>
            <input
              className="input"
              value={localOrigem}
              onChange={(e) => setLocalOrigem(e.target.value)}
              placeholder="Local de saída"
            />
          </div>

          <div>
            <label className="label">Destino</label>
            <input
              className="input"
              value={localDestino}
              onChange={(e) => setLocalDestino(e.target.value)}
              placeholder="Local de destino"
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
            <label className="label">Observações</label>
            <textarea
              className="input min-h-32 resize-none"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais da escolta..."
            />
          </div>
        </div>

        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="btn-primary mt-6 inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {salvando ? "Salvando..." : "Salvar Escolta"}
        </button>
      </SigCard>
    </div>
  );
}