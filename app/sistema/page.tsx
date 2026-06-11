"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Municipio = {
  id: number;
  nome: string;
  estado: string;
  brasao: string | null;
  cor_principal: string | null;
  ativo: boolean;
};

type Ocorrencia = {
  id: number;
  protocolo: string;
  tipo: string;
  local: string;
  bairro: string | null;
  data: string;
  hora: string;
  status: string;
};

type Guarda = {
  id: number;
  nome: string;
  status: string;
  data_nascimento: string | null;
};

type Viatura = {
  id: number;
  prefixo: string;
  modelo: string;
  placa: string;
  status: string;
  combustivel: string | null;
  quilometragem: string | null;
};

type Aviso = {
  id: number;
  titulo: string;
  descricao: string;
};

type Permuta = {
  id: number;
  status: string;
};

type Guarnicao = {
  id: number;
  nome: string;
  comandante_id: number | null;
  viatura_id: number | null;
  ativa: boolean;
};

type MembroGuarnicao = {
  id: number;
  guarnicao_id: number;
  guarda_id: number;
};

type EscalaHoje = {
  id: number;
  data_servico: string;
  guarda_nome: string;
  matricula: string;
  tipo: string;
  turno: string;
  equipe: string;
};

type ConfigEscalaOperacional = {
  id: number;
  municipio_id: number;
  modelo_escala_id: number;
  data_base: string;
  guarnicao_base_id: number;
  ordem_guarnicoes: number[];
  ativo: boolean;
};

type Atividade = {
  titulo: string;
  detalhe: string;
  hora: string;
  icone: string;
  cor: string;
};

