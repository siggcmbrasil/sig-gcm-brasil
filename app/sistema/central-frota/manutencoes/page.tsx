"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria }
from "@/lib/auditoria";

export default function ManutencoesPage() {
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [manutencoes, setManutencoes] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [viaturaId, setViaturaId] = useState("");
  const [tipo, setTipo] = useState("PREVENTIVA");
  const [status, setStatus] = useState("ABERTA");
  const [valor, setValor] = useState("");
  const [oficina, setOficina] = useState("");
  const [descricao, setDescricao] = useState("");
  const [quilometragem, setQuilometragem] = useState("");
  const hoje = useMemo(() => {
  const tzoffset =
    new Date().getTimezoneOffset() * 60000;

  return new Date(
    Date.now() - tzoffset
  )
    .toISOString()
    .split("T")[0];
}, []);
const [dataManutencao, setDataManutencao] = useState(hoje);
const [proximaRevisao, setProximaRevisao] =
  useState("");

const [responsavelManutencao, setResponsavelManutencao] =
  useState("");

const [veiculoParado, setVeiculoParado] =
  useState(false);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

async function carregar() {
  if (!usuario?.municipio_id)
    return;

  setCarregando(true);

  try {
    const {
      data: listaViaturas,
      error: erroViaturas,
    } = await supabase
      .from("viaturas")
      .select("*")
      .eq(
        "municipio_id",
        usuario.municipio_id
      )
      .order("prefixo", {
        ascending: true,
      });

    if (erroViaturas)
      throw erroViaturas;

    const {
      data: listaManutencoes,
      error: erroManutencoes,
    } = await supabase
      .from("manutencoes_viaturas")
      .select(
        "*, viaturas(prefixo, placa, modelo)"
      )
      .eq(
        "municipio_id",
        usuario.municipio_id
      )
      .order("id", {
        ascending: false,
      });

    if (erroManutencoes)
      throw erroManutencoes;

    setViaturas(
      listaViaturas || []
    );

    setManutencoes(
      listaManutencoes || []
    );
  } catch (error: any) {
    console.error(error);

    alert(
      "Erro ao carregar dados."
    );
  } finally {
    setCarregando(false);
  }
}

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    const abertas = manutencoes.filter((m) => m.status === "ABERTA").length;
    const andamento = manutencoes.filter((m) => m.status === "EM_ANDAMENTO").length;
    const finalizadas = manutencoes.filter((m) => m.status === "FINALIZADA").length;
    const paradas =
  manutencoes.filter(
    (m) => m.veiculo_parado
  ).length;
    const totalValor = manutencoes.reduce(
      (acc, item) => acc + Number(item.valor || 0),
      0
    );

    return {
      total: manutencoes.length,
      abertas,
      andamento,
      finalizadas,
      paradas,
      totalValor,
    };
  }, [manutencoes]);

  function limparFormulario() {
    setViaturaId("");
    setTipo("PREVENTIVA");
    setStatus("ABERTA");
    setValor("");
    setOficina("");
    setDescricao("");
    setQuilometragem("");
setDataManutencao(hoje);
setProximaRevisao("");
setResponsavelManutencao("");
setVeiculoParado(false);
  }

  async function salvar() {
    if (
  !usuario?.id ||
  !usuario?.municipio_id
) {
  alert(
    "Usuário ou município não identificado."
  );
  return;
}
    if (!viaturaId) {
      alert("Selecione a viatura.");
      return;
    }

    if (!descricao.trim()) {
      alert("Informe a descrição da manutenção.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("manutencoes_viaturas").insert([
      {
        municipio_id: usuario.municipio_id,
        viatura_id: Number(viaturaId),
        tipo,
        status,
        valor: Number(valor || 0),
        oficina: oficina.trim() || null,
        quilometragem: Number(
  quilometragem || 0
),
        descricao: descricao.trim(),
        data_manutencao: dataManutencao,
        proxima_revisao:
  proximaRevisao || null,

responsavel_manutencao:
  responsavelManutencao.trim() ||
  null,

veiculo_parado:
  veiculoParado,
        criado_por: usuario.id,
      },
    ]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
  acao:
    "CADASTRO_MANUTENCAO",
  modulo:
    "MANUTENCOES_VIATURAS",
  descricao: `Manutenção registrada na viatura ${viaturaId}`,
});

    limparFormulario();
    carregar();
    alert("Manutenção registrada com sucesso.");
  }

  function formatarStatus(status: string) {
    if (status === "ABERTA") return "Aberta";
    if (status === "EM_ANDAMENTO") return "Em andamento";
    if (status === "FINALIZADA") return "Finalizada";
    return status;
  }

  function formatarTipo(tipo: string) {
    if (tipo === "PREVENTIVA") return "Preventiva";
    if (tipo === "CORRETIVA") return "Corretiva";
    if (tipo === "EMERGENCIAL") return "Emergencial";
    return tipo;
  }
  
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-slate-400 font-semibold">
          Controle de Frota
        </p>

        <h1 className="text-2xl md:text-3xl font-black text-white">
          🛠️ Manutenções de Viaturas
        </h1>

        <p className="text-slate-400 mt-2">
          Registre manutenções preventivas, corretivas e emergenciais das viaturas.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card titulo="Total" valor={String(resumo.total)} />
        <Card titulo="Abertas" valor={String(resumo.abertas)} />
        <Card titulo="Em andamento" valor={String(resumo.andamento)} />
        <Card titulo="Finalizadas" valor={String(resumo.finalizadas)} />
        <Card titulo="Viaturas Paradas" valor={String( resumo.paradas )} />
        <Card titulo="Valor Total" valor={
  resumo.totalValor.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  )
} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">
            Nova Manutenção
          </h2>

          <p className="text-slate-400 text-sm mb-5">
            Informe a viatura, o tipo de serviço e a situação atual.
          </p>

          <div className="space-y-4">
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
                    {v.prefixo} - {v.placa} {v.modelo ? `• ${v.modelo}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Tipo de manutenção</label>
              <select
                className="input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="PREVENTIVA">Preventiva</option>
                <option value="CORRETIVA">Corretiva</option>
                <option value="EMERGENCIAL">Emergencial</option>
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ABERTA">Aberta</option>
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="FINALIZADA">Finalizada</option>
              </select>
            </div>

            <Campo
  label="Quilometragem"
  valor={quilometragem}
  setValor={setQuilometragem}
  placeholder="Ex: 52380"
  type="number"
/>

            <Campo
              label="Valor"
              valor={valor}
              setValor={setValor}
              placeholder="Ex: 350.00"
              type="number"
            />

            <div>
  <label className="label">Data da manutenção</label>

  <input
    type="date"
    className="input"
    value={dataManutencao}
    onChange={(e) =>
      setDataManutencao(e.target.value)
    }
  />
</div>

<div>
  <label className="label">
    Próxima revisão
  </label>

  <input
    type="date"
    className="input"
    value={proximaRevisao}
    onChange={(e) =>
      setProximaRevisao(e.target.value)
    }
  />
</div>

<Campo
  label="Responsável"
  valor={responsavelManutencao}
  setValor={setResponsavelManutencao}
  placeholder="Ex: Mecânico João"
/>

<label className="flex items-center gap-3">
  <input
    type="checkbox"
    checked={veiculoParado}
    onChange={(e) =>
      setVeiculoParado(
        e.target.checked
      )
    }
  />

  <span className="text-slate-300">
    Viatura parada
  </span>
</label>

            <Campo
              label="Oficina"
              valor={oficina}
              setValor={setOficina}
              placeholder="Nome da oficina"
            />

            <div>
              <label className="label">Descrição do serviço</label>
              <textarea
                className="input min-h-[120px]"
                placeholder="Ex: troca de óleo, revisão de freios, pneus, suspensão..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            <button
              onClick={salvar}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Registrando..." : "Registrar Manutenção"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white">
              Histórico de Manutenções
            </h2>

            <p className="text-slate-400 text-sm">
              Acompanhe os serviços registrados para cada viatura.
            </p>
          </div>

          {carregando ? (
            <div className="painel-premium p-6 text-slate-400">
              Carregando manutenções...
            </div>
          ) : manutencoes.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">🛠️</p>
              <h2 className="text-white font-black text-xl">
                Nenhuma manutenção registrada
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                Os registros aparecerão aqui após o primeiro lançamento.
              </p>
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {manutencoes.map((item) => {
  const revisaoVencida =
    item.proxima_revisao &&
    new Date(item.proxima_revisao) <
      new Date();

  return (
                <div
  key={item.id}
  className={`rounded-3xl p-5 shadow-xl ${
    revisaoVencida
      ? "border border-red-500/40 bg-red-950/20"
      : "border border-slate-800 bg-slate-950/70"
  }`}
>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-slate-400 text-sm">
                        {item.viaturas?.prefixo || "Viatura não informada"}
                      </p>

                      <h3 className="text-xl font-black text-white">
                        🚔 {item.viaturas?.modelo || "Modelo não informado"}
                      </h3>

                      <p className="text-slate-500 text-sm">
                        Placa: {item.viaturas?.placa || "Não informada"}
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-yellow-300 border border-slate-800">
                      {formatarStatus(item.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Info titulo="Tipo" valor={formatarTipo(item.tipo)} />
                    <Info
                      titulo="Valor"
                      valor={`R$ ${Number(item.valor || 0).toFixed(2)}`}
                    />
                    <Info
                      titulo="Oficina"
                      valor={item.oficina || "Não informada"}
                    />
                    <Info
                      titulo="Data"
                      valor={
                        item.data_manutencao
                          ? new Date(
  item.data_manutencao +
    "T00:00:00"
).toLocaleDateString("pt-BR")
                          : "Não informada"
                      }
/>
                    <Info
                      titulo="Situação"
                      valor={formatarStatus(item.status)}
                    />
                    <Info
                      titulo="Quilometragem"
                      valor={
                        item.quilometragem
                          ? `${item.quilometragem} km`
                          : "Não informada"
                      }
                    />

                    <Info
                      titulo="Próxima revisão"
                      valor={
                        item.proxima_revisao
                          ? new Date(
  item.proxima_revisao +
    "T00:00:00"
).toLocaleDateString(
                              "pt-BR"
                            )
                          : "Não definida"
                      }
                    />

                    <Info
                      titulo="Responsável"
                      valor={
                        item.responsavel_manutencao ||
                        "Não informado"
                      }
                    />

                    <Info
                      titulo="Viatura parada"
                      valor={
                        item.veiculo_parado
                          ? "🚫 Sim"
                          : "✅ Não"
                      }
                      />
                  </div>

                  {revisaoVencida && (
  <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-950/30 p-3 text-red-300 text-sm font-bold">
    ⚠️ Próxima revisão vencida.
  </div>
)}

                  <div className="mt-4 rounded-2xl bg-slate-900/70 p-4">
                    <p className="text-slate-500 text-xs mb-1">
                      Descrição
                    </p>

                    <p className="text-slate-300 text-sm">
                      {item.descricao || "Sem descrição informada."}
                    </p>
                  </div>
                </div>
);
})}
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
  type = "text",
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="painel-premium p-5">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-2xl md:text-3xl font-black text-white">
        {valor}
      </h2>
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