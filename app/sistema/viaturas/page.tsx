"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

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
  foto_url?: string | null;
};

export default function ViaturasPage() {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [editando, setEditando] = useState<Viatura | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [prefixo, setPrefixo] = useState("");
  const [modelo, setModelo] = useState("");
  const [placa, setPlaca] = useState("");
  const [status, setStatus] = useState("Operacional");
  const [combustivel, setCombustivel] = useState("");
  const [quilometragem, setQuilometragem] = useState("");
  const [ultimaManutencao, setUltimaManutencao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const municipioId = usuario?.municipio_id;
  const perfilUsuario = usuario?.perfil || "CONSULTA";

  const podeEditar = perfilUsuario !== "CONSULTA";
  const podeExcluir = ["ADMIN", "COMANDANTE", "DESENVOLVEDOR"].includes(perfilUsuario);

  async function carregarViaturas() {
    if (!municipioId) return;

    setCarregando(true);

    const { data, error } = await supabase
      .from("viaturas")
      .select("*")
      .eq("municipio_id", municipioId)
      .order("prefixo", { ascending: true });

    if (error) {
      console.error(error);
      alert("Erro ao carregar viaturas.");
    }

    setViaturas(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarViaturas();
  }, []);

  const resumo = useMemo(() => {
    return {
      total: viaturas.length,
      operacionais: viaturas.filter((v) => v.status === "Operacional").length,
      manutencao: viaturas.filter((v) => v.status === "Em manutenção").length,
      reserva: viaturas.filter((v) => v.status === "Reserva").length,
    };
  }, [viaturas]);

  function limparFormulario() {
    setEditando(null);
    setPrefixo("");
    setModelo("");
    setPlaca("");
    setStatus("Operacional");
    setCombustivel("");
    setQuilometragem("");
    setUltimaManutencao("");
    setObservacoes("");
    setFotoUrl("");
  }

  function editarViatura(v: Viatura) {
    setEditando(v);
    setPrefixo(v.prefixo || "");
    setModelo(v.modelo || "");
    setPlaca(v.placa || "");
    setStatus(v.status || "Operacional");
    setCombustivel(v.combustivel || "");
    setQuilometragem(v.quilometragem || "");
    setUltimaManutencao(v.ultima_manutencao || "");
    setObservacoes(v.observacoes || "");
    setFotoUrl(v.foto_url || "");
  }

  async function salvarViatura() {
    if (!podeEditar) return alert("Sem permissão.");
    if (!municipioId) return alert("Município não identificado.");
    if (!prefixo || !modelo || !placa) {
      return alert("Preencha prefixo, modelo e placa.");
    }

    setSalvando(true);

    const dados = {
      municipio_id: municipioId,
      prefixo: prefixo.trim().toUpperCase(),
      modelo: modelo.trim(),
      placa: placa.trim().toUpperCase(),
      status,
      combustivel: combustivel.trim() || null,
      quilometragem: quilometragem.trim() || null,
      ultima_manutencao: ultimaManutencao || null,
      observacoes: observacoes.trim() || null,
      foto_url: fotoUrl.trim() || null,
    };

    const { error } = editando
      ? await supabase
          .from("viaturas")
          .update(dados)
          .eq("id", editando.id)
          .eq("municipio_id", municipioId)
      : await supabase.from("viaturas").insert([dados]);

    setSalvando(false);

    if (error) {
  console.error(error);
  return alert("Erro ao salvar viatura.");
}

await registrarAuditoria({
  modulo: "Viaturas",
  acao: editando ? "EDITAR" : "CRIAR",
  descricao: editando
    ? `Atualizou a viatura ${prefixo}.`
    : `Cadastrou a viatura ${prefixo}.`,
});

alert(editando ? "Viatura atualizada." : "Viatura cadastrada.");

    limparFormulario();
    carregarViaturas();
  }

  async function excluirViatura(id: number) {
    if (!podeExcluir) return alert("Sem permissão para excluir.");

    if (!confirm("Deseja excluir esta viatura?")) return;

    const viaturaExcluida = viaturas.find(
  (v) => v.id === id
);

    const { error } = await supabase
      .from("viaturas")
      .delete()
      .eq("id", id)
      .eq("municipio_id", municipioId);

    if (error) {
  console.error(error);
  return alert("Erro ao excluir.");
}

await registrarAuditoria({
  modulo: "Viaturas",
  acao: "EXCLUIR",
  descricao: `Excluiu a viatura ${
    viaturaExcluida?.prefixo || `ID ${id}`
  }.`,
});

carregarViaturas();
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-slate-400 font-semibold">Controle de Frota</p>
        <h1 className="text-2xl md:text-3xl font-black text-white">
          🚔 Viaturas
        </h1>
        <p className="text-slate-400 mt-2">
          Cadastro, acompanhamento e gestão das viaturas operacionais.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="Total" valor={resumo.total} />
        <Card titulo="Operacionais" valor={resumo.operacionais} />
        <Card titulo="Manutenção" valor={resumo.manutencao} />
        <Card titulo="Reserva" valor={resumo.reserva} />
      </div>

      <div className="grid xl:grid-cols-4 gap-6">
        {podeEditar && (
          <div className="painel-premium p-6 xl:col-span-1">
            <h2 className="text-xl font-black text-white">
              {editando ? "Editar Viatura" : "Nova Viatura"}
            </h2>

            <p className="text-slate-400 text-sm mb-5">
              Preencha os dados da viatura.
            </p>

            <div className="space-y-4">
              <Campo label="Prefixo" valor={prefixo} setValor={setPrefixo} placeholder="VTR-01" />
              <Campo label="Modelo" valor={modelo} setValor={setModelo} placeholder="Renault Duster" />
              <Campo label="Placa" valor={placa} setValor={(v) => setPlaca(v.toUpperCase())} placeholder="ABC1D23" />
              <Campo label="Foto da viatura" valor={fotoUrl} setValor={setFotoUrl} placeholder="/viatura-gcm.png ou URL" />
              <Campo label="Combustível" valor={combustivel} setValor={setCombustivel} placeholder="Diesel / Gasolina / 80%" />
              <Campo label="Quilometragem" valor={quilometragem} setValor={setQuilometragem} placeholder="25430" />

              <div>
                <label className="label">Status</label>
                <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
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

              <div>
                <label className="label">Observações</label>
                <textarea
                  className="input min-h-[100px]"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações gerais da viatura..."
                />
              </div>

              <button
                onClick={salvarViatura}
                disabled={salvando}
                className="sig-btn-gold w-full disabled:opacity-50"
              >
                {salvando ? "Salvando..." : editando ? "Atualizar Viatura" : "Cadastrar Viatura"}
              </button>

              {editando && (
                <button onClick={limparFormulario} className="btn-secondary w-full">
                  Cancelar edição
                </button>
              )}
            </div>
          </div>
        )}

        <div className={`${podeEditar ? "xl:col-span-3" : "xl:col-span-4"}`}>
          {carregando ? (
            <div className="painel-premium p-6 text-slate-400">
              Carregando viaturas...
            </div>
          ) : viaturas.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">🚔</p>
              <h2 className="text-white font-black text-xl">
                Nenhuma viatura cadastrada
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                Cadastre a primeira viatura para iniciar o controle de frota.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 2xl:grid-cols-3 gap-5">
              {viaturas.map((v) => (
                <div
                  key={v.id}
                  className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 shadow-xl"
                >
                  <div className="relative h-44 bg-slate-900">
                    <Image
                      src={
  v.foto_url &&
  (v.foto_url.startsWith("/") || v.foto_url.startsWith("http"))
    ? v.foto_url
    : "/viatura-gcm.png"
}
                      alt={v.prefixo}
                      fill
                      className="object-cover"
                    />

                    <div className="absolute top-3 left-3 rounded-full bg-black/70 px-3 py-1 text-white text-sm font-black">
                      {v.prefixo}
                    </div>

                    <div className="absolute top-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-slate-100">
                      {v.status}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-xl font-black text-white">
                      {v.modelo}
                    </h3>

                    <p className="text-slate-400 text-sm">
                      Placa: {v.placa}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <Info titulo="Combustível" valor={v.combustivel || "-"} />
                      <Info titulo="KM" valor={v.quilometragem || "-"} />
                    </div>

                    <div className="mt-3">
                      <Info
                        titulo="Última manutenção"
                        valor={v.ultima_manutencao || "Não informada"}
                      />
                    </div>

                    {v.observacoes && (
                      <p className="text-slate-400 text-sm mt-4 line-clamp-2">
                        {v.observacoes}
                      </p>
                    )}

                    <div className="flex gap-3 mt-5">
                      {podeEditar && (
                        <button
                          onClick={() => editarViatura(v)}
                          className="sig-btn-gold flex-1"
                        >
                          Editar
                        </button>
                      )}

                      {podeExcluir && (
                        <button
                          onClick={() => excluirViatura(v.id)}
                          className="rounded-xl px-4 py-2 bg-red-950/60 border border-red-900 text-red-300 font-bold"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="painel-premium p-5">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-3xl font-black text-white">{valor}</h2>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-3">
      <p className="text-slate-500 text-xs">{titulo}</p>
      <p className="text-slate-200 font-bold text-sm">{valor}</p>
    </div>
  );
}