"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Search,
  Lock,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type UsuarioLogado = {
  id: number;
  perfil?: string;
  municipio_id: number;
};

type Armamento = {
  id: number;
  tipo: string | null;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  calibre: string | null;
  patrimonio: string | null;
  localizacao: string | null;
  status: string | null;
  observacao: string | null;
};

export default function ArmariaPage() {
  const [armamentos, setArmamentos] = useState<Armamento[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    async function iniciar() {
      const usuario = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      ) as UsuarioLogado;

      if (!usuario?.id || !usuario?.municipio_id) {
        alert("Sessão inválida.");
        setBloqueado(true);
        setCarregando(false);
        return;
      }

      if (
        ![
          "ADMIN",
          "COMANDANTE",
          "DIRETOR",
          "DESENVOLVEDOR",
        ].includes(usuario.perfil || "")
      ) {
        await registrarAuditoria({
          modulo: "Armaria",
          acao: "ACESSO_NEGADO",
          descricao: "Tentativa de acesso à Armaria sem permissão.",
          tabela: "armamentos",
          detalhes: {
            usuario_id: usuario.id,
            perfil: usuario.perfil,
            municipio_id: usuario.municipio_id,
          },
        });

        setBloqueado(true);
        setCarregando(false);
        return;
      }

      await registrarAuditoria({
        modulo: "Armaria",
        acao: "ACESSO",
        descricao: "Acessou a Armaria.",
        tabela: "armamentos",
        detalhes: {
          usuario_id: usuario.id,
          perfil: usuario.perfil,
          municipio_id: usuario.municipio_id,
        },
      });

      await carregar(usuario);
    }

    iniciar();
  }, []);

  async function carregar(usuario: UsuarioLogado) {
    setCarregando(true);

    const { data, error } = await supabase
      .from("armamentos")
      .select(
        "id, tipo, marca, modelo, numero_serie, calibre, patrimonio, localizacao, status, observacao"
      )
      .eq("municipio_id", usuario.municipio_id)
      .order("marca", { ascending: true })
      .range(0, 499);

    setCarregando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Armaria",
        acao: "ERRO",
        descricao: "Erro ao carregar armamentos da armaria.",
        tabela: "armamentos",
        detalhes: {
          erro: error.message,
          usuario_id: usuario.id,
          municipio_id: usuario.municipio_id,
        },
      });

      alert("Erro ao carregar armaria.");
      return;
    }

    setArmamentos(data || []);
  }

  const resumo = useMemo(() => {
    return {
      total: armamentos.length,
      disponiveis: armamentos.filter((a) => a.status === "DISPONIVEL").length,
      cauteladas: armamentos.filter((a) => a.status === "CAUTELADA").length,
      manutencao: armamentos.filter((a) => a.status === "MANUTENCAO").length,
    };
  }, [armamentos]);

  const lista = useMemo(() => {
    return armamentos.filter((item) => {
      const texto = `
        ${item.tipo || ""}
        ${item.marca || ""}
        ${item.modelo || ""}
        ${item.numero_serie || ""}
        ${item.calibre || ""}
        ${item.status || ""}
      `.toLowerCase();

      return texto.includes(busca.toLowerCase());
    });
  }, [armamentos, busca]);

  if (bloqueado) {
    return (
      <div className="p-4 md:p-6 pb-24">
        <div className="painel-premium p-10 text-center">
          <Lock className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <h1 className="text-2xl font-black text-white">
            Acesso restrito
          </h1>
          <p className="text-slate-400 mt-2">
            Você não possui permissão para acessar a Armaria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-blue-400 font-bold uppercase">
          Controle Administrativo Restrito
        </p>

        <h1 className="text-3xl font-black text-white">
          🏛️ Armaria
        </h1>

        <p className="text-slate-400 mt-2">
          Controle geral dos armamentos da Guarda Municipal.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          titulo="Total"
          valor={carregando ? "..." : String(resumo.total)}
          icone={<Shield className="w-7 h-7" />}
        />

        <Card
          titulo="Disponíveis"
          valor={carregando ? "..." : String(resumo.disponiveis)}
          icone={<CheckCircle className="w-7 h-7 text-green-400" />}
        />

        <Card
          titulo="Cauteladas"
          valor={carregando ? "..." : String(resumo.cauteladas)}
          icone={<AlertTriangle className="w-7 h-7 text-yellow-400" />}
        />

        <Card
          titulo="Manutenção"
          valor={carregando ? "..." : String(resumo.manutencao)}
          icone={<Wrench className="w-7 h-7 text-blue-400" />}
        />
      </div>

      <div className="painel-premium p-6">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-slate-400" />

          <h2 className="text-xl font-black text-white">
            Consulta Rápida
          </h2>
        </div>

        <input
          className="input"
          placeholder="Pesquisar armamento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {carregando ? (
        <div className="painel-premium p-10 text-center">
          <p className="text-slate-400">Carregando armaria...</p>
        </div>
      ) : lista.length === 0 ? (
        <div className="painel-premium p-10 text-center">
          <p className="text-6xl mb-4">🛡️</p>

          <h2 className="text-xl font-black text-white">
            Nenhum armamento encontrado
          </h2>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lista.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
            >
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-slate-400 text-sm break-words">
                    {item.tipo || "N/I"}
                  </p>

                  <h2 className="text-xl font-black text-white break-words">
                    {item.marca || "N/I"} {item.modelo || ""}
                  </h2>

                  <p className="text-slate-500 text-sm break-words">
                    Série: {item.numero_serie || "N/I"}
                  </p>
                </div>

                <Status status={item.status || "N/I"} />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <Info titulo="Calibre" valor={item.calibre || "N/I"} />
                <Info titulo="Patrimônio" valor={item.patrimonio || "N/I"} />
                <Info titulo="Local" valor={item.localizacao || "N/I"} />
                <Info titulo="Status" valor={item.status || "N/I"} />
              </div>

              {item.observacao && (
                <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap break-words">
                  {item.observacao}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="painel-premium p-5">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h2 className="text-3xl font-black text-white">{valor}</h2>
        </div>

        {icone}
      </div>
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
      <p className="text-slate-200 font-bold text-sm break-words">
        {valor}
      </p>
    </div>
  );
}

function Status({ status }: { status: string }) {
  let cor = "bg-slate-900 text-slate-300 border-slate-700";

  if (status === "DISPONIVEL") {
    cor = "bg-green-950 text-green-300 border-green-800";
  }

  if (status === "CAUTELADA") {
    cor = "bg-yellow-950 text-yellow-300 border-yellow-800";
  }

  if (status === "MANUTENCAO") {
    cor = "bg-blue-950 text-blue-300 border-blue-800";
  }

  if (status === "BAIXADA" || status === "EXTRAVIADA") {
    cor = "bg-red-950 text-red-300 border-red-800";
  }

  return (
    <span
      className={`h-fit rounded-full border px-3 py-1 text-xs font-bold shrink-0 ${cor}`}
    >
      {status || "N/I"}
    </span>
  );
}