export default function Dashboard() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [viatura, setViatura] = useState<Viatura | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [permutas, setPermutas] = useState<Permuta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [guarnicoes, setGuarnicoes] = useState<Guarnicao[]>([]);
  const [membrosGuarnicao, setMembrosGuarnicao] = useState<MembroGuarnicao[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [escalaHoje, setEscalaHoje] = useState<EscalaHoje[]>([]);
  const [municipioAtivo, setMunicipioAtivo] = useState<Municipio | null>(null);
  const [modeloEscalaAtivo, setModeloEscalaAtivo] = useState<string>("");
  const [configEscala, setConfigEscala] = useState<ConfigEscalaOperacional | null>(null);
 
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [mostrarMensagens, setMostrarMensagens] = useState(false);
  
  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";
  const podeOperar = perfilUsuario !== "CONSULTA";

  async function carregarDashboard() {
    setCarregando(true);

    const { data: configData } = await supabase
      .from("configuracoes_sistema")
      .select("municipio_padrao_id")
      .order("id", { ascending: true })
      .limit(1)
      .single();

    const municipioId = configData?.municipio_padrao_id || 1;

    const { data: municipioData } = await supabase
      .from("municipios")
      .select("*")
      .eq("id", municipioId)
      .single();

    const { data: modeloData } = await supabase
      .from("escala_modelos")
      .select("nome")
      .eq("municipio_id", municipioId)
      .eq("ativo", true)
      .limit(1)
      .single();

    const { data: configEscalaData } = await supabase
      .from("escala_operacional_config")
      .select("*")
      .eq("municipio_id", municipioId)
      .eq("ativo", true)
      .order("id", { ascending: false })
      .limit(1)
      .single();

    const { data: ocorrenciasData } = await supabase
      .from("ocorrencias")
      .select("id, protocolo, tipo, local, bairro, data, hora, status")
      .eq("municipio_id", municipioId)
      .order("id", { ascending: false });

    const { data: guardasData } = await supabase
      .from("guardas")
.select("id, nome, status, data_nascimento")
      .eq("municipio_id", municipioId);

    const { data: viaturaData } = await supabase
      .from("viaturas")
      .select("*")
      .eq("municipio_id", municipioId)
      .order("id", { ascending: true })
      .limit(1)
      .single();

    const { data: avisosData } = await supabase
      .from("avisos")
      .select("*")
      .order("id", { ascending: false });

    const { data: permutasData } = await supabase
      .from("permutas_plantao")
      .select("id, status");

    const { data: guarnicoesData } = await supabase
      .from("guarnicoes")
      .select("*")
      .eq("municipio_id", municipioId)
      .eq("ativa", true)
      .order("id");

    const { data: membrosGuarnicaoData } = await supabase
      .from("guarnicao_membros")
      .select("id, guarnicao_id, guarda_id");

    const { data: viaturasData } = await supabase
      .from("viaturas")
      .select("*")
      .eq("municipio_id", municipioId);

    const hojeData = new Date().toISOString().split("T")[0];

    const { data: escalaHojeData } = await supabase
      .from("escalas_servico")
      .select("*")
      .eq("data_servico", hojeData);

    setMunicipioAtivo(municipioData || null);
    setModeloEscalaAtivo(modeloData?.nome || "Não configurado");
    setConfigEscala((configEscalaData as ConfigEscalaOperacional) || null);
    setOcorrencias(ocorrenciasData || []);
    setGuardas(guardasData || []);
    setViatura(viaturaData || null);
    setAvisos(avisosData || []);
    setEscalaHoje(escalaHojeData || []);
    setViaturas(viaturasData || []);
    setPermutas(permutasData || []);
    setGuarnicoes(guarnicoesData || []);
    setMembrosGuarnicao(membrosGuarnicaoData || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];

  const dataBR = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const horaBR = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const ocorrenciasHoje = ocorrencias.filter((o) => o.data === hoje).length;
  const abertas = ocorrencias.filter((o) => o.status === "Aberta").length;
  const finalizadas = ocorrencias.filter((o) => o.status === "Finalizada").length;
  const guardasServico = guardas.filter((g) => g.status === "Em serviço").length;
  const guardasFolga = guardas.filter((g) => g.status === "Folga").length;
const hojeAniversario = new Date();
const diaHoje = String(hojeAniversario.getDate()).padStart(2, "0");
const mesHoje = String(hojeAniversario.getMonth() + 1).padStart(2, "0");

const aniversariantesHoje = guardas.filter((g) => {
  if (!g.data_nascimento) return false;

  const [, mes, dia] = g.data_nascimento.split("-");

  return dia === diaHoje && mes === mesHoje;
});
  
 const permutasPendentes = permutas.filter(
    (p) => p.status === "PENDENTE" || p.status === "ACEITA"
  ).length;

  function calcularGuarnicaoPlantaoConfigurada() {
    if (!configEscala || !configEscala.ordem_guarnicoes?.length) return null;

    const dataBase = new Date(`${configEscala.data_base}T07:00:00`);
    const agora = new Date();
    const diferencaMs = agora.getTime() - dataBase.getTime();
    const diasPassados = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
    const ordem = configEscala.ordem_guarnicoes;

    const indiceBase = ordem.findIndex(
      (id) => Number(id) === Number(configEscala.guarnicao_base_id)
    );

    if (indiceBase === -1) return null;

    const indiceAtual =
      ((indiceBase + diasPassados) % ordem.length + ordem.length) %
      ordem.length;

    const guarnicaoIdAtual = ordem[indiceAtual];

    return (
      guarnicoes.find((g) => Number(g.id) === Number(guarnicaoIdAtual)) || null
    );
  }

  const guarnicaoAtual = calcularGuarnicaoPlantaoConfigurada();
  const guarnicaoPlantaoHoje = guarnicaoAtual?.nome || "Escala não configurada";

  const membrosGuarnicaoAtual = guarnicaoAtual
    ? membrosGuarnicao.filter(
        (m) => Number(m.guarnicao_id) === Number(guarnicaoAtual.id)
      )
    : [];

  const comandantePlantao = guarnicaoAtual
    ? guardas.find(
        (g) => Number(g.id) === Number(guarnicaoAtual.comandante_id)
      )
    : null;

  const viaturaPlantao = guarnicaoAtual
    ? viaturas.find((v) => Number(v.id) === Number(guarnicaoAtual.viatura_id))
    : null;

  const nomesMembrosPlantao = membrosGuarnicaoAtual.map((membro) => {
    const guarda = guardas.find(
      (g) => Number(g.id) === Number(membro.guarda_id)
    );

    return guarda?.nome || "Guarda não encontrado";
  });

  const ultimasAtividades: Atividade[] = [
    ...ocorrencias.slice(0, 4).map((o) => ({
      titulo: "Nova ocorrência registrada",
      detalhe: `${o.tipo} - ${o.local}`,
      hora: o.hora || "--:--",
      icone: "🚨",
      cor: "text-red-400",
    })),
    ...permutas.slice(0, 2).map((p) => ({
      titulo: "Permuta registrada",
      detalhe: `Status: ${p.status}`,
      hora: "--:--",
      icone: "🔁",
      cor: "text-yellow-400",
    })),
  ].slice(0, 5);

  return (
    <main className="min-h-screen bg-[#020b1c] text-white">
      <div className="p-4 md:p-6 pb-24">
        <PainelTopo
  municipio={municipioAtivo}
  guarnicao={guarnicaoPlantaoHoje}
  escala={modeloEscalaAtivo}
  data={dataBR}
  hora={horaBR}
  avisos={avisos}
  mostrarNotificacoes={mostrarNotificacoes}
  setMostrarNotificacoes={setMostrarNotificacoes}
  mostrarMensagens={mostrarMensagens}
  setMostrarMensagens={setMostrarMensagens}
/>

        {carregando ? (
          <div className="painel-premium p-10 text-center text-slate-300">
            Carregando painel operacional...
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-5">
              <CardComando
                titulo="Ocorrências"
                valor={String(ocorrenciasHoje)}
                detalhe="Hoje"
                icone="🚨"
                cor="blue"
              />

              <CardComando
                titulo="Chamados"
                valor="0"
                detalhe="Hoje"
                icone="📞"
                cor="gold"
              />

              <CardComando
                titulo="Viaturas"
                valor={String(viaturas.length)}
                detalhe="Ativas"
                icone="🚓"
                cor="green"
              />

              <CardComando
                titulo="Guardas"
                valor={String(guardas.length)}
                detalhe="Cadastrados"
                icone="👥"
                cor="purple"
              />

              <CardComando
                titulo="Escalas"
                valor={String(escalaHoje.length)}
                detalhe="Hoje"
                icone="📅"
                cor="cyan"
              />

              <CardComando
                titulo="Permutas"
                valor={String(permutasPendentes)}
                detalhe="Pendentes"
                icone="🔁"
                cor="indigo"
              />
            </section>

           <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
<PainelOcorrenciasTipo ocorrencias={ocorrencias} />

  <PainelGuarnicao
    guarnicao={guarnicaoPlantaoHoje}
    comandante={comandantePlantao?.nome || "Não informado"}
    viatura={viaturaPlantao?.prefixo || "Não definida"}
    membros={membrosGuarnicaoAtual.map((membro) => {
      const guarda = guardas.find(
        (g) => Number(g.id) === Number(membro.guarda_id)
      );

      return guarda?.nome || "Guarda não encontrado";
    })}
  />

  <PainelAtividades atividades={ultimasAtividades} />
</section>

            <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
              <PainelMapa ocorrencias={ocorrencias} />

              <PainelEscalaHoje escalaHoje={escalaHoje} />

              <PainelViaturas
                viaturas={viaturas}
                viaturaPrincipal={viatura}
              />

              <PainelAlertas avisos={avisos} />
            </section>

<section className="mb-5">
  <div className="painel-premium p-5">
    <TituloPainel
      icone="🎂"
      titulo="Aniversariantes do Dia"
    />

    <div className="mt-4">
      {aniversariantesHoje.length === 0 ? (
        <p className="text-slate-400">
          Nenhum aniversariante hoje.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {aniversariantesHoje.map((guarda) => (
            <div
              key={guarda.id}
              className="bg-slate-950/60 border border-yellow-500 rounded-xl p-4"
            >
              <h3 className="font-bold text-yellow-400">
                🎉 {guarda.nome}
              </h3>

              <p className="text-sm text-slate-400">
                Feliz aniversário!
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
</section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
              <PainelResumo
                finalizadas={finalizadas}
                abertas={abertas}
                guardasServico={guardasServico}
                guardasFolga={guardasFolga}
              />

              <Beneficio
                icone="🛡️"
                titulo="Transparência"
                texto="Gestão clara, segura e responsável"
              />

              <Beneficio
                icone="⚙️"
                titulo="Tecnologia"
                texto="Sistema moderno para serviço operacional"
              />
            </section>

            {podeOperar && (
              <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <AtalhoPremium
                  href="/sistema/ocorrencias/nova"
                  titulo="Nova Ocorrência"
                  icone="🚨"
                />

                <AtalhoPremium
                  href="/sistema/chamados"
                  titulo="Novo Chamado"
                  icone="📞"
                />

                <AtalhoPremium
                  href="/sistema/patrulhamento"
                  titulo="Patrulhamento"
                  icone="🚔"
                />

                <AtalhoPremium
                  href="/sistema/guarnicoes"
                  titulo="Guarnições"
                  icone="👮"
                />
              </section>
            )}
          </>
        )}

        {podeOperar && (
          <Link
            href="/sistema/ocorrencias/expressa"
            className="fixed bottom-6 right-6 md:hidden bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-xl z-50"
          >
            +
          </Link>
        )}
      </div>
    </main>
  );
}

function PainelTopo({
  municipio,
  guarnicao,
  escala,
  data,
  hora,
  avisos,
  mostrarNotificacoes,
  setMostrarNotificacoes,
  mostrarMensagens,
  setMostrarMensagens,
}: {
  municipio: Municipio | null;
  guarnicao: string;
  escala: string;
  data: string;
  hora: string;
  avisos: Aviso[];
  mostrarNotificacoes: boolean;
  setMostrarNotificacoes: React.Dispatch<React.SetStateAction<boolean>>;
  mostrarMensagens: boolean;
  setMostrarMensagens: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <header className="painel-premium mb-5 p-5">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <img
            src="/brasao-gcm-v2.png"
            alt="SIG-GCM Brasil"
            className="w-20 h-20 object-contain"
          />

          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              SIG-GCM BRASIL
            </h1>

            <p className="text-yellow-400 font-bold tracking-wide">
              CENTRAL OPERACIONAL INTEGRADA
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
          <InfoTopo
            rotulo="Município"
            valor={municipio ? `${municipio.nome} - ${municipio.estado}` : "Carregando"}
            icone="🏛️"
          />

          <InfoTopo
            rotulo="Plantão Atual"
            valor={guarnicao}
            icone="🟢"
          />

          <InfoTopo
            rotulo="Escala"
            valor={escala || "Não configurada"}
            icone="📅"
          />

          <InfoTopo
            rotulo="Sistema"
            valor="ONLINE"
            icone="🟢"
            destaque
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-slate-300 capitalize">{data}</p>
            <p className="text-yellow-400 font-bold text-xl">{hora}</p>
          </div>

          <div className="hidden md:flex gap-3 text-2xl relative">
  <button
  className="icone-topo relative"
  onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)}
>
  🔔

  {avisos.length > 0 && (
    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {avisos.length}
    </span>
  )}
</button>

  <button
  className="icone-topo"
  onClick={() => setMostrarMensagens(!mostrarMensagens)}
>
  ✉️
</button>

{mostrarMensagens && (
  <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-4 z-50">
    <h3 className="font-bold text-blue-400 mb-3">
      ✉️ Mensagens
    </h3>

    <div className="space-y-3 text-sm">
      <div className="border-b border-slate-700 pb-2">
        <p className="font-bold">📭 Caixa de mensagens</p>
        <p className="text-slate-400">
          Nenhuma mensagem recebida no momento.
        </p>
      </div>

      <div className="border-b border-slate-700 pb-2">
        <p className="font-bold">🚧 Em desenvolvimento</p>
        <p className="text-slate-400">
          Em breve será possível enviar mensagens entre usuários e guarnições.
        </p>
      </div>
    </div>
  </div>
)}

  <button
  className="icone-topo"
  onClick={() => {
    window.location.href = "/sistema/perfil";
  }}
>
  👤
</button>

{mostrarNotificacoes && (
  <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-4 z-50">
    <h3 className="font-bold text-yellow-400 mb-3">
      🔔 Notificações
    </h3>

    {avisos.length === 0 ? (
      <p className="text-slate-400">
        Nenhuma notificação.
      </p>
    ) : (
      <div className="space-y-3">
        {avisos.slice(0, 5).map((aviso) => (
          <div
            key={aviso.id}
            className="border-b border-slate-700 pb-2"
          >
            <p className="font-bold">
              {aviso.titulo}
            </p>

            <p className="text-sm text-slate-400">
              {aviso.descricao}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
)}
</div>
        </div>
      </div>
    </header>
  );
}

function InfoTopo({
  rotulo,
  valor,
  icone,
  destaque,
}: {
  rotulo: string;
  valor: string;
  icone: string;
  destaque?: boolean;
}) {
  return (
    <div className="border-l border-blue-800/80 pl-4">
      <p className="text-slate-400 flex items-center gap-2">
        {icone} {rotulo}
      </p>

      <p
        className={`font-black text-lg ${
          destaque ? "text-green-400" : "text-white"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

function CardComando({
  titulo,
  valor,
  detalhe,
  icone,
  cor,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  icone: string;
  cor: "blue" | "gold" | "green" | "purple" | "cyan" | "indigo";
}) {
  const cores = {
    blue: "from-blue-950 to-blue-800 border-blue-600 text-blue-300",
    gold: "from-yellow-950 to-yellow-800 border-yellow-600 text-yellow-300",
    green: "from-green-950 to-green-800 border-green-600 text-green-300",
    purple: "from-purple-950 to-purple-800 border-purple-600 text-purple-300",
    cyan: "from-cyan-950 to-cyan-800 border-cyan-600 text-cyan-300",
    indigo: "from-indigo-950 to-indigo-800 border-indigo-600 text-indigo-300",
  };

  return (
    <div
      className={`rounded-2xl p-5 bg-gradient-to-br ${cores[cor]} border shadow-xl min-h-36`}
    >
      <div className="flex justify-between items-start">
        <p className="uppercase text-sm font-black">{titulo}</p>
        <span className="text-3xl opacity-90">{icone}</span>
      </div>

      <h2 className="text-5xl font-black text-white mt-3">{valor}</h2>

      <p className="font-bold mt-1">{detalhe}</p>
    </div>
  );
}

function PainelOcorrenciasTipo({
  ocorrencias,
}: {
  ocorrencias: Ocorrencia[];
}) {
  const total = ocorrencias.length;

  const tipos = ocorrencias.reduce((acc: Record<string, number>, item) => {
    const tipo = item.tipo || "Não informado";
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  const lista = Object.entries(tipos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="painel-premium p-5 min-h-[300px]">
      <TituloPainel icone="📊" titulo="Ocorrências por Tipo" />

      <div className="mt-6">
        {total === 0 ? (
          <p className="text-slate-400">
            Nenhuma ocorrência registrada.
          </p>
        ) : (
          <>
            <div className="mb-5">
              <p className="text-slate-400 text-sm">Total de ocorrências</p>
              <h2 className="text-5xl font-black text-white">{total}</h2>
            </div>

            <div className="space-y-4">
              {lista.map(([tipo, quantidade]) => {
                const percentual = Math.round((quantidade / total) * 100);

                return (
                  <div key={tipo}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-slate-200">
                        {tipo}
                      </span>
                      <span className="text-blue-400 font-bold">
                        {quantidade} • {percentual}%
                      </span>
                    </div>

                    <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PainelGuarnicao({
  guarnicao,
  comandante,
  viatura,
  membros,
}: {
  guarnicao: string;
  comandante: string;
  viatura: string;
  membros: string[];
}) {
  return (
    <div className="painel-premium p-6 min-h-[330px] border border-yellow-600/70">
      <TituloPainel icone="🚔" titulo="Guarnição de Serviço" />

      <div className="border border-blue-600 rounded-2xl p-5 mt-4 relative bg-slate-950/40">
        <div className="absolute top-4 right-4 bg-green-900/70 border border-green-500 rounded-xl px-4 py-2 text-center">
          <p className="text-green-400 font-black">● EM SERVIÇO</p>
          <p className="text-xs text-white">07h às 07h</p>
        </div>

        <h2 className="text-4xl font-black text-green-400 mb-5 pr-36">
          {guarnicao}
        </h2>

        <div className="space-y-2 text-base">
          <p>
            👮 <span className="text-slate-400">Comandante:</span>{" "}
            <strong>{comandante}</strong>
          </p>

          <p>
            🚓 <span className="text-slate-400">Viatura:</span>{" "}
            <strong>{viatura}</strong>
          </p>

          <p>
            👥 <span className="text-slate-400">Efetivo:</span>{" "}
            <strong>{membros.length} membro(s)</strong>
          </p>
        </div>

        <div className="border-t border-slate-700 mt-4 pt-4">
          <h3 className="text-blue-400 text-lg font-black mb-2">
            👥 Equipe de Serviço
          </h3>

          <ul className="space-y-1 list-disc list-inside text-slate-100">
            {membros.length === 0 ? (
              <li>Nenhum membro cadastrado.</li>
            ) : (
              membros.map((nome) => <li key={nome}>{nome}</li>)
            )}
          </ul>
        </div>

        <div className="border-t border-slate-700 mt-4 pt-4 space-y-2">
          <p>
            🕘 <span className="text-slate-400">Horário:</span>{" "}
            <strong>07:00 às 07:00</strong>
          </p>

          <p className="text-blue-400 font-bold">
            📅 Escala automática 24/96 • Rodízio por guarnição
          </p>
        </div>
      </div>
    </div>
  );
}

function PainelMapa({ ocorrencias }: { ocorrencias: Ocorrencia[] }) {
  const locais = ocorrencias.reduce((acc: Record<string, number>, item) => {
    const local = item.bairro || item.local || "Local não informado";
    acc[local] = (acc[local] || 0) + 1;
    return acc;
  }, {});

  const lista = Object.entries(locais)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="painel-premium p-5 min-h-75">
      <TituloPainel icone="🗺️" titulo="Mapa de Ocorrências" />

      <div className="mt-4 space-y-3">
        {lista.length === 0 ? (
          <p className="text-slate-400">
            Nenhuma ocorrência localizada.
          </p>
        ) : (
          lista.map(([local, total]) => (
            <div key={local} className="linha-painel">
              <span>📍 {local}</span>
              <strong>{total}</strong>
            </div>
          ))
        )}
      </div>

      <Link href="/sistema/ocorrencias" className="botao-azul mt-5 block text-center">
        Ver ocorrências
      </Link>
    </div>
  );
}

function PainelEscalaHoje({ escalaHoje }: { escalaHoje: EscalaHoje[] }) {
  return (
    <div className="painel-premium p-5 min-h-75 flex flex-col">
      <TituloPainel icone="📅" titulo="Escalas de Hoje" />

      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
        {escalaHoje.length === 0 ? (
          <>
            <div className="w-24 h-24 rounded-full border border-blue-700 flex items-center justify-center text-5xl mb-5 bg-blue-950/40">
              📅
            </div>

            <p className="text-slate-300">Nenhum plantão cadastrado para hoje.</p>
            <p className="text-slate-400 mt-2 text-sm">A escala automática está ativa.</p>

            <Link href="/sistema/escalas" className="botao-azul mt-6">
              Ver escala mensal
            </Link>
          </>
        ) : (
          <div className="w-full space-y-3">
            {escalaHoje.slice(0, 5).map((escala) => (
              <div key={escala.id} className="linha-painel">
                <span>{escala.turno}</span>
                <strong>{escala.guarda_nome}</strong>
                <span className="text-green-400">{escala.tipo}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PainelAtividades({ atividades }: { atividades: Atividade[] }) {
  return (
    <div className="painel-premium p-5">
      <TituloPainel icone="📋" titulo="Atividades Recentes" />

      <div className="mt-4 space-y-3">
        {atividades.length === 0 ? (
          <p className="text-slate-400">Nenhuma atividade recente.</p>
        ) : (
          atividades.map((item, index) => (
            <div
              key={`${item.titulo}-${index}`}
              className="flex items-center gap-3 border-b border-slate-800 pb-3"
            >
              <span className={`text-2xl ${item.cor}`}>{item.icone}</span>

              <div className="flex-1">
                <p className="font-bold">{item.titulo}</p>
                <p className="text-sm text-slate-400">{item.detalhe}</p>
              </div>

              <span className="text-sm text-slate-300">{item.hora}</span>
            </div>
          ))
        )}
      </div>

      <Link
        href="/sistema/ocorrencias"
        className="botao-azul mt-5 block text-center"
      >
        Ver todas as atividades
      </Link>
    </div>
  );
}

function PainelViaturas({
  viaturas,
  viaturaPrincipal,
}: {
  viaturas: Viatura[];
  viaturaPrincipal: Viatura | null;
}) {
  const lista = viaturas.length
    ? viaturas.slice(0, 4)
    : viaturaPrincipal
      ? [viaturaPrincipal]
      : [];

  return (
    <div className="painel-premium p-5">
      <TituloPainel icone="🚓" titulo="Viaturas em Serviço" />

      <div className="mt-4 space-y-3">
        {lista.length === 0 ? (
          <p className="text-slate-400">Nenhuma viatura cadastrada.</p>
        ) : (
          lista.map((v) => (
            <div key={v.id} className="linha-painel">
              <strong>{v.prefixo}</strong>
              <span>{v.modelo}</span>
              <span className="badge-verde">{v.status || "Ativa"}</span>
            </div>
          ))
        )}
      </div>

      <Link href="/sistema/viatura" className="botao-azul mt-5 block text-center">
        Ver todas as viaturas
      </Link>
    </div>
  );
}

function PainelResumo({
  finalizadas,
  abertas,
  guardasServico,
  guardasFolga,
}: {
  finalizadas: number;
  abertas: number;
  guardasServico: number;
  guardasFolga: number;
}) {
  return (
    <div className="painel-premium p-5">
      <TituloPainel icone="📊" titulo="Resumo Operacional" />

      <div className="grid grid-cols-2 gap-3 mt-4">
        <ResumoMini titulo="Finalizadas" valor={finalizadas} />
        <ResumoMini titulo="Abertas" valor={abertas} />
        <ResumoMini titulo="Em serviço" valor={guardasServico} />
        <ResumoMini titulo="Folga" valor={guardasFolga} />
      </div>
    </div>
  );
}

function PainelAlertas({ avisos }: { avisos: Aviso[] }) {
  return (
    <div className="painel-premium p-5">
      <TituloPainel icone="🔔" titulo="Alertas e Comunicados" />

      <div className="mt-4 space-y-3">
        {avisos.length === 0 ? (
          <>
            <AlertaLinha
              icone="ℹ️"
              titulo="Sistema operacional"
              detalhe="Nenhum aviso crítico cadastrado"
            />

            <AlertaLinha
              icone="🛡️"
              titulo="Segurança ativa"
              detalhe="Painel em funcionamento normal"
            />

            <AlertaLinha
              icone="📅"
              titulo="Escala automática"
              detalhe="Rodízio operacional ativo"
            />
          </>
        ) : (
          avisos.slice(0, 4).map((aviso) => (
            <AlertaLinha
              key={aviso.id}
              icone="🔔"
              titulo={aviso.titulo}
              detalhe={aviso.descricao}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TituloPainel({ icone, titulo }: { icone: string; titulo: string }) {
  return (
    <h2 className="text-lg md:text-xl font-black uppercase tracking-wide text-slate-200 border-b border-slate-800 pb-3">
      <span className="mr-2">{icone}</span>
      {titulo}
    </h2>
  );
}

function Legenda({
  cor,
  nome,
  valor,
}: {
  cor: string;
  nome: string;
  valor: string;
}) {
  return (
    <div className="flex justify-between items-center gap-3">
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${cor}`} />
        <span className="text-slate-300">{nome}</span>
      </div>

      <strong>{valor}</strong>
    </div>
  );
}

function ResumoMini({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h3 className="text-3xl font-black">{valor}</h3>
    </div>
  );
}

function AlertaLinha({
  icone,
  titulo,
  detalhe,
}: {
  icone: string;
  titulo: string;
  detalhe: string;
}) {
  return (
    <div className="flex gap-3 items-start border-b border-slate-800 pb-3">
      <span className="text-2xl">{icone}</span>

      <div>
        <p className="font-bold">{titulo}</p>
        <p className="text-sm text-slate-400">{detalhe}</p>
      </div>
    </div>
  );
}

function Beneficio({
  icone,
  titulo,
  texto,
}: {
  icone: string;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="painel-premium p-5 flex items-center gap-4">
      <span className="text-5xl text-yellow-400">{icone}</span>

      <div>
        <h3 className="text-yellow-400 font-black text-xl">{titulo}</h3>
        <p className="text-slate-300">{texto}</p>
      </div>
    </div>
  );
}

function AtalhoPremium({
  href,
  titulo,
  icone,
}: {
  href: string;
  titulo: string;
  icone: string;
}) {
  return (
    <Link
      href={href}
      className="painel-premium p-4 hover:border-blue-500 transition block"
    >
      <span className="text-2xl mr-2">{icone}</span>
      <strong>{titulo}</strong>
    </Link>
  );
}
