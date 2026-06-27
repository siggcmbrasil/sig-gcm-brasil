"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BotaoAcao from "@/components/BotaoAcao";
import { Pencil, Trash2 } from "lucide-react";
import { CORES_VEICULO } from "@/lib/bases/cores";
import { VEICULOS_POR_TIPO } from "@/lib/bases/veiculosPorTipo";
import {
  formatarPlaca,
  formatarRenavam,
  formatarChassi,
  formatarCPF,
  formatarTelefone,
} from "@/lib/formatadores";

type Veiculo = {
  id: number;
  placa: string;
  marca: string | null;
  modelo: string | null;
  ano: string | null;
  cor: string | null;
  renavam: string | null;
  chassi: string | null;
  proprietario: string | null;
  cpf_proprietario: string | null;
  telefone_proprietario: string | null;
  tipo_especie: string | null;
  situacao: string | null;
  condutor: string | null;
  documento: string | null;
  local: string;
  data: string;
  hora: string;
  observacao: string | null;
};

export default function VeiculosAbordados() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [busca, setBusca] = useState("");

  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [cor, setCor] = useState("");
  const [condutor, setCondutor] = useState("");
  const [documento, setDocumento] = useState("");
  const [local, setLocal] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [observacao, setObservacao] = useState("");

  const [marca, setMarca] = useState("");
const [ano, setAno] = useState("");
const [renavam, setRenavam] = useState("");
const [chassi, setChassi] = useState("");
const [proprietario, setProprietario] = useState("");
const [cpfProprietario, setCpfProprietario] = useState("");
const [telefoneProprietario, setTelefoneProprietario] = useState("");
const [tipoEspecie, setTipoEspecie] = useState("");
const [situacao, setSituacao] = useState("");

const [veiculosCadastrados, setVeiculosCadastrados] =
  useState<any[]>([]);

const [veiculoId, setVeiculoId] =
  useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [carregando, setCarregando] = useState(true);
  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";

