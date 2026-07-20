"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FilePlus2,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  classificarSituacaoObrigacao,
  formatarTextoTreinamento,
  lerUsuarioTreinamento,
  podeGerenciarTreinamentos,
} from "@/lib/treinamentosObrigatorios";
import { supabase } from "@/lib/supabase";

type Regra = {
  id: number;
  curso_id: number;
  curso_nome: string;
  cargo: string | null;
  funcao: string | null;
  setor: string | null;
  periodicidade_meses: number;
  dias_alerta: number;
  ativo: boolean;
};

type Situacao = {
  id: number;
  regra_id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  ultima_conclusao: string | null;
  validade: string | null;
  dispensado: boolean;
  motivo_dispensa: string | null;
};

export default function TreinamentosObrigatoriosPage() {
  const [usuario] = useState(() => lerUsuarioTreinamento());
  const [regras, setRegras] = useState<Regra[]>([]);
  const [situacoes, setSituacoes] = useState<Situacao[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarTreinamentos(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const [regrasResp, situacoesResp] = await Promise.all([
      supabase
        .from("treinamentos_obrigatorios_regras")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .order("curso_nome"),
      supabase
        .from("treinamentos_obrigatorios_situacoes")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .order("guarda_nome"),
    ]);

    const primeiroErro = regrasResp.error || situacoesResp.error;
    if (primeiroErro) setErro(primeiroErro.message);

    setRegras((regrasResp.data as Regra[] | null) || []);
    setSituacoes((situacoesResp.data as Situacao[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const situacoesComStatus = useMemo(
    () =>
      situacoes.map((item) => {
        const regra = regras.find((regraAtual) => regraAtual.id === item.regra_id);
        return {
          ...item,
          regra,
          status: classificarSituacaoObrigacao(
            item.validade,
            item.dispensado,
            regra?.dias_alerta || 60
          ),
        };
      }),
    [regras, situacoes]
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return situacoesComStatus.filter((item) =>
      `${item.guarda_nome} ${item.matricula || ""} ${item.regra?.curso_nome || ""}`
        .toLowerCase()
        .includes(termo)
    );
  }, [busca, situacoesComStatus]);

  const regulares = situacoesComStatus.filter((item) => item.status === "REGULAR").length;
  const vencendo = situacoesComStatus.filter((item) => item.status === "VENCENDO").length;
  const vencidos = situacoesComStatus.filter((item) => item.status === "VENCIDO").length;
  const pendentes = situacoesComStatus.filter((item) => item.status === "PENDENTE").length;

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "treinamentos_obrigatorios_situacoes",
      descricao: "Impressão do painel de treinamentos obrigatórios.",
    });
    window.print();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1700px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 print:text-black">
                  Conformidade profissional
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Treinamentos Obrigatórios e Reciclagens
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Matriz de exigências, validade, pendências, dispensas e convocações.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 print:hidden">
                <button
                  onClick={() => void carregar()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-black"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </button>

                <button
                  onClick={() => void imprimir()}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-300"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir/PDF
                </button>


                <Link
                  href="/sistema/competencias"
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-sm font-black text-violet-300"
                >
                  Competências e habilidades
                </Link>

                {podeGerenciar ? (
                  <Link
                    href="/sistema/treinamentos-obrigatorios/nova-regra"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Nova exigência
                  </Link>
                ) : null}
              </div>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metrica titulo="Regulares" valor={regulares} icone={CheckCircle2} />
            <Metrica titulo="Vencendo" valor={vencendo} icone={AlertTriangle} />
            <Metrica titulo="Vencidos" valor={vencidos} icone={ShieldAlert} />
            <Metrica titulo="Pendentes" valor={pendentes} icone={ClipboardCheck} />
          </section>

          <section className="grid gap-3 rounded-2xl border border-slate-800 bg-[#061326] p-4 print:hidden lg:grid-cols-[1fr_auto]">
            <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-4">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar guarda, matrícula ou treinamento..."
                className="h-12 w-full bg-transparent outline-none"
              />
            </label>

            {podeGerenciar ? (
              <Link
                href="/sistema/treinamentos-obrigatorios/matriz"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 font-black text-cyan-300"
              >
                <UserCheck className="h-4 w-4" />
                Atualizar matriz
              </Link>
            ) : null}
          </section>

          <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#061326] print:border-black print:bg-white">
            {carregando ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
              </div>
            ) : (
              <table className="w-full min-w-[1150px] text-left text-sm">
                <thead className="border-b border-slate-700 text-[10px] uppercase text-slate-400 print:text-black">
                  <tr>
                    <th className="px-4 py-3">Guarda</th>
                    <th className="px-4 py-3">Treinamento</th>
                    <th className="px-4 py-3">Exigência</th>
                    <th className="px-4 py-3">Última conclusão</th>
                    <th className="px-4 py-3">Validade</th>
                    <th className="px-4 py-3">Situação</th>
                    <th className="px-4 py-3 print:hidden">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800/70">
                      <td className="px-4 py-4">
                        <p className="font-black">{item.guarda_nome}</p>
                        <p className="text-xs text-slate-500">
                          {item.matricula || "Sem matrícula"}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-bold">
                        {item.regra?.curso_nome || "Treinamento removido"}
                      </td>
                      <td className="px-4 py-4">
                        {item.regra
                          ? [
                              item.regra.cargo,
                              item.regra.funcao,
                              item.regra.setor,
                            ]
                              .filter(Boolean)
                              .join(" • ") || "Todo efetivo"
                          : "Não informada"}
                      </td>
                      <td className="px-4 py-4">
                        {item.ultima_conclusao
                          ? new Date(`${item.ultima_conclusao}T00:00:00`).toLocaleDateString("pt-BR")
                          : "Nunca concluído"}
                      </td>
                      <td className="px-4 py-4">
                        {item.validade
                          ? new Date(`${item.validade}T00:00:00`).toLocaleDateString("pt-BR")
                          : "Sem validade"}
                      </td>
                      <td className="px-4 py-4">
                        {formatarTextoTreinamento(item.status)}
                      </td>
                      <td className="px-4 py-4 print:hidden">
                        <Link
                          href={`/sistema/treinamentos-obrigatorios/${item.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/25 px-3 py-2 font-black text-cyan-300"
                        >
                          <Eye className="h-4 w-4" />
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {!filtrados.length ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                        Nenhuma situação encontrada. Atualize a matriz para gerar os registros.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Metrica({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: number | string;
  icone: typeof ClipboardCheck;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <Icone className="h-6 w-6 text-cyan-300 print:text-black" />
      <p className="mt-4 text-[10px] font-black uppercase tracking-wider text-slate-500 print:text-black">
        {titulo}
      </p>
      <p className="mt-1 text-xl font-black">{valor}</p>
    </div>
  );
}
