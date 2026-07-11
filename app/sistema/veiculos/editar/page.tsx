"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CarFront, Save, XCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import { CORES_VEICULO } from "@/lib/bases/cores";
import { VEICULOS_POR_TIPO } from "@/lib/bases/veiculosPorTipo";

function mascaraPlaca(valor: string) {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

function somenteNumeros(valor: string, limite = 20) {
  return valor.replace(/\D/g, "").slice(0, limite);
}

function mascaraCPF(valor: string) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export default function EditarVeiculoPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id;

  const [tipoEspecie, setTipoEspecie] = useState("");
  const [placa, setPlaca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [cor, setCor] = useState("");
  const [ano, setAno] = useState("");
  const [renavam, setRenavam] = useState("");
  const [chassi, setChassi] = useState("");
  const [proprietario, setProprietario] = useState("");
  const [cpfProprietario, setCpfProprietario] = useState("");
  const [condutor, setCondutor] = useState("");
  const [documentoCondutor, setDocumentoCondutor] = useState("");
  const [situacao, setSituacao] = useState("ABORDADO");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarVeiculo();
  }, []);

  async function carregarVeiculo() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    const { data, error } = await supabase
      .from("veiculos_abordados")
      .select("*")
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id)
      .single();

    if (error) {
      console.error(error);
      alert("Erro ao carregar veículo.");
      return;
    }

    setTipoEspecie(data.tipo_especie || "");
    setPlaca(data.placa || "");
    setMarca(data.marca || "");
    setModelo(data.modelo || "");
    setCor(data.cor || "");
    setAno(data.ano || "");
    setRenavam(data.renavam || "");
    setChassi(data.chassi || "");
    setProprietario(data.proprietario || "");
    setCpfProprietario(data.cpf_proprietario || "");
    setCondutor(data.condutor || "");
    setDocumentoCondutor(data.documento_condutor || data.documento || "");
    setSituacao(data.situacao || "ABORDADO");
    setObservacoes(data.observacao || "");
  }

  async function salvar() {
    if (!placa.trim()) {
      alert("Informe a placa do veículo.");
      return;
    }

    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase
      .from("veiculos_abordados")
      .update({
        placa: placa.trim().toUpperCase(),
        tipo_especie: tipoEspecie,
        marca: marca.trim(),
        modelo: modelo.trim(),
        cor: cor.trim(),
        ano: ano.trim(),
        renavam: renavam.trim(),
        chassi: chassi.trim().toUpperCase(),
        proprietario: proprietario.trim(),
        cpf_proprietario: cpfProprietario.trim(),
        condutor: condutor.trim(),
        documento_condutor: documentoCondutor.trim(),
        situacao,
        observacao: observacoes.trim(),
      })
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    setSalvando(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Veículos",
      acao: "EDITAR",
      descricao: `Atualizou o veículo ${placa.toUpperCase()} ${marca || ""} ${
        modelo || ""
      }.`,
    });

    alert("Veículo atualizado com sucesso.");
    router.push("/sistema/veiculos");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Editar Veículo"
        subtitulo="Atualização de veículo abordado ou vinculado a ocorrência."
        icone={CarFront}
      />

      <SigCard>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Placa</label>
            <input
              className="input uppercase"
              value={placa}
              onChange={(e) => setPlaca(mascaraPlaca(e.target.value))}
              placeholder="ABC1D23"
            />
          </div>

          <div>
            <label className="label">Situação</label>
            <select
              className="input"
              value={situacao}
              onChange={(e) => setSituacao(e.target.value)}
            >
              <option value="ABORDADO">Abordado</option>
              <option value="ACIDENTE">Acidente</option>
              <option value="APREENDIDO">Apreendido</option>
              <option value="RECUPERADO">Recuperado</option>
              <option value="ABANDONADO">Abandonado</option>
              <option value="FURTO_ROUBO">Furto/Roubo</option>
            </select>
          </div>

          <div>
            <label className="label">Tipo / Espécie</label>
            <select
              className="input"
              value={tipoEspecie}
              onChange={(e) => {
                setTipoEspecie(e.target.value);
                setMarca("");
                setModelo("");
              }}
            >
              <option value="">Selecione</option>
              {Object.keys(VEICULOS_POR_TIPO).map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Marca</label>
            <select
              className="input"
              value={marca}
              disabled={!tipoEspecie}
              onChange={(e) => {
                setMarca(e.target.value);
                setModelo("");
              }}
            >
              <option value="">Selecione</option>
              {Object.keys(VEICULOS_POR_TIPO[tipoEspecie] || {}).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Modelo</label>
            <select
              className="input"
              value={modelo}
              disabled={!tipoEspecie || !marca}
              onChange={(e) => setModelo(e.target.value)}
            >
              <option value="">Selecione</option>
              {(VEICULOS_POR_TIPO[tipoEspecie]?.[marca] || []).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              <option value="OUTRO">Outro</option>
            </select>
          </div>

          {modelo === "OUTRO" && (
            <div>
              <label className="label">Modelo manual</label>
              <input
                className="input"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Digite o modelo"
              />
            </div>
          )}

          <div>
            <label className="label">Cor</label>
            <select
              className="input"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
            >
              <option value="">Selecione</option>
              {CORES_VEICULO.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Ano</label>
            <input
              className="input"
              value={ano}
              onChange={(e) => setAno(somenteNumeros(e.target.value, 4))}
              placeholder="2020"
            />
          </div>

          <div>
            <label className="label">RENAVAM</label>
            <input
              className="input"
              value={renavam}
              onChange={(e) => setRenavam(somenteNumeros(e.target.value, 11))}
              placeholder="Somente números"
            />
          </div>

          <div>
            <label className="label">Chassi</label>
            <input
              className="input uppercase"
              value={chassi}
              onChange={(e) =>
                setChassi(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 17)
                )
              }
              placeholder="Número do chassi"
            />
          </div>

          <div>
            <label className="label">Proprietário</label>
            <input
              className="input"
              value={proprietario}
              onChange={(e) => setProprietario(e.target.value)}
              placeholder="Nome do proprietário"
            />
          </div>

          <div>
            <label className="label">CPF do proprietário</label>
            <input
              className="input"
              value={cpfProprietario}
              onChange={(e) => setCpfProprietario(mascaraCPF(e.target.value))}
              placeholder="000.000.000-00"
            />
          </div>

          <div>
            <label className="label">Condutor</label>
            <input
              className="input"
              value={condutor}
              onChange={(e) => setCondutor(e.target.value)}
              placeholder="Nome do condutor"
            />
          </div>

          <div>
            <label className="label">Documento do condutor</label>
            <input
              className="input"
              value={documentoCondutor}
              onChange={(e) => setDocumentoCondutor(e.target.value)}
              placeholder="CPF, RG ou CNH"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Observações</label>
            <textarea
              className="input min-h-32 resize-none"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre o veículo..."
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
            {salvando ? "Salvando..." : "Salvar Alterações"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/sistema/veiculos")}
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