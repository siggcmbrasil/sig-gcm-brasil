"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

export default function AbastecimentosPage() {
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [abastecimentos, setAbastecimentos] = useState<any[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [viaturaId, setViaturaId] = useState("");
  const [litros, setLitros] = useState("");
  const [valor, setValor] = useState("");
  const [km, setKm] = useState("");
  const [posto, setPosto] = useState("");
  const [motorista, setMotorista] = useState("");
  const [numeroCupom, setNumeroCupom] = useState("");
  const [observacao, setObservacao] = useState("");
  const [dataAbastecimento, setDataAbastecimento] = useState(
    new Date().toISOString().slice(0, 16)
  );

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    try {
      if (!usuario?.municipio_id) {
        setCarregando(false);
        return;
      }

      setCarregando(true);

      const { data: listaViaturas, error: erroViaturas } = await supabase
        .from("viaturas")
.select(`
id,
prefixo,
placa,
km_atual,
capacidade_tanque,
tipo_combustivel
`)
        .eq("municipio_id", usuario.municipio_id)
        .order("prefixo", { ascending: true });

      if (erroViaturas) throw erroViaturas;

  let query = supabase
  .from("abastecimentos")
  .select("*, viaturas(prefixo, placa)")
  .eq("municipio_id", usuario.municipio_id)
  .order("data_abastecimento", {
    ascending: false,
  })
  .range(0, 99);

      if (dataInicio) {
        query = query.gte("data_abastecimento", `${dataInicio}T00:00:00`);
      }

      if (dataFim) {
        query = query.lte("data_abastecimento", `${dataFim}T23:59:59`);
      }

      const { data: listaAbastecimentos, error: erroAbastecimentos } =
        await query;

      if (erroAbastecimentos) throw erroAbastecimentos;

      setViaturas(listaViaturas || []);
      setAbastecimentos(listaAbastecimentos || []);
    } catch (error) {
      console.error("Erro ao carregar abastecimentos:", error);
      alert("Erro ao carregar abastecimentos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    const totalLitros = abastecimentos.reduce(
      (acc, item) => acc + Number(item.litros || 0),
      0
    );

    const totalValor = abastecimentos.reduce(
      (acc, item) => acc + Number(item.valor || 0),
      0
    );

    return {
      registros: abastecimentos.length,
      totalLitros,
      totalValor,
      mediaLitro: totalLitros > 0 ? totalValor / totalLitros : 0,
    };
  }, [abastecimentos]);

  function limparFormulario() {
    setEditandoId(null);
    setViaturaId("");
    setLitros("");
    setValor("");
    setKm("");
    setPosto("");
    setMotorista("");
    setNumeroCupom("");
    setObservacao("");
    setDataAbastecimento(new Date().toISOString().slice(0, 16));
  }

  function editar(item: any) {
    setEditandoId(item.id);
    setViaturaId(String(item.viatura_id || ""));
    setLitros(String(item.litros || ""));
    setValor(String(item.valor || ""));
    setKm(String(item.km || ""));
    setPosto(item.posto || "");
    setMotorista(item.motorista || "");
    setNumeroCupom(item.numero_cupom || "");
    setObservacao(item.observacao || "");
    setDataAbastecimento(
      item.data_abastecimento
        ? new Date(item.data_abastecimento).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16)
    );
  }

  async function salvar() {
    
    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    if (!viaturaId) return alert("Selecione a viatura.");
    if (!litros || Number(litros) <= 0) return alert("Informe os litros.");
    if (!valor || Number(valor) <= 0) return alert("Informe o valor.");
    if (Number(litros) > 500) {
  return alert(
    "Quantidade de litros inválida."
  );
}
if (Number(valor) > 3000) {
  return alert(
    "Valor de abastecimento inválido."
  );
}
    if (!km || Number(km) <= 0) return alert("Informe o KM.");
    const viatura = viaturas.find(
  (v) => String(v.id) === viaturaId
);

if (
  viatura?.km_atual &&
  Number(km) < Number(viatura.km_atual)
) {
  return alert(
    `O KM informado é menor que o KM atual da viatura (${viatura.km_atual}).`
  );
}
    if (!dataAbastecimento) return alert("Informe a data do abastecimento.");

    if (
  new Date(dataAbastecimento) >
  new Date()
) {
  return alert(
    "A data do abastecimento não pode ser futura."
  );
}

if (
  viatura?.capacidade_tanque &&
  Number(litros) >
    Number(viatura.capacidade_tanque)
) {
  return alert(
    `A viatura suporta apenas ${viatura.capacidade_tanque} litros.`
  );
}

if (editandoId) {
  const dias =
    Math.floor(
      (Date.now() -
        new Date(dataAbastecimento).getTime()) /
        86400000
    );

  if (
    dias > 7 &&
    !["ADMIN", "DESENVOLVEDOR"].includes(
      usuario.perfil
    )
  ) {
    return alert(
      "Somente administradores podem alterar abastecimentos antigos."
    );
  }
}

    setSalvando(true);

    try {
      const dados = {
  municipio_id: usuario.municipio_id,
  viatura_id: Number(viaturaId),
  litros: Number(litros),
  valor: Number(valor),
  valor_litro:
    Number(litros) > 0
      ? Number(valor) / Number(litros)
      : 0,
  km: Number(km),
  posto: posto.trim(),
  motorista: motorista.trim(),
  numero_cupom: numeroCupom.trim(),
  observacao: observacao.trim(),
  data_abastecimento: dataAbastecimento,
  criado_por: usuario.id,
};

let error = null;

if (editandoId) {
  let updateQuery = supabase
    .from("abastecimentos")
    .update(dados)
    .eq("id", editandoId)
    .eq("municipio_id", usuario.municipio_id);

  if (
    !["ADMIN", "DESENVOLVEDOR"].includes(
      usuario.perfil
    )
  ) {
    updateQuery = updateQuery.eq(
      "criado_por",
      usuario.id
    );
  }

  const resultado = await updateQuery;
  error = resultado.error;
} else {
  const resultado = await supabase
    .from("abastecimentos")
    .insert([dados]);

  error = resultado.error;
}

if (error) throw error;

      if (error) throw error;

      await supabase
        .from("viaturas")
        .update({
          km_atual: Number(km),
        })
        .eq("id", Number(viaturaId))
        .eq("municipio_id", usuario.municipio_id);

      await registrarAuditoria({
  modulo: "Abastecimentos",
  acao: editandoId
    ? "EDITAR"
    : "CRIAR",
  descricao: editandoId
    ? `Editou abastecimento da viatura ${viatura?.prefixo}.`
    : `Registrou abastecimento da viatura ${viatura?.prefixo}.`,
  tabela: "abastecimentos",
  registro_id: editandoId || null,
  detalhes: {
  viatura: viatura?.prefixo,
  litros,
  valor,
  km,
  posto,
  motorista,
  numeroCupom,
},
});

      limparFormulario();
      await carregar();

      alert(
        editandoId
          ? "Abastecimento atualizado."
          : "Abastecimento registrado."
      );
    } catch (error: any) {
      console.error("Erro ao salvar abastecimento:", error);
      alert(error.message || "Erro ao salvar abastecimento.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: number) {
    if (
  !["ADMIN", "DESENVOLVEDOR"].includes(
    usuario.perfil
  )
) {
  return alert(
    "Você não possui permissão para excluir."
  );
}
    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    if (!confirm("Deseja excluir este abastecimento?")) return;

    const motivo = prompt(
  "Informe o motivo da exclusão:"
);

if (!motivo?.trim()) {
  return alert(
    "Informe o motivo da exclusão."
  );
}

    const item = abastecimentos.find((a) => a.id === id);

    let deleteQuery = supabase
  .from("abastecimentos")
  .delete()
  .eq("id", id)
  .eq(
    "municipio_id",
    usuario.municipio_id
  );

if (
  !["ADMIN", "DESENVOLVEDOR"].includes(
    usuario.perfil
  )
) {
  deleteQuery = deleteQuery.eq(
    "criado_por",
    usuario.id
  );
}

const { error } =
  await deleteQuery;

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
  modulo: "Abastecimentos",
  acao: "EXCLUIR",
  descricao: `Excluiu abastecimento da viatura ${
    item?.viaturas?.prefixo ||
    item?.viatura_id ||
    id
  }.`,
  tabela: "abastecimentos",
  registro_id: id,
  detalhes: {
    motivo,
    valor: item?.valor,
    litros: item?.litros,
    km: item?.km,
    posto: item?.posto,
    motorista: item?.motorista,
  },
});

    await carregar();
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24">
      <div className="painel-premium p-6">
        <p className="text-sm text-slate-400 font-semibold">Controle de Frota</p>

        <h1 className="text-2xl md:text-3xl font-black text-white">
          ⛽ Abastecimentos
        </h1>

        <p className="text-slate-400 mt-2">
          Registre abastecimentos, quilometragem, posto, motorista e cupom.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card titulo="Registros" valor={String(resumo.registros)} />
        <Card titulo="Total Litros" valor={`${resumo.totalLitros.toFixed(2)} L`} />
        <Card titulo="Valor Total" valor={`R$ ${resumo.totalValor.toFixed(2)}`} />
        <Card titulo="Média/Litro" valor={`R$ ${resumo.mediaLitro.toFixed(2)}`} />
      </div>

      <div className="painel-premium p-5">
        <div className="grid md:grid-cols-4 gap-3">
          <input
            type="date"
            className="input"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <input
            type="date"
            className="input"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />

          <button onClick={carregar} className="sig-btn-gold">
            Filtrar
          </button>

          <button
            onClick={() => {
              setDataInicio("");
              setDataFim("");
              setTimeout(carregar, 100);
            }}
            className="btn-secondary"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-black text-white">
                {editandoId ? "Editar Abastecimento" : "Novo Abastecimento"}
              </h2>

              <p className="text-slate-400 text-sm">
                Preencha os dados do abastecimento.
              </p>
            </div>

            {editandoId && (
              <button onClick={limparFormulario} className="text-slate-400">
                <X />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <select
              className="input"
              value={viaturaId}
              onChange={(e) => setViaturaId(e.target.value)}
            >
              <option value="">Selecione a viatura</option>
              {viaturas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.prefixo} {v.placa ? `- ${v.placa}` : ""}
                </option>
              ))}
            </select>

            <input
              className="input"
              type="datetime-local"
              value={dataAbastecimento}
              onChange={(e) => setDataAbastecimento(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                className="input"
                placeholder="Litros"
                value={litros}
                onChange={(e) => setLitros(e.target.value)}
                type="number"
              />

              <input
                className="input"
                placeholder="Valor"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                type="number"
              />
            </div>

            <input
              className="input"
              placeholder="KM atual"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              type="number"
            />

            <input
              className="input"
              placeholder="Posto"
              value={posto}
              onChange={(e) => setPosto(e.target.value)}
            />

            <input
              className="input"
              placeholder="Motorista / responsável"
              value={motorista}
              onChange={(e) => setMotorista(e.target.value)}
            />

            <input
              className="input"
              placeholder="Número do cupom"
              value={numeroCupom}
              onChange={(e) => setNumeroCupom(e.target.value)}
            />

            <textarea
              className="input min-h-[100px]"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Observações"
            />

            <button
              onClick={salvar}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando
                ? "Salvando..."
                : editandoId
                ? "Atualizar Abastecimento"
                : "Registrar Abastecimento"}
            </button>
          </div>
        </div>

        <div className="painel-premium p-6 lg:col-span-2">
          <h2 className="text-xl font-black text-white mb-1">
            Histórico de Abastecimentos
          </h2>

          <p className="text-slate-400 text-sm mb-5">
            Últimos registros lançados no sistema.
          </p>

          {carregando ? (
            <p className="text-slate-400">Carregando abastecimentos...</p>
          ) : abastecimentos.length === 0 ? (
            <p className="text-slate-400">Nenhum abastecimento registrado.</p>
          ) : (
            <div className="space-y-3">
              {abastecimentos.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <h3 className="text-white font-black">
                        🚔 {a.viaturas?.prefixo || "Viatura não informada"}
                      </h3>

                      <p className="text-slate-400 text-sm">
                        Data:{" "}
                        {a.data_abastecimento
                          ? new Date(a.data_abastecimento).toLocaleString("pt-BR")
                          : "Não informada"}
                      </p>

                      <p className="text-slate-400 text-sm">
                        Placa: {a.viaturas?.placa || "Não informada"} • KM:{" "}
                        {a.km || "Não informado"}
                      </p>

                      <p className="text-slate-400 text-sm">
                        Posto: {a.posto || "-"} • Motorista: {a.motorista || "-"}
                      </p>

                      <p className="text-slate-500 text-sm">
                        Cupom: {a.numero_cupom || "-"}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-white font-black">
                        R$ {Number(a.valor || 0).toFixed(2)}
                      </p>

                      <p className="text-slate-400 text-sm">
                        {Number(a.litros || 0).toFixed(2)} litros
                      </p>

                      <p className="text-slate-500 text-sm">
                        R${" "}
                        {Number(a.litros || 0) > 0
                          ? (Number(a.valor || 0) / Number(a.litros || 0)).toFixed(2)
                          : "0.00"}{" "}
                        / litro
                      </p>
                    </div>
                  </div>

                  {a.observacao && (
                    <p className="text-slate-400 text-sm mt-3">
                      <span className="font-bold text-slate-300">Obs:</span>{" "}
                      {a.observacao}
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => editar(a)}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-xl font-bold inline-flex items-center gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </button>

                    <button
                      onClick={() => excluir(a.id)}
                      className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-xl font-bold inline-flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
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

function Card({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="painel-premium p-5">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-2xl md:text-3xl font-black text-white">{valor}</h2>
    </div>
  );
}