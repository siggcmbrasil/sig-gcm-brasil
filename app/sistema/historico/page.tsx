"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type Historico = {
  id: number;
  numero_antigo: string | null;
  ano: string | null;
  data_ocorrencia: string | null;
  tipo: string | null;
  local: string | null;
  envolvidos: string | null;
  resumo: string | null;
  observacoes: string | null;
  arquivo_url: string | null;
  digitalizado_por: string | null;
};

export default function Historico() {
  const [registros, setRegistros] = useState<Historico[]>([]);
  const [busca, setBusca] = useState("");

  const [numeroAntigo, setNumeroAntigo] = useState("");
  const [ano, setAno] = useState(
  String(new Date().getFullYear())
);
  const [dataOcorrencia, setDataOcorrencia] = useState("");
  const [tipo, setTipo] = useState("");
  const [local, setLocal] = useState("");
  const [envolvidos, setEnvolvidos] = useState("");
  const [resumo, setResumo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [digitalizadoPor, setDigitalizadoPor] =
  useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [inputKey, setInputKey] =
  useState(Date.now());

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const usuario =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

const municipioId = usuario?.municipio_id;

useEffect(() => {
  if (usuario?.nome) {
    setDigitalizadoPor(usuario.nome);
  }
}, []);

  async function carregarHistorico() {
    setCarregando(true);

    if (!municipioId) {
  setCarregando(false);
  return;
}

    const { data, error } = await supabase
.from("ocorrencias_historicas")
.select("*")
.eq("municipio_id", municipioId)
.order("id", { ascending: false });

    if (error) {
  console.error(error);
  alert("Erro ao carregar arquivo histórico.");
  setCarregando(false);
  return;
}

setRegistros(data || []);
setCarregando(false);
  }

  async function salvarHistorico() {
    if (!municipioId) {
  alert("Município não identificado.");
  return;
}
    if (
  !numeroAntigo.trim() &&
  !dataOcorrencia &&
  !resumo.trim()
) {
      alert("Preencha pelo menos número antigo, data ou resumo.");
      return;
    }

    setSalvando(true);

    let arquivoUrl = "";

    if (arquivo) {
      const nomeArquivo =
  `${municipioId}/historico-${Date.now()}-${arquivo.name}`;

      const { error: uploadError } = await supabase.storage
        .from("historico-ocorrencias")
        .upload(nomeArquivo, arquivo);

      if (uploadError) {
        console.error(uploadError);
        alert("Erro ao enviar arquivo digitalizado.");
        setSalvando(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("historico-ocorrencias")
        .getPublicUrl(nomeArquivo);

      arquivoUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("ocorrencias_historicas").insert([
      {
  municipio_id: municipioId,
  numero_antigo: numeroAntigo.trim() || null,
       ano: ano.trim() || null,
        data_ocorrencia: dataOcorrencia || null,
       tipo: tipo.trim() || null,
        local: local.trim() || null,
envolvidos:
  envolvidos.trim() || null,
resumo:
  resumo.trim() || null,
observacoes:
  observacoes.trim() || null,
        arquivo_url:
  arquivoUrl || null,
digitalizado_por:
  digitalizadoPor.trim() || null,
      },
    ]);

    setSalvando(false);

if (error) {
  setSalvando(false);

  console.error(error);

  if (arquivoUrl) {
    const caminho =
      arquivoUrl.split(
        "/historico-ocorrencias/"
      )[1];

    if (caminho) {
      await supabase.storage
        .from("historico-ocorrencias")
        .remove([caminho]);
    }
  }

  alert("Erro ao salvar ocorrência histórica.");
  return;
}

const registroCriado =
  numeroAntigo.trim() || "Sem número";

    await registrarAuditoria({
  modulo: "Arquivo Histórico",
  acao: "CRIAR",
  tabela: "ocorrencias_historicas",
  descricao: `Arquivou ocorrência histórica ${registroCriado}.`,
  detalhes: {
    numero_antigo: numeroAntigo || null,
    ano: ano || null,
    tipo: tipo || null,
  },
});

    alert("Ocorrência histórica arquivada com sucesso!");
    setBusca("");

    setNumeroAntigo("");
    setAno(
  String(new Date().getFullYear())
);
    setDataOcorrencia("");
    setTipo("");
    setLocal("");
    setEnvolvidos("");
    setResumo("");
    setObservacoes("");
    setDigitalizadoPor(
  usuario?.nome || ""
);
    setArquivo(null);
    setInputKey(Date.now());

    carregarHistorico();
  }

  async function excluirHistorico(id: number) {
    const confirmar = confirm(
  `Excluir a ocorrência ${
    registros.find((r) => r.id === id)
      ?.numero_antigo || ""
  }?`
);

    if (!confirmar) return;

    const { error } = await supabase
.from("ocorrencias_historicas")
.delete()
.eq("id", id)
.eq("municipio_id", municipioId);

    if (error) {
      console.error(error);
      alert("Erro ao excluir registro.");
      return;
    }

    const registro = registros.find(
  (r) => r.id === id
);

if (registro?.arquivo_url) {
  const caminho =
    registro.arquivo_url.split(
      "/historico-ocorrencias/"
    )[1];

  if (caminho) {
    await supabase.storage
      .from("historico-ocorrencias")
      .remove([caminho]);
  }
}

    await registrarAuditoria({
  modulo: "Arquivo Histórico",
  acao: "EXCLUIR",
  tabela: "ocorrencias_historicas",
  descricao: `Excluiu ocorrência histórica ${
  registros.find((r) => r.id === id)
    ?.numero_antigo || `ID ${id}`
}.`,
  detalhes: {
    registro_id: id,
  },
});

    carregarHistorico();
  }

useEffect(() => {
  if (municipioId) {
    carregarHistorico();
  }
}, [municipioId]);

  const filtrados = registros.filter((item) => {
    const texto = `
      ${item.numero_antigo || ""}
      ${item.ano || ""}
      ${item.data_ocorrencia || ""}
      ${item.tipo || ""}
      ${item.local || ""}
      ${item.envolvidos || ""}
      ${item.resumo || ""}
      ${item.observacoes || ""}
      ${item.digitalizado_por || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Arquivo Histórico
        </h1>

        <p className="text-slate-400 text-sm md:text-base">
          Digitalização e cadastro de ocorrências antigas arquivadas em papel.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Total" valor={registros.length} />
        <Card titulo="Com arquivo" valor={registros.filter((r) => r.arquivo_url).length} />
        <Card titulo="Este ano" valor={registros.filter((r) => r.ano === new Date().getFullYear().toString()).length} />
        <Card titulo="Filtrados" valor={filtrados.length} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Novo Arquivo
          </h2>

          <div className="space-y-4">
            <Campo
              label="Número antigo"
              valor={numeroAntigo}
              setValor={setNumeroAntigo}
              placeholder="Ex: 023/2019"
            />

            <Campo
              label="Ano"
              valor={ano}
              setValor={setAno}
              placeholder="Ex: 2019"
            />

            <div>
              <label className="label">Data da ocorrência</label>
              <input
                type="date"
                className="input"
                value={dataOcorrencia}
                onChange={(e) => setDataOcorrencia(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="">Selecione</option>
                <option>Perturbação do sossego</option>
                <option>Apoio ao cidadão</option>
                <option>Patrulhamento preventivo</option>
                <option>Fiscalização</option>
                <option>Acidente</option>
                <option>Conselho Tutelar</option>
                <option>CAPS</option>
                <option>Ronda escolar</option>
                <option>Apoio à saúde</option>
                <option>Apoio à Polícia Militar</option>
                <option>Apoio à Polícia Civil</option>
                <option>Outro</option>
              </select>
            </div>

            <Campo
              label="Local"
              valor={local}
              setValor={setLocal}
              placeholder="Local informado no papel"
            />

            <div>
              <label className="label">Envolvidos</label>
              <textarea
                className="input h-24 resize-none"
                value={envolvidos}
                onChange={(e) => setEnvolvidos(e.target.value)}
                placeholder="Nomes, documentos ou informações dos envolvidos"
              />
            </div>

            <div>
              <label className="label">Resumo</label>
              <textarea
                className="input h-32 resize-none"
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
                placeholder="Resumo da ocorrência antiga"
              />
            </div>

            <div>
              <label className="label">Observações</label>
              <textarea
                className="input h-24 resize-none"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: documento danificado, ilegível em partes..."
              />
            </div>

            <Campo
              label="Digitalizado por"
              valor={digitalizadoPor}
              setValor={setDigitalizadoPor}
              placeholder="Nome do servidor"
            />

            <div>
              <label className="label">Arquivo digitalizado</label>
<input
  key={inputKey}
  type="file"
                accept="image/*,.pdf"
                className="input"
                onChange={(e) => setArquivo(e.target.files?.[0] || null)}
              />

              {arquivo && (
                <p className="text-green-400 text-sm mt-2">
                  Arquivo selecionado: {arquivo.name}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={salvarHistorico}
              disabled={salvando}
              className="btn-primary w-full text-lg disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Arquivar Ocorrência"}
            </button>
          </div>
        </div>

        <div className="card xl:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Ocorrências Arquivadas
          </h2>

          <div className="mb-5">
            <label className="label">Buscar no arquivo</label>
            <input
              className="input"
              placeholder="Buscar por número, ano, local, envolvidos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando arquivo histórico...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-slate-400">Nenhum registro histórico encontrado.</p>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {filtrados.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                  >
                    <div>
                      <p className="text-blue-400 font-semibold">
                        {item.numero_antigo || "Sem número"}
                      </p>

                      <h3 className="text-xl font-bold">
                        {item.tipo || "Ocorrência histórica"}
                      </h3>
                    </div>

                    <Linha nome="Ano" valor={item.ano || "-"} />
                    <Linha nome="Data" valor={item.data_ocorrencia || "-"} />
                    <Linha nome="Local" valor={item.local || "-"} />
                    <Linha nome="Digitalizado por" valor={item.digitalizado_por || "-"} />

                    {item.resumo && (
                      <p className="text-slate-300">
                        {item.resumo}
                      </p>
                    )}

                    {item.arquivo_url && (
                      <a
                        href={item.arquivo_url}
                        target="_blank"
                        className="block bg-blue-700 hover:bg-blue-800 text-center px-4 py-3 rounded-xl font-semibold"
                      >
                        Abrir arquivo
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => excluirHistorico(item.id)}
                      className="w-full bg-red-700 hover:bg-red-800 text-white px-4 py-3 rounded-xl font-semibold"
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="text-left py-3">Número</th>
                      <th className="text-left py-3">Ano</th>
                      <th className="text-left py-3">Data</th>
                      <th className="text-left py-3">Tipo</th>
                      <th className="text-left py-3">Local</th>
                      <th className="text-right py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtrados.map((item) => (
                      <tr key={item.id} className="border-b border-slate-800">
                        <td className="py-4 text-blue-400 font-semibold">
                          {item.numero_antigo || "-"}
                        </td>
                        <td>{item.ano || "-"}</td>
                        <td className="text-slate-400">{item.data_ocorrencia || "-"}</td>
                        <td>{item.tipo || "-"}</td>
                        <td className="text-slate-400">{item.local || "-"}</td>
                        <td className="text-right space-x-2">
                          {item.arquivo_url && (
                            <a
                              href={item.arquivo_url}
                              target="_blank"
                              className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-xs inline-block"
                            >
                              Abrir
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => excluirHistorico(item.id)}
                            className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-xs"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Campo({
  label,
  valor,
  setValor,
  placeholder,
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        className="input"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">{titulo}</p>
      <h2 className="text-5xl md:text-4xl font-bold">{valor}</h2>
    </div>
  );
}

function Linha({ nome, valor }: { nome: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-800 pb-2">
      <span className="text-slate-400">{nome}</span>
      <span className="text-right">{valor}</span>
    </div>
  );
}