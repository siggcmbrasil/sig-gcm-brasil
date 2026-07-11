"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Car,
  CheckCircle,
  FileSearch,
  Hash,
  Phone,
  Search,
  ShieldAlert,
  User,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type TipoConsulta =
  | "CPF"
  | "PLACA"
  | "RENAVAM"
  | "TELEFONE";

type HistoricoConsulta = {
  id: number;
  tipo: TipoConsulta;
  consulta: string;
  motivo: string;
  resultado: string | null;
  criado_em: string | null;
};

type ResultadoConsulta = {
  tipo: TipoConsulta;
  consulta: string;
  status: string;
  mensagem: string;
};

const tiposConsulta: Array<{
  tipo: TipoConsulta;
  titulo: string;
  descricao: string;
  icone: typeof User;
  placeholder: string;
}> = [
  {
    tipo: "CPF",
    titulo: "CPF",
    descricao: "Pessoa abordada",
    icone: User,
    placeholder: "Digite o CPF",
  },
  {
    tipo: "PLACA",
    titulo: "Placa",
    descricao: "Veículo abordado",
    icone: Car,
    placeholder: "Digite a placa",
  },
  {
    tipo: "RENAVAM",
    titulo: "RENAVAM",
    descricao: "Registro do veículo",
    icone: Hash,
    placeholder: "Digite o RENAVAM",
  },
  {
    tipo: "TELEFONE",
    titulo: "Telefone",
    descricao: "Contato relacionado",
    icone: Phone,
    placeholder: "Digite o telefone",
  },
];

function obterMunicipioContexto() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const cache = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    const municipioId = Number(cache?.municipio_id);

    return Number.isSafeInteger(municipioId) &&
      municipioId > 0
      ? municipioId
      : null;
  } catch {
    return null;
  }
}

function montarUrlApi() {
  const municipioId = obterMunicipioContexto();
  const parametros = new URLSearchParams();

  if (municipioId) {
    parametros.set(
      "municipio_id",
      String(municipioId)
    );
  }

  const query = parametros.toString();

  return query
    ? `/api/consultas-operacionais?${query}`
    : "/api/consultas-operacionais";
}

async function obterToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token || null;
}

