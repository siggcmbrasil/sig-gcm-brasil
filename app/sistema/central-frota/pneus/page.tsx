"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

export default function PneusPage() {
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [pneus, setPneus] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const [viaturaId, setViaturaId] = useState("");
  const [codigo, setCodigo] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [medida, setMedida] = useState("");
  const [posicao, setPosicao] = useState("DIANTEIRO_ESQUERDO");
  const [kmInstalacao, setKmInstalacao] = useState("");
  const [status, setStatus] = useState("EM_USO");
  const [observacao, setObservacao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    if (!usuario?.municipio_id) return;

    setCarregando(true);

    await registrarAuditoria({
  modulo: "Pneus",
  acao: "ACESSO",
  descricao:
    "Acessou o controle de pneus.",
  tabela: "pneus_viaturas",
});

    const { data: listaViaturas } = await supabase
      .from("viaturas")
      .select("id, prefixo, placa, modelo")
      .eq("municipio_id", usuario.municipio_id)
      .order("prefixo");

    const { data: listaPneus } = await supabase
      .from("pneus_viaturas")
      .select(`
id,
codigo,
marca,
modelo,
medida,
posicao,
km_instalacao,
status,
observacao,
criado_em,
viaturas(
prefixo,
placa,
modelo
)
`)
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setViaturas(listaViaturas || []);
    setPneus(listaPneus || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    return {
      total: pneus.length,
      emUso: pneus.filter((p) => p.status === "EM_USO").length,
      estoque: pneus.filter((p) => p.status === "ESTOQUE").length,
      substituidos: pneus.filter((p) => p.status === "SUBSTITUIDO").length,
    };
  }, [pneus]);

  function limparCadastro() {
    setViaturaId("");
    setCodigo("");
    setMarca("");
    setModelo("");
    setMedida("");
    setPosicao("DIANTEIRO_ESQUERDO");
    setKmInstalacao("");
    setStatus("EM_USO");
    setObservacao("");
  }

  async function salvarPneu() {
    if (!usuario?.municipio_id) {
  alert("Município não identificado.");
  return;
}

if (
  ![
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "PLANTONISTA",
  ].includes(usuario.perfil)
) {
  alert("Você não possui permissão.");
  return;
}
    if (!codigo.trim()) {
      alert("Informe o código ou identificação do pneu.");
      return;
    }

    setSalvando(true);

    const { data: pneuExistente } =
  await supabase
    .from("pneus_viaturas")
    .select("id")
    .eq(
      "municipio_id",
      usuario.municipio_id
    )
    .eq(
      "codigo",
      codigo.trim().toUpperCase()
    )
    .maybeSingle();

if (pneuExistente) {
  setSalvando(false);
  alert("Já existe um pneu com esse código.");
  return;
}

    const { error } = await supabase.from("pneus_viaturas").insert([
      {
        municipio_id: usuario.municipio_id,
        viatura_id: viaturaId ? Number(viaturaId) : null,
        codigo: codigo.trim().toUpperCase(),
        marca: marca.trim() || null,
        modelo: modelo.trim() || null,
        medida: medida.trim() || null,
        posicao,
        km_instalacao: kmInstalacao || null,
        status,
        observacao: observacao.trim() || null,
        criado_por: usuario.id,
      },
    ]);

    setSalvando(false);

    if (error) {
      await registrarAuditoria({
  modulo: "Pneus",
  acao: "ERRO",
  descricao:
    "Erro ao cadastrar pneu.",
  tabela: "pneus_viaturas",
  detalhes: {
    erro: error.message,
    codigo,
  },
});
      alert(error.message);
      return;
    }

    await registrarAuditoria({
  modulo: "Pneus",
  acao: "CRIAR",
  descricao:
    `Cadastrou o pneu ${codigo}.`,
  tabela: "pneus_viaturas",
  detalhes: {
    codigo,
    viatura_id: viaturaId || null,
    municipio_id:
      usuario.municipio_id,
  },
});

    limparCadastro();
    carregar();
    alert("Pneu cadastrado com sucesso.");
  }

  function nomePosicao(valor: string) {
    const nomes: Record<string, string> = {
      DIANTEIRO_ESQUERDO: "Dianteiro esquerdo",
      DIANTEIRO_DIREITO: "Dianteiro direito",
      TRASEIRO_ESQUERDO: "Traseiro esquerdo",
      TRASEIRO_DIREITO: "Traseiro direito",
      ESTEPE: "Estepe",
      ESTOQUE: "Estoque",
    };

    return nomes[valor] || valor;
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-slate-400 font-semibold">
          Controle de Frota
        </p>

        <h1 className="text-2xl md:text-3xl font-black text-white">
          🛞 Controle de Pneus
        </h1>

        <p className="text-slate-400 mt-2">
          Cadastro e acompanhamento dos pneus da frota.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="Pneus" valor={String(resumo.total)} />
        <Card titulo="Em uso" valor={String(resumo.emUso)} />
        <Card titulo="Estoque" valor={String(resumo.estoque)} />
        <Card titulo="Substituídos" valor={String(resumo.substituidos)} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Atalho
          href="/sistema/pneus/historico"
          icone="📋"
          titulo="Histórico"
          texto="Ver movimentações, rodízios, trocas e instalações."
        />

        <Atalho
          href="/sistema/pneus/rodizio"
          icone="🔄"
          titulo="Rodízio"
          texto="Registrar mudança de posição dos pneus."
        />

        <Atalho
          href="/sistema/pneus/trocas"
          icone="🔧"
          titulo="Trocas"
          texto="Registrar substituição de pneus da frota."
        />
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="painel-premium p-6 xl:col-span-1">
          <h2 className="text-xl font-black text-white">
            Cadastrar Pneu
          </h2>

          <p className="text-slate-400 text-sm mb-5">
            Registre o pneu e vincule à viatura ou deixe em estoque.
          </p>

          <div className="space-y-4">
            <Campo
              label="Código do pneu"
              valor={codigo}
              setValor={setCodigo}
              placeholder="Ex: PNEU-001"
            />

            <Campo
              label="Marca"
              valor={marca}
              setValor={setMarca}
              placeholder="Ex: Goodyear"
            />

            <Campo
              label="Modelo"
              valor={modelo}
              setValor={setModelo}
              placeholder="Ex: Wrangler"
            />

            <Campo
              label="Medida"
              valor={medida}
              setValor={setMedida}
              placeholder="Ex: 205/60 R16"
            />

            <div>
              <label className="label">Viatura</label>
              <select
                className="input"
                value={viaturaId}
                onChange={(e) => setViaturaId(e.target.value)}
              >
                <option value="">Estoque / sem viatura</option>

                {viaturas.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.prefixo} - {v.placa} {v.modelo ? `• ${v.modelo}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Posição</label>
              <select
                className="input"
                value={posicao}
                onChange={(e) => setPosicao(e.target.value)}
              >
                <option value="DIANTEIRO_ESQUERDO">Dianteiro esquerdo</option>
                <option value="DIANTEIRO_DIREITO">Dianteiro direito</option>
                <option value="TRASEIRO_ESQUERDO">Traseiro esquerdo</option>
                <option value="TRASEIRO_DIREITO">Traseiro direito</option>
                <option value="ESTEPE">Estepe</option>
                <option value="ESTOQUE">Estoque</option>
              </select>
            </div>

            <Campo
              label="KM instalação"
              valor={kmInstalacao}
              setValor={setKmInstalacao}
              placeholder="Ex: 25430"
            />

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="EM_USO">Em uso</option>
                <option value="ESTOQUE">Estoque</option>
                <option value="SUBSTITUIDO">Substituído</option>
                <option value="DESCARTADO">Descartado</option>
              </select>
            </div>

            <div>
              <label className="label">Observações</label>
              <textarea
                className="input min-h-[100px]"
                placeholder="Observações sobre o pneu"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            <button
              onClick={salvarPneu}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Cadastrar Pneu"}
            </button>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white">
              Pneus Cadastrados
            </h2>

            <p className="text-slate-400 text-sm">
              Grade geral dos pneus da frota.
            </p>
          </div>

          {carregando ? (
            <div className="painel-premium p-6 text-slate-400">
              Carregando pneus...
            </div>
          ) : pneus.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">🛞</p>

              <h2 className="text-white font-black text-xl">
                Nenhum pneu cadastrado
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                Cadastre o primeiro pneu para iniciar o controle.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {pneus.map((p) => (
                <div
                  key={p.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-slate-400 text-sm">Código</p>

                      <h3 className="text-xl font-black text-white">
                        🛞 {p.codigo}
                      </h3>

                      <p className="text-slate-500 text-sm">
                        {p.marca || "Marca não informada"}{" "}
                        {p.modelo ? `• ${p.modelo}` : ""}
                      </p>
                    </div>

                    <span className="h-fit rounded-full bg-slate-900 border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300">
                      {p.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Info
                      titulo="Viatura"
                      valor={p.viaturas?.prefixo || "Estoque"}
                    />

                    <Info
                      titulo="Posição"
                      valor={nomePosicao(p.posicao)}
                    />

                    <Info
                      titulo="Medida"
                      valor={p.medida || "N/I"}
                    />

                    <Info
                      titulo="KM instalação"
                      valor={p.km_instalacao || "N/I"}
                    />
                  </div>

                  {p.observacao && (
                    <p className="text-slate-400 text-sm mt-4 whitespace-pre-wrap">
                      {p.observacao}
                    </p>
                  )}
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

      <h2 className="text-2xl md:text-3xl font-black text-white">
        {valor}
      </h2>
    </div>
  );
}

function Info({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-3">
      <p className="text-slate-500 text-xs">{titulo}</p>

      <p className="text-slate-200 font-bold text-sm">
        {valor}
      </p>
    </div>
  );
}

function Atalho({
  href,
  icone,
  titulo,
  texto,
}: {
  href: string;
  icone: string;
  titulo: string;
  texto: string;
}) {
  return (
    <Link
      href={href}
      className="painel-premium p-5 hover:scale-[1.01] transition block"
    >
      <p className="text-4xl mb-3">{icone}</p>

      <h2 className="text-xl font-black text-white">
        {titulo}
      </h2>

      <p className="text-slate-400 text-sm mt-2">
        {texto}
      </p>
    </Link>
  );
}