const podeEditar = perfilUsuario !== "CONSULTA";

  async function carregarVeiculos() {
    setCarregando(true);

    const { data, error } = await supabase
  .from("veiculos_abordados")
  .select("*")
  .eq("municipio_id", usuarioLogado.municipio_id)
  .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar veículos.");
      setCarregando(false);
      return;
    }

    setVeiculos(data || []);
    setCarregando(false);
  }

  async function salvarVeiculo() {
  if (!podeEditar) {
    alert("Você não possui permissão para registrar veículos.");
    return;
  }
    if (!placa || !local || !data || !hora) {
      alert("Preencha placa, local, data e hora.");
      return;
    }

    if (editandoId) {
  const { error } = await supabase
    .from("veiculos_abordados")
    .update({
      placa,
marca,
modelo,
ano,
cor,
renavam,
chassi,
proprietario,
cpf_proprietario: cpfProprietario,
telefone_proprietario: telefoneProprietario,
tipo_especie: tipoEspecie,
situacao,
condutor,
documento,
local,
data,
hora,
observacao,
    })
    .eq("id", editandoId)
    .eq("municipio_id", usuarioLogado.municipio_id);

  if (error) {
    console.error(error);
    alert("Erro ao atualizar veículo.");
    return;
  }

  alert("Veículo atualizado com sucesso!");

  setEditandoId(null);
  setPlaca("");
  setModelo("");
  setCor("");
  setCondutor("");
  setDocumento("");
  setLocal("");
  setData("");
  setHora("");
  setObservacao("");
  setMarca("");
setAno("");
setRenavam("");
setChassi("");
setProprietario("");
setCpfProprietario("");
setTelefoneProprietario("");
setTipoEspecie("");
setSituacao("");

  carregarVeiculos();
  return;
}

    const { error } = await supabase.from("veiculos_abordados").insert([
      {
        municipio_id: usuarioLogado.municipio_id,
        placa,
marca,
modelo,
ano,
cor,
renavam,
chassi,
proprietario,
cpf_proprietario: cpfProprietario,
telefone_proprietario: telefoneProprietario,
tipo_especie: tipoEspecie,
situacao,
condutor,
documento,
local,
data,
hora,
observacao,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar abordagem.");
      return;
    }

    alert("Veículo registrado com sucesso!");

    setPlaca("");
    setModelo("");
    setCor("");
    setCondutor("");
    setDocumento("");
    setLocal("");
    setData("");
    setHora("");
    setObservacao("");
    setMarca("");
setAno("");
setRenavam("");
setChassi("");
setProprietario("");
setCpfProprietario("");
setTelefoneProprietario("");
setTipoEspecie("");
setSituacao("");

    carregarVeiculos();
  }

function editarVeiculo(veiculo: Veiculo) {
  if (!podeEditar) {
    alert("Você não possui permissão para editar veículos.");
    return;
  }

  setEditandoId(veiculo.id);

  setPlaca(veiculo.placa || "");
  setModelo(veiculo.modelo || "");
  setCor(veiculo.cor || "");
  setCondutor(veiculo.condutor || "");
  setLocal(veiculo.local || "");
  setData(veiculo.data || "");
  setHora(veiculo.hora || "");
  setObservacao(veiculo.observacao || "");
  setMarca(veiculo.marca || "");
setAno(veiculo.ano || "");
setRenavam(veiculo.renavam || "");
setChassi(veiculo.chassi || "");
setProprietario(veiculo.proprietario || "");
setCpfProprietario(
  veiculo.cpf_proprietario || ""
);
setTelefoneProprietario(
  veiculo.telefone_proprietario || ""
);
setTipoEspecie(
  veiculo.tipo_especie || ""
);
setSituacao(
  veiculo.situacao || ""
);
}

  async function excluirVeiculo(id: number) {
    if (!podeEditar) {
      alert("Você não possui permissão para excluir veículos.");
      return;
    }

    const confirmar = confirm("Deseja excluir este registro?");

    if (!confirmar) return;

    const { error } = await supabase
  .from("veiculos_abordados")
  .delete()
  .eq("id", id)
  .eq("municipio_id", usuarioLogado.municipio_id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir.");
      return;
    }

    carregarVeiculos();
  }

  useEffect(() => {
    carregarVeiculos();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];

  const veiculosFiltrados = veiculos.filter((veiculo) => {
    const texto = `
      ${veiculo.placa}
      ${veiculo.modelo || ""}
      ${veiculo.marca || ""}
      ${veiculo.cor || ""}
      ${veiculo.renavam || ""}
      ${veiculo.proprietario || ""}
      ${veiculo.cpf_proprietario || ""}
      ${veiculo.situacao || ""}
      ${veiculo.condutor || ""}
      ${veiculo.documento || ""}
      ${veiculo.local}
      ${veiculo.data}
      ${veiculo.hora}
      ${veiculo.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Veículos Abordados
        </h1>

        <p className="text-slate-400 text-sm md:text-base">
          Registro de veículos fiscalizados pela Guarda Municipal.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Total" valor={veiculos.length} />

        <Card
          titulo="Hoje"
          valor={veiculos.filter((v) => v.data === hoje).length}
        />

        <Card
          titulo="Com condutor"
          valor={veiculos.filter((v) => v.condutor).length}
        />

        <Card
          titulo="Sem condutor"
          valor={veiculos.filter((v) => !v.condutor).length}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {podeEditar && (
  <div className="card">
    <h2 className="text-xl md:text-2xl font-bold mb-4">
      Nova Abordagem
    </h2>

          <div className="space-y-4">
            <Campo
              label="Placa"
              valor={placa}
              setValor={(valor) =>
              setPlaca(formatarPlaca(valor))}
              placeholder="ABC1D23"
            />

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
    onChange={(e) => {
      setMarca(e.target.value);
      setModelo("");
    }}
    disabled={!tipoEspecie}
  >
    <option value="">Selecione</option>
    {Object.keys(VEICULOS_POR_TIPO[tipoEspecie] || {}).map((marca) => (
      <option key={marca} value={marca}>
        {marca}
      </option>
    ))}
  </select>
</div>

<div>
  <label className="label">Modelo</label>
  <select
    className="input"
    value={modelo}
    onChange={(e) => setModelo(e.target.value)}
    disabled={!tipoEspecie || !marca}
  >
    <option value="">Selecione</option>
    {(VEICULOS_POR_TIPO[tipoEspecie]?.[marca] || []).map((modelo) => (
      <option key={modelo} value={modelo}>
        {modelo}
      </option>
    ))}
    <option value="OUTRO">Outro</option>
  </select>
</div>

{modelo === "OUTRO" && (
  <Campo
    label="Modelo manual"
    valor={modelo}
    setValor={setModelo}
    placeholder="Digite o modelo"
  />
)}

<div>
  <label className="label">Cor</label>
  <select
    className="input"
    value={cor}
    onChange={(e) => setCor(e.target.value)}
  >
    <option value="">Selecione</option>
    {CORES_VEICULO.map((cor) => (
      <option key={cor} value={cor}>
        {cor}
      </option>
    ))}
  </select>
</div>

<Campo
  label="Ano"
  valor={ano}
  setValor={setAno}
  placeholder="Ex: 2022"
/>

<Campo
  label="RENAVAM"
  valor={renavam}
  setValor={(v) =>
    setRenavam(formatarRenavam(v))
  }
  placeholder="Somente números"
/>

<Campo
  label="Chassi"
  valor={chassi}
  setValor={(v) =>
   setChassi(formatarChassi(v))
  }
  placeholder="Número do chassi"
/>

<Campo
  label="Proprietário"
  valor={proprietario}
  setValor={(v) => setCpfProprietario(formatarCPF(v))}
  placeholder="Nome do proprietário"
/>

<Campo
  label="CPF do Proprietário"
  valor={cpfProprietario}
  setValor={(v) => setCpfProprietario(formatarCPF(v))}
  placeholder="CPF"
/>

<Campo
  label="Telefone do Proprietário"
  valor={telefoneProprietario}
  setValor={(v) => setTelefoneProprietario(formatarTelefone(v))}
  placeholder="Telefone"
/>

<div>
  <label className="label">
    Situação
  </label>

  <select
    className="input"
    value={situacao}
    onChange={(e) =>
      setSituacao(e.target.value)
    }
  >
    <option value="">Selecione</option>
    <option>Regular</option>
    <option>Furto/Roubo</option>
    <option>Apreendido</option>
    <option>Recuperado</option>
    <option>Licenciamento vencido</option>
    <option>Outro</option>
  </select>
</div>

            <Campo
              label="Condutor"
              valor={condutor}
              setValor={setCondutor}
              placeholder="Nome do condutor"
            />

            <Campo
              label="Documento do condutor"
              valor={documento}
              setValor={setDocumento}
              placeholder="CPF, RG ou CNH"
            />

            <Campo
              label="Local da abordagem"
              valor={local}
              setValor={setLocal}
              placeholder="Ex: Praça Principal"
            />

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
              <label className="label">Observação</label>
              <textarea
                className="input h-32 resize-none"
                placeholder="Observações da abordagem"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={salvarVeiculo}
              className="btn-primary w-full text-lg"
            >
              {editandoId ? "Atualizar Veículo" : "Registrar Veículo"}
            </button>
          </div>
          </div>
)}

        <div className="card xl:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Veículos Registrados
          </h2>

          <div className="mb-5">
            <label className="label">Buscar veículo</label>
            <input
              className="input"
              placeholder="Buscar por placa, modelo, condutor, local..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando veículos...</p>
          ) : veiculosFiltrados.length === 0 ? (
            <p className="text-slate-400">Nenhum veículo encontrado.</p>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {veiculosFiltrados.map((veiculo) => (
                  <div
                    key={veiculo.id}
                    className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                  >
                    <div>
                      <p className="text-blue-400 font-semibold">
                        {veiculo.placa}
                      </p>

                      <h3 className="text-xl font-bold">
                        {veiculo.modelo || "Modelo não informado"}
                      </h3>
                    </div>

                    <div className="text-slate-300 space-y-1">
                      <p>
                        <span className="text-slate-500">Cor: </span>
                        {veiculo.cor || "-"}
                      </p>

                      <p>
                        <span className="text-slate-500">Condutor: </span>
                        {veiculo.condutor || "-"}
                      </p>

                      <p>
                        <span className="text-slate-500">Documento: </span>
                        {veiculo.documento || "-"}
                      </p>

                      <p>
                        <span className="text-slate-500">Local: </span>
                        {veiculo.local}
                      </p>

                      <p>
                        <span className="text-slate-500">Data/Hora: </span>
                        {veiculo.data} às {veiculo.hora}
                      </p>

                      {veiculo.observacao && (
                        <p className="pt-2 text-slate-400">
                          {veiculo.observacao}
                        </p>
                      )}
                    </div>

                    {podeEditar && (
  <button
    type="button"
    onClick={() => excluirVeiculo(veiculo.id)}
    className="w-full bg-red-700 hover:bg-red-800 text-white px-4 py-3 rounded-xl font-semibold"
  >
    Excluir
  </button>
)}
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-700 text-slate-400">
                    <tr>
                      <th className="text-left py-3">Placa</th>
                      <th className="text-left py-3">Modelo</th>
                      <th className="text-left py-3">Cor</th>
                      <th className="text-left py-3">Proprietário</th>
                      <th className="text-left py-3">Situação</th>
                      <th className="text-left py-3">Local</th>
                      <th className="text-left py-3">Data</th>
                      <th className="text-right py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {veiculosFiltrados.map((veiculo) => (
                      <tr key={veiculo.id} className="border-b border-slate-800">
                        <td className="py-4 text-blue-400 font-semibold">
                          {veiculo.placa}
                        </td>

                        <td>{veiculo.modelo || "-"}</td>

                        <td className="text-slate-400">
                          {veiculo.cor || "-"}
                        </td>

                        <td>{veiculo.proprietario || "-"}</td>
                        <td>{veiculo.situacao || "-"}</td>

                        <td className="text-slate-400">
                          {veiculo.local}
                        </td>

                        <td>{veiculo.data}</td>

                        <td className="text-center">
  <div className="flex items-center justify-center gap-2">

    {podeEditar && (
      <BotaoAcao
        title="Editar"
        cor="blue"
        onClick={() => editarVeiculo(veiculo)}
      >
        <Pencil size={18} />
      </BotaoAcao>
    )}

    {podeEditar && (
      <BotaoAcao
        title="Excluir"
        cor="red"
        onClick={() => excluirVeiculo(veiculo.id)}
      >
        <Trash2 size={18} />
      </BotaoAcao>
    )}

  </div>
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

function Card({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">
        {titulo}
      </p>

      <h2 className="text-5xl md:text-4xl font-bold">
        {valor}
      </h2>
    </div>
  );
}