export default function ConsultasPage() {
  const [tipo, setTipo] =
    useState<TipoConsulta>("CPF");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [resultado, setResultado] =
    useState<ResultadoConsulta | null>(null);
  const [historico, setHistorico] = useState<
    HistoricoConsulta[]
  >([]);
  const [salvando, setSalvando] = useState(false);
  const [carregandoHistorico, setCarregandoHistorico] =
    useState(true);
  const [erroPagina, setErroPagina] = useState("");

  const tipoAtual = useMemo(
    () =>
      tiposConsulta.find(
        (item) => item.tipo === tipo
      ) || tiposConsulta[0],
    [tipo]
  );

  const carregarHistorico = useCallback(async () => {
    setCarregandoHistorico(true);
    setErroPagina("");

    try {
      const token = await obterToken();

      if (!token) {
        setErroPagina(
          "Sua sessão expirou. Entre novamente."
        );
        return;
      }

      const resposta = await fetch(montarUrlApi(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const retorno = await resposta
        .json()
        .catch(() => null);

      if (!resposta.ok) {
        setErroPagina(
          retorno?.erro ||
            "Não foi possível carregar as consultas."
        );
        return;
      }

      setHistorico(
        Array.isArray(retorno?.historico)
          ? retorno.historico
          : []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar histórico:",
        error
      );

      setErroPagina(
        "Não foi possível carregar as consultas."
      );
    } finally {
      setCarregandoHistorico(false);
    }
  }, []);

  useEffect(() => {
    void carregarHistorico();
  }, [carregarHistorico]);

  function aplicarMascara(
    valorDigitado: string
  ) {
    const limpo = valorDigitado
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

    if (tipo === "CPF") {
      const n = limpo
        .replace(/\D/g, "")
        .slice(0, 11);

      return n
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(
          /^(\d{3})\.(\d{3})(\d)/,
          "$1.$2.$3"
        )
        .replace(/\.(\d{3})(\d)/, ".$1-$2");
    }

    if (tipo === "TELEFONE") {
      const n = limpo
        .replace(/\D/g, "")
        .slice(0, 11);

      if (n.length <= 10) {
        return n
          .replace(/^(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{4})(\d)/, "$1-$2");
      }

      return n
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }

    if (tipo === "PLACA") {
      return limpo.slice(0, 7);
    }

    if (tipo === "RENAVAM") {
      return limpo
        .replace(/\D/g, "")
        .slice(0, 11);
    }

    return valorDigitado;
  }

  async function consultar() {
    if (!valor.trim() || !motivo.trim()) {
      alert(
        "Informe o dado da consulta e o motivo."
      );
      return;
    }

    if (motivo.trim().length < 10) {
      alert(
        "Informe um motivo mais detalhado para a consulta."
      );
      return;
    }

    if (motivo.trim().length > 500) {
      alert("Motivo muito grande.");
      return;
    }

    setSalvando(true);
    setResultado(null);
    setErroPagina("");

    try {
      const token = await obterToken();

      if (!token) {
        alert(
          "Sua sessão expirou. Entre novamente."
        );
        return;
      }

      const resposta = await fetch(montarUrlApi(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        body: JSON.stringify({
          tipo,
          consulta: valor,
          motivo: motivo.trim(),
        }),
      });

      const retorno = await resposta
        .json()
        .catch(() => null);

      if (!resposta.ok) {
        alert(
          retorno?.erro ||
            "Não foi possível registrar a consulta."
        );
        return;
      }

      const consultaSalva =
        retorno?.consulta?.consulta ||
        valor.trim().toUpperCase();

      setResultado({
        tipo,
        consulta: consultaSalva,
        status: "REGISTRADA",
        mensagem:
          "Consulta registrada com auditoria.",
      });

      setValor("");
      setMotivo("");
      await carregarHistorico();
    } catch (error) {
      console.error(
        "Erro ao registrar consulta:",
        error
      );

      alert(
        "Não foi possível registrar a consulta."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="p-4 md:p-6 pb-24 space-y-6 text-white">
      <SigPageHeader
        titulo="Consultas Operacionais"
        subtitulo="Consulta controlada de CPF, placa, RENAVAM e registros da rede SIG-GCM Brasil."
        icone={FileSearch}
      />

      {erroPagina ? (
        <SigCard>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {erroPagina}
          </div>
        </SigCard>
      ) : null}

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/30 p-4">
            <ShieldAlert className="w-9 h-9 text-cyan-400" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">
              Consulta com auditoria
            </h2>

            <p className="text-slate-400 mt-2 leading-relaxed">
              Toda consulta exige motivo e fica registrada
              com município e usuário responsável.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {tiposConsulta.map((item) => {
          const Icone = item.icone;
          const ativo = tipo === item.tipo;

          return (
            <button
              key={item.tipo}
              type="button"
              onClick={() => {
                setTipo(item.tipo);
                setValor("");
                setResultado(null);
              }}
              className={`rounded-2xl border p-5 text-left transition ${
                ativo
                  ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                  : "border-slate-800 bg-slate-950/70 hover:border-cyan-500/40"
              }`}
            >
              <Icone
                className={`w-8 h-8 mb-4 ${
                  ativo
                    ? "text-cyan-400"
                    : "text-slate-400"
                }`}
              />

              <h3 className="text-lg font-black text-white">
                {item.titulo}
              </h3>

              <p className="text-sm text-slate-400 mt-1">
                {item.descricao}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <SigCard className="xl:col-span-2">
          <h2 className="text-xl font-black text-white mb-5">
            Nova consulta
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">
                Tipo selecionado
              </label>

              <input
                className="input"
                value={tipoAtual.titulo}
                disabled
              />
            </div>

            <div>
              <label className="label">
                Dado para consulta
              </label>

              <input
                value={valor}
                onChange={(event) => {
                  setValor(
                    aplicarMascara(
                      event.target.value
                    )
                  );
                  setResultado(null);
                }}
                placeholder={tipoAtual.placeholder}
                className="input uppercase"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="label">
                Motivo da consulta
              </label>

              <textarea
                value={motivo}
                onChange={(event) =>
                  setMotivo(event.target.value)
                }
                placeholder="Ex: abordagem, ocorrência, averiguação operacional..."
                className="input min-h-28 resize-none"
                maxLength={500}
              />

              <p className="mt-1 text-right text-xs text-slate-500">
                {motivo.length}/500
              </p>
            </div>

            <button
              type="button"
              onClick={consultar}
              disabled={salvando}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-black text-slate-950 hover:bg-cyan-400 transition disabled:opacity-50"
            >
              <Search className="w-5 h-5" />

              {salvando
                ? "Registrando..."
                : "Registrar Consulta"}
            </button>
          </div>
        </SigCard>

        <SigCard>
          <h2 className="text-xl font-black text-white mb-4">
            Resultado
          </h2>

          {!resultado ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-slate-400">
              Informe o dado, registre o motivo e clique
              em consultar.
            </div>
          ) : (
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5">
              <CheckCircle className="w-10 h-10 text-cyan-400 mb-3" />

              <h3 className="text-lg font-black text-white">
                Consulta registrada
              </h3>

              <p className="text-sm text-slate-300 mt-3">
                <strong>Tipo:</strong>{" "}
                {resultado.tipo}
              </p>

              <p className="text-sm text-slate-300">
                <strong>Consulta:</strong>{" "}
                {resultado.consulta}
              </p>

              <p className="text-sm text-cyan-400 mt-4 font-bold">
                {resultado.mensagem}
              </p>
            </div>
          )}

          <div className="mt-5">
            <h3 className="font-black text-white mb-3">
              Minhas últimas consultas
            </h3>

            {carregandoHistorico ? (
              <p className="text-sm text-slate-500">
                Carregando consultas...
              </p>
            ) : (
              <div className="space-y-2">
                {historico.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nenhuma consulta recente.
                  </p>
                ) : (
                  historico.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"
                    >
                      <p className="text-sm font-black text-white">
                        {item.tipo} • {item.consulta}
                      </p>

                      <p className="text-xs text-slate-500">
                        {item.resultado ||
                          "Registrada"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </SigCard>
      </div>
    </main>
  );
}
