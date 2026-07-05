"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  Plus,
  ShieldCheck,
  MapPin,
  CalendarDays,
  Clock,
  Clock3,
  FileText,
  CheckCircle,
  PlayCircle,
  Trash2,
  Users,
  Crosshair,
} from "lucide-react";

export default function OperacoesEspeciaisPage() {
  const [operacoes, setOperacoes] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("SATURACAO");
  const [objetivo, setObjetivo] = useState("");
  const [local, setLocal] = useState("");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [comandante, setComandante] = useState("");
  const [efetivo, setEfetivo] = useState("0");
  const [orgaosEnvolvidos, setOrgaosEnvolvidos] = useState("");
  const [observacoes, setObservacoes] = useState("");

function pegarUsuario() {
  try {
    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    if (
      !usuario?.id ||
      !usuario?.municipio_id ||
      !usuario?.perfil
    ) {
      return null;
    }

    return usuario;
  } catch {
    return null;
  }
}

  useEffect(() => {
    carregarOperacoes();
  }, []);

  async function carregarOperacoes() {
    setCarregando(true);
const usuario = pegarUsuario();

if (!usuario) {
  setCarregando(false);
  return;
}

const { data, error } = await supabase
      .from("operacoes_especiais")
      .select(`
id,
nome,
tipo,
objetivo,
local,
data,
hora_inicio,
hora_fim,
latitude,
longitude,
comandante,
efetivo,
orgaos_envolvidos,
observacoes,
status,
created_at
`)
.limit(100)
      .eq("municipio_id", usuario.municipio_id)
      .order("created_at", { ascending: false });

    if (!error) setOperacoes(data || []);
    setCarregando(false);
  }

  function usarMinhaLocalizacao() {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const precisao = Math.round(pos.coords.accuracy);

        if (precisao > 100) {
          alert(
            `Localização muito imprecisa: ${precisao} metros.\nUse pelo celular com GPS ligado ou preencha manualmente.`
          );
          return;
        }

        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));

        alert(`Localização capturada com precisão de ${precisao} metros.`);
      },
      () => {
        alert("Não foi possível obter sua localização.");
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }

  async function salvarOperacao() {
    const usuario = pegarUsuario();

    if (!usuario) {
  alert("Sessão inválida.");
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

    if (!usuario?.municipio_id) {
      alert("Município do usuário não identificado.");
      return;
    }

    if (
  Number(efetivo) < 0
) {
  alert("Efetivo inválido.");
  return;
}

if (
  latitude &&
  isNaN(Number(latitude))
) {
  alert("Latitude inválida.");
  return;
}

if (
  longitude &&
  isNaN(Number(longitude))
) {
  alert("Longitude inválida.");
  return;
}

    if (!nome || !local || !data || !horaInicio) {
      alert("Preencha nome, local, data e hora inicial.");
      return;
    }

    const { error } = await supabase.from("operacoes_especiais").insert([
      {
        municipio_id: usuario.municipio_id,
        nome,
        tipo,
        objetivo,
        local,
        data,
        hora_inicio: horaInicio,
        hora_fim: horaFim || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        comandante,
        efetivo: Number(efetivo || 0),
        orgaos_envolvidos:
  orgaosEnvolvidos,
        observacoes,
        status: "PLANEJADA",
        criado_por: usuario.id,
criado_em: new Date().toISOString(),
atualizado_em: new Date().toISOString(),
      },
    ]);

if (error) {
  console.error(error);

  await registrarAuditoria({
    modulo: "Operações Especiais",
    acao: "ERRO",
    descricao:
      "Erro ao cadastrar operação especial.",
    tabela: "operacoes_especiais",
    detalhes: {
      erro: error.message,
      municipio_id:
        usuario.municipio_id,
    },
  });

  alert("Erro ao salvar operação especial.");
  return;
}

await registrarAuditoria({
  modulo: "Operações Especiais",
  acao: "CRIAR",
  descricao:
    `Criou a operação ${nome}.`,
  tabela: "operacoes_especiais",
  detalhes: {
    nome,
    tipo,
    local,
    data,
    municipio_id:
      usuario.municipio_id,
  },
});

    setNome("");
    setTipo("SATURACAO");
    setObjetivo("");
    setLocal("");
    setData("");
    setHoraInicio("");
    setHoraFim("");
    setLatitude("");
    setLongitude("");
    setComandante("");
    setEfetivo("0");
    setOrgaosEnvolvidos("");
    setObservacoes("");

    carregarOperacoes();
  }

  async function atualizarStatus(id: string, status: string) {
    const usuario = pegarUsuario();

const { error } =
  await supabase
    .from("operacoes_especiais")
    .update({
      status,
      atualizado_em:
        new Date().toISOString(),
      latitude:
        status === "FINALIZADA"
          ? null
          : undefined,
      longitude:
        status === "FINALIZADA"
          ? null
          : undefined,
    })
    .eq("id", id)
    .eq(
      "municipio_id",
      usuario.municipio_id
    );

if (error) {
  alert("Erro ao atualizar.");
  return;
}

await registrarAuditoria({
  modulo: "Operações Especiais",
  acao: "EDITAR",
  descricao: `Alterou status para ${status}.`,
  tabela: "operacoes_especiais",
  registro_id: id,
  detalhes: {
    status,
    municipio_id: usuario.municipio_id,
  },
});

await carregarOperacoes();
}

async function apagarTestes() {
    const usuario = pegarUsuario();

const motivo = prompt(
  "Informe o motivo da exclusão:"
);

if (!motivo?.trim()) {
  alert(
    "Informe o motivo."
  );
  return;
}

if (
  !confirm(
    "Apagar operações especiais de teste deste município?"
  )
) {
  return;
}

    const { error } = await supabase
      .from("operacoes_especiais")
      .delete()
      .eq("municipio_id", usuario.municipio_id)
      .or("nome.ilike.%teste%,local.ilike.%teste%,observacoes.ilike.%teste%");

    if (error) {
  alert("Erro ao apagar testes.");
  console.error(error);

  await registrarAuditoria({
    modulo: "Operações Especiais",
    acao: "ERRO",
    descricao: "Erro ao apagar operações de teste.",
    tabela: "operacoes_especiais",
    detalhes: {
      erro: error.message,
      motivo,
      municipio_id: usuario.municipio_id,
    },
  });

  return;
}

await registrarAuditoria({
  modulo: "Operações Especiais",
  acao: "EXCLUIR",
  descricao: "Apagou operações de teste.",
  tabela: "operacoes_especiais",
  detalhes: {
    motivo,
    municipio_id: usuario.municipio_id,
  },
});

alert("Operações de teste apagadas.");
    carregarOperacoes();
  }

  const planejadas = operacoes.filter((o) => o.status === "PLANEJADA").length;
  const andamento = operacoes.filter((o) => o.status === "EM_ANDAMENTO").length;
  const finalizadas = operacoes.filter((o) => o.status === "FINALIZADA").length;
  const efetivoTotal = operacoes.reduce(
    (total, o) => total + Number(o.efetivo || 0),
    0
  );

  return (
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-yellow-400" size={34} />
          <div>
            <h1 className="text-3xl font-black">Operações Especiais</h1>
            <p className="text-slate-400">
              Planejamento, execução e controle de operações especiais.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CardInfo titulo="Planejadas" valor={planejadas} />
        <CardInfo titulo="Em andamento" valor={andamento} />
        <CardInfo titulo="Finalizadas" valor={finalizadas} />
        <CardInfo titulo="Efetivo total" valor={efetivoTotal} />
      </div>

      <div className="painel-premium p-6 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Plus size={22} />
          Nova Operação Especial
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            className="input-premium"
            placeholder="Nome da operação"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <select
            className="input-premium"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="SATURACAO">Saturação</option>
            <option value="CUMPRIMENTO_DE_MANDADO">Cumprimento de Mandado</option>
            <option value="GRANDE_EVENTO">Grande Evento</option>
            <option value="APOIO_POLICIAL">Apoio Policial</option>
            <option value="OPERACAO_CONJUNTA">Operação Conjunta</option>
            <option value="BUSCA_E_APREENSAO">Busca e Apreensão</option>
            <option value="FISCALIZACAO">Fiscalização</option>
            <option value="PATRULHAMENTO_ESPECIAL">Patrulhamento Especial</option>
            <option value="ESCOLAR">Escolar</option>
            <option value="AMBIENTAL">Ambiental</option>
            <option value="DEFESA_CIVIL">Defesa Civil</option>
            <option value="OUTRA">Outra</option>
          </select>

          <input
            className="input-premium"
            placeholder="Local"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
          />

          <div className="relative">
            <input
              className="input-premium pr-12"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
            <CalendarDays
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
              size={20}
            />
          </div>

          <div className="relative">
            <input
              className="input-premium pr-12"
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
            />
            <Clock3
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
              size={20}
            />
          </div>

          <div className="relative">
            <input
              className="input-premium pr-12"
              type="time"
              value={horaFim}
              onChange={(e) => setHoraFim(e.target.value)}
            />
            <Clock3
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
              size={20}
            />
          </div>

          <input
            className="input-premium"
            placeholder="Latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
          />

          <input
            className="input-premium"
            placeholder="Longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />

          <button
            type="button"
            onClick={usarMinhaLocalizacao}
            className="bg-cyan-700 hover:bg-cyan-600 text-white font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <MapPin size={18} />
            Usar minha localização
          </button>

          <input
            className="input-premium"
            placeholder="Comandante da operação"
            value={comandante}
            onChange={(e) => setComandante(e.target.value)}
          />

          <input
            className="input-premium"
            type="number"
            placeholder="Efetivo empregado"
            value={efetivo}
            onChange={(e) => setEfetivo(e.target.value)}
          />

          <input
            className="input-premium"
            placeholder="Órgãos envolvidos"
            value={orgaosEnvolvidos}
            onChange={(e) => setOrgaosEnvolvidos(e.target.value)}
          />
        </div>

        <textarea
          className="input-premium w-full"
          placeholder="Objetivo da operação"
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
        />

        <textarea
          className="input-premium w-full"
          placeholder="Observações"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        <div className="flex flex-wrap gap-3">
          <button
            onClick={salvarOperacao}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl flex items-center gap-2"
          >
            <Plus size={18} />
            Salvar Operação
          </button>

          <button
            type="button"
            onClick={apagarTestes}
            className="bg-red-700 hover:bg-red-600 text-white font-bold px-5 py-3 rounded-xl flex items-center gap-2"
          >
            <Trash2 size={18} />
            Apagar testes
          </button>
        </div>
      </div>

      <div className="painel-premium p-6">
        <h2 className="text-xl font-bold mb-4">Operações Cadastradas</h2>

        {carregando ? (
          <p className="text-slate-400">Carregando...</p>
        ) : operacoes.length === 0 ? (
          <p className="text-slate-400">Nenhuma operação cadastrada.</p>
        ) : (
          <div className="space-y-4">
            {operacoes.map((o) => (
              <div
                key={o.id}
                className="border border-slate-700 rounded-xl p-4 bg-slate-900/60"
              >
                <div className="flex justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black flex items-center gap-2">
                      <ShieldCheck size={20} className="text-yellow-400" />
                      {o.nome}
                    </h3>

                    <p className="text-slate-400 flex items-center gap-2">
                      <MapPin size={16} /> {o.local}
                    </p>

                    <p className="text-slate-400 flex items-center gap-2">
                      <CalendarDays size={16} /> {o.data}
                    </p>

                    <p className="text-slate-400 flex items-center gap-2">
                      <Clock size={16} />
                      {o.hora_inicio} {o.hora_fim ? `até ${o.hora_fim}` : ""}
                    </p>

                    <p className="text-slate-400 flex items-center gap-2">
                      <Users size={16} />
                      Efetivo: {o.efetivo || 0}
                    </p>

                    {o.objetivo && (
                      <p className="text-slate-300 flex items-center gap-2 mt-2">
                        <FileText size={16} /> {o.objetivo}
                      </p>
                    )}

                    {(o.latitude && o.longitude) && (
                      <p className="text-cyan-300 flex items-center gap-2 mt-2">
                        <Crosshair size={16} />
                        GPS: {o.latitude}, {o.longitude}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-900 text-blue-200 text-sm font-bold text-center">
                      {o.status}
                    </span>

                    <button
                      onClick={() => atualizarStatus(o.id, "EM_ANDAMENTO")}
                      className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      <PlayCircle size={16} />
                      Iniciar
                    </button>

                    <button
                      onClick={() => atualizarStatus(o.id, "FINALIZADA")}
                      className="bg-green-600 hover:bg-green-500 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Finalizar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CardInfo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="painel-premium p-4">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h3 className="text-3xl font-black text-white">{valor}</h3>
    </div>
  );
}