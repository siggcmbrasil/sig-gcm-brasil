"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Viatura = {
  id: number;
  prefixo: string;
  modelo: string;
  placa: string;
  status: string;
  combustivel: string | null;
  quilometragem: string | null;
  ultima_manutencao: string | null;
  observacoes: string | null;
};

export default function Viatura() {
  const [viatura, setViatura] = useState<Viatura | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [prefixo, setPrefixo] = useState("");
const [modelo, setModelo] = useState("");
  const [placa, setPlaca] = useState("");
  const [status, setStatus] = useState("Operacional");
  const [combustivel, setCombustivel] = useState("");
  const [quilometragem, setQuilometragem] = useState("");
  const [ultimaManutencao, setUltimaManutencao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";

const podeEditar = perfilUsuario !== "CONSULTA";

  async function carregarViatura() {
    setCarregando(true);

    const { data, error } = await supabase
  .from("viaturas")
  .select("*")
  .eq("municipio_id", usuarioLogado.municipio_id)
  .order("id", { ascending: true })
  .limit(1)
  .single();

    if (error && error.code !== "PGRST116") {
      console.error(error);
      alert("Erro ao carregar viatura.");
      setCarregando(false);
      return;
    }

    if (data) {
      setViatura(data);
      setPrefixo(data.prefixo || "VTR-01");
      setModelo(data.modelo || "Renault Duster");
      setPlaca(data.placa || "");
      setStatus(data.status || "Operacional");
      setCombustivel(data.combustivel || "");
      setQuilometragem(data.quilometragem || "");
      setUltimaManutencao(data.ultima_manutencao || "");
      setObservacoes(data.observacoes || "");
    }

    setCarregando(false);
  }

  async function salvarViatura() {
  if (!podeEditar) {
    alert("Você não possui permissão para alterar dados da viatura.");
    return;
  }
    if (!prefixo || !modelo || !placa) {
      alert("Preencha prefixo, modelo e placa.");
      return;
    }

    if (viatura) {
      const { error } = await supabase
        .from("viaturas")
        .update({
          prefixo,
          modelo,
          placa,
          status,
          combustivel,
          quilometragem,
          ultima_manutencao: ultimaManutencao || null,
          observacoes,
        })
        .eq("id", viatura.id)
.eq("municipio_id", usuarioLogado.municipio_id);

      if (error) {
        console.error(error);
        alert("Erro ao atualizar viatura.");
        return;
      }

      alert("Viatura atualizada com sucesso.");
      carregarViatura();
      return;
    }

    const { error } = await supabase.from("viaturas").insert([
      {
        municipio_id: usuarioLogado.municipio_id,
        prefixo,
        modelo,
        placa,
        status,
        combustivel,
        quilometragem,
        ultima_manutencao: ultimaManutencao || null,
        observacoes,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao cadastrar viatura.");
      return;
    }

    alert("Viatura cadastrada com sucesso.");
    carregarViatura();
  }

  useEffect(() => {
    carregarViatura();
  }, []);

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Viatura</h1>
        <p className="text-slate-400 text-sm md:text-base">
  Controle das viaturas operacionais do município.
</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Prefixo" valor={prefixo || "-"} />
        <Card titulo="Status" valor={status || "-"} destaque={status === "Operacional"} />
        <Card titulo="Combustível" valor={combustivel || "-"} />
        <Card titulo="Quilometragem" valor={quilometragem || "-"} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
  {viatura ? viatura.prefixo : "Nenhuma viatura cadastrada"}
</h2>

          <div className="flex justify-center mb-6">
            {viatura ? (
  <Image
    src="/viatura-gcm.png"
    alt="Viatura"
    width={420}
    height={260}
    className="rounded-xl object-contain w-full h-auto max-w-sm"
    priority
  />
) : (
  <div className="h-56 flex items-center justify-center border border-slate-700 rounded-xl bg-slate-900">
    <div className="text-center">
      <p className="text-5xl mb-2">🚓</p>
      <p className="text-slate-400">
        Nenhuma viatura cadastrada
      </p>
    </div>
  </div>
)}
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando...</p>
          ) : (
            <div className="space-y-3">
              <Linha nome="Prefixo" valor={prefixo} />
              <Linha nome="Modelo" valor={modelo} />
              <Linha nome="Placa" valor={placa || "-"} />
              <Linha nome="Status" valor={status} />
              <Linha nome="Combustível" valor={combustivel || "-"} />
              <Linha nome="Quilometragem" valor={quilometragem || "-"} />
              <Linha nome="Última manutenção" valor={ultimaManutencao || "-"} />
            </div>
          )}
        </div>

        {podeEditar && (
  <div className="card xl:col-span-2">
    <h2 className="text-xl md:text-2xl font-bold mb-4">
      Dados da Viatura
    </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo label="Prefixo" valor={prefixo} setValor={setPrefixo} />

            <Campo label="Modelo" valor={modelo} setValor={setModelo} />

            <Campo
              label="Placa"
              valor={placa}
              setValor={(valor) => setPlaca(valor.toUpperCase())}
              placeholder="ABC1D23"
            />

            <Campo
              label="Combustível"
              valor={combustivel}
              setValor={setCombustivel}
              placeholder="Ex: 78%"
            />

            <Campo
              label="Quilometragem"
              valor={quilometragem}
              setValor={setQuilometragem}
              placeholder="Ex: 25.430 km"
            />

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Operacional</option>
                <option>Em manutenção</option>
                <option>Indisponível</option>
                <option>Reserva</option>
                <option>Baixada</option>
              </select>
            </div>

            <div>
              <label className="label">Última manutenção</label>
              <input
                type="date"
                className="input"
                value={ultimaManutencao}
                onChange={(e) => setUltimaManutencao(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Observações</label>
              <textarea
                className="input h-32 resize-none"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: viatura em operação normal."
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={salvarViatura}
              className="btn-primary w-full md:w-auto text-lg"
            >
              Salvar Dados da Viatura
            </button>
          </div>
          </div>
)}
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
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Card({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">{titulo}</p>
      <h2
        className={`text-3xl md:text-4xl font-bold ${
          destaque ? "text-green-400" : ""
        }`}
      >
        {valor}
      </h2>
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