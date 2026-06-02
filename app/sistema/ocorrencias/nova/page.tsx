"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Envolvido = {
  nome: string;
  documento: string;
  telefone: string;
  endereco: string;
  tipo: string;
  observacao: string;
};

export default function NovaOcorrencia() {
  const router = useRouter();

  const [tipo, setTipo] = useState("");
  const [status, setStatus] = useState("Aberta");
  const [bairro, setBairro] = useState("");
  const [local, setLocal] = useState("");
  const [numero, setNumero] = useState("");
  const [descricao, setDescricao] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [viaturaEmpenhada, setViaturaEmpenhada] = useState("");
  const [equipeEmpenhada, setEquipeEmpenhada] = useState("");

  const [envolvidos, setEnvolvidos] = useState<Envolvido[]>([
    {
      nome: "",
      documento: "",
      telefone: "",
      endereco: "",
      tipo: "Vítima",
      observacao: "",
    },
  ]);

  function atualizarEnvolvido(
    index: number,
    campo: keyof Envolvido,
    valor: string
  ) {
    const novaLista = [...envolvidos];
    novaLista[index][campo] = valor;
    setEnvolvidos(novaLista);
  }

  function adicionarEnvolvido() {
    setEnvolvidos([
      ...envolvidos,
      {
        nome: "",
        documento: "",
        telefone: "",
        endereco: "",
        tipo: "Vítima",
        observacao: "",
      },
    ]);
  }

  function removerEnvolvido(index: number) {
    if (envolvidos.length === 1) {
      alert("É necessário manter pelo menos um campo de envolvido.");
      return;
    }

    setEnvolvidos(envolvidos.filter((_, i) => i !== index));
  }

  async function salvarOcorrencia() {
    if (!tipo || !local || !descricao) {
      alert("Preencha tipo, local e descrição.");
      return;
    }

    setSalvando(true);

    const agora = new Date();
    const protocolo = "OC-" + Date.now();
    const data = agora.toISOString().split("T")[0];
    const hora = agora.toTimeString().slice(0, 8);

    let fotoUrl = "";

    if (foto) {
      const nomeArquivo = `${protocolo}-${foto.name}`;

      const { error: uploadError } = await supabase.storage
        .from("fotos-ocorrencias")
        .upload(nomeArquivo, foto);

      if (uploadError) {
        console.error(uploadError);
        alert("Erro ao enviar foto.");
        setSalvando(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("fotos-ocorrencias")
        .getPublicUrl(nomeArquivo);

      fotoUrl = urlData.publicUrl;
    }

    const envolvidosValidos = envolvidos.filter(
      (pessoa) =>
        pessoa.nome ||
        pessoa.documento ||
        pessoa.telefone ||
        pessoa.endereco ||
        pessoa.observacao
    );

    const { error } = await supabase.from("ocorrencias").insert([
      {
        protocolo,
        tipo,
        status,
        data,
        hora,
        bairro,
        local,
        numero,
        envolvidos: JSON.stringify(envolvidosValidos),
        descricao,
        foto_url: fotoUrl,
        viatura_empenhada: viaturaEmpenhada,
        equipe_empenhada: equipeEmpenhada,
      },
    ]);

    setSalvando(false);

    if (error) {
      console.error(error);
      alert("Erro ao salvar ocorrência.");
      return;
    }

    alert("Ocorrência salva com sucesso!");
    router.push("/sistema/ocorrencias");
  }

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">Nova Ocorrência</h1>
        <p className="text-slate-400">
          Preencha os dados da ocorrência registrada pela GCM.
        </p>
      </header>

      <form className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo de ocorrência</label>
            <select
              className="input"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="Perturbação do sossego">Perturbação do sossego</option>
              <option value="Apoio ao cidadão">Apoio ao cidadão</option>
              <option value="Patrulhamento preventivo">Patrulhamento preventivo</option>
              <option value="Apoio a outro órgão">Apoio a outro órgão</option>
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
              <option value="Apoio à fiscalização municipal">Apoio à fiscalização municipal</option>
              <option value="Averiguação de denúncia">Averiguação de denúncia</option>
              <option value="Apoio à Polícia Militar">Apoio à Polícia Militar</option>
              <option value="Apoio à Polícia Civil">Apoio à Polícia Civil</option>
              <option value="Orientação ao público">Orientação ao público</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Aberta">Aberta</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Finalizada">Finalizada</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-6">
          <div>
            <label className="label">Viatura empenhada</label>
            <input
              className="input"
              value={viaturaEmpenhada}
              onChange={(e) => setViaturaEmpenhada(e.target.value)}
              placeholder="Ex: VTR-01"
            />
          </div>

          <div>
            <label className="label">Equipe empenhada</label>
            <textarea
              className="input h-28 resize-none"
              value={equipeEmpenhada}
              onChange={(e) => setEquipeEmpenhada(e.target.value)}
              placeholder={"Ex:\nGCM João\nGCM Maria\nGCM Pedro"}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Campo label="Bairro" valor={bairro} setValor={setBairro} placeholder="Ex: Centro" />
          <Campo label="Rua / Local" valor={local} setValor={setLocal} placeholder="Ex: Rua da Paz" />
          <Campo label="Número" valor={numero} setValor={setNumero} placeholder="S/N" />
        </div>

        <div className="border-t border-slate-800 pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-2xl font-bold">Envolvidos</h2>
              <p className="text-slate-400 text-sm">
                Cadastre uma ou mais pessoas relacionadas à ocorrência.
              </p>
            </div>

            <button
              type="button"
              onClick={adicionarEnvolvido}
              className="bg-green-700 hover:bg-green-800 px-5 py-3 rounded-xl font-semibold"
            >
              + Adicionar Envolvido
            </button>
          </div>

          <div className="space-y-5">
            {envolvidos.map((pessoa, index) => (
              <div
                key={index}
                className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">Envolvido {index + 1}</h3>

                  <button
                    type="button"
                    onClick={() => removerEnvolvido(index)}
                    className="bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg text-sm"
                  >
                    Remover
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Campo
                    label="Nome completo"
                    valor={pessoa.nome}
                    setValor={(valor) => atualizarEnvolvido(index, "nome", valor)}
                    placeholder="Nome do envolvido"
                  />

                  <Campo
                    label="Documento"
                    valor={pessoa.documento}
                    setValor={(valor) =>
                      atualizarEnvolvido(index, "documento", valor)
                    }
                    placeholder="RG, CPF ou outro"
                  />

                  <Campo
                    label="Telefone"
                    valor={pessoa.telefone}
                    setValor={(valor) =>
                      atualizarEnvolvido(index, "telefone", valor)
                    }
                    placeholder="(75) 99999-9999"
                  />

                  <div>
                    <label className="label">Tipo de envolvimento</label>
                    <select
                      className="input"
                      value={pessoa.tipo}
                      onChange={(e) =>
                        atualizarEnvolvido(index, "tipo", e.target.value)
                      }
                    >
                      <option value="Vítima">Vítima</option>
                      <option value="Autor">Autor</option>
                      <option value="Testemunha">Testemunha</option>
                      <option value="Solicitante">Solicitante</option>
                      <option value="Condutor">Condutor</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <Campo
                      label="Endereço"
                      valor={pessoa.endereco}
                      setValor={(valor) =>
                        atualizarEnvolvido(index, "endereco", valor)
                      }
                      placeholder="Endereço do envolvido"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Observação</label>
                    <textarea
                      className="input h-24 resize-none"
                      value={pessoa.observacao}
                      onChange={(e) =>
                        atualizarEnvolvido(index, "observacao", e.target.value)
                      }
                      placeholder="Informações adicionais sobre este envolvido"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Descrição da ocorrência</label>
          <textarea
            className="input h-36 resize-none"
            placeholder="Descreva o que aconteceu..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Foto da ocorrência</label>
          <input
            type="file"
            accept="image/*"
            className="input"
            onChange={(e) => setFoto(e.target.files?.[0] || null)}
          />
          <p className="text-xs text-slate-500 mt-2">
            Pode anexar uma foto tirada no celular ou no computador.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-end gap-3 border-t border-slate-800 pt-6">
          <button
            type="button"
            onClick={() => router.push("/sistema/ocorrencias")}
            className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={salvarOcorrencia}
            disabled={salvando}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar Ocorrência"}
          </button>
        </div>
      </form>
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