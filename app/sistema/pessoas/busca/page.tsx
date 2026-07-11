"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search,
  ShieldCheck,
  UserSearch,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type Pessoa = {
  id: number;
  nome: string;
  documento: string | null;
  tipo_documento: string | null;
  telefone: string | null;
  endereco: string | null;
};

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
    ? `/api/pessoas/busca?${query}`
    : "/api/pessoas/busca";
}

export default function BuscaPessoaPage() {
  const [busca, setBusca] = useState("");
  const [motivo, setMotivo] = useState("");
  const [resultado, setResultado] = useState<
    Pessoa[]
  >([]);
  const [carregando, setCarregando] =
    useState(false);
  const [pesquisou, setPesquisou] =
    useState(false);
  const [erro, setErro] = useState("");

  async function pesquisar() {
    const termoBusca = busca.trim();
    const motivoBusca = motivo.trim();

    if (termoBusca.length < 3) {
      alert("Digite pelo menos 3 caracteres.");
      return;
    }

    if (motivoBusca.length < 10) {
      alert(
        "Informe um motivo com pelo menos 10 caracteres."
      );
      return;
    }

    setCarregando(true);
    setPesquisou(true);
    setErro("");
    setResultado([]);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        setErro(
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
          consulta: termoBusca,
          motivo: motivoBusca,
        }),
      });

      const retorno = await resposta
        .json()
        .catch(() => null);

      if (!resposta.ok) {
        setErro(
          retorno?.erro ||
            "Não foi possível realizar a pesquisa."
        );
        return;
      }

      setResultado(
        Array.isArray(retorno?.pessoas)
          ? retorno.pessoas
          : []
      );
    } catch (error) {
      console.error(
        "Erro ao pesquisar pessoas:",
        error
      );

      setErro(
        "Não foi possível realizar a pesquisa."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Pesquisa de Pessoas"
        subtitulo="Consulta segura por nome, documento ou telefone, com auditoria obrigatória."
        icone={UserSearch}
      />

      <SigCard>
        <div className="mb-5 flex items-start gap-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <div className="rounded-xl bg-cyan-500/10 p-3">
            <ShieldCheck className="h-7 w-7 text-cyan-400" />
          </div>

          <div>
            <h2 className="font-black text-white">
              Pesquisa operacional protegida
            </h2>

            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              A identidade, o município e a permissão são
              confirmados pelo servidor. A pesquisa só é
              exibida após o registro da auditoria.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">
              Nome, CPF, RG ou telefone
            </label>

            <input
              className="input"
              placeholder="Digite pelo menos 3 caracteres..."
              value={busca}
              maxLength={80}
              autoComplete="off"
              onChange={(event) =>
                setBusca(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !carregando
                ) {
                  void pesquisar();
                }
              }}
            />
          </div>

          <div>
            <label className="label">
              Motivo da consulta
            </label>

            <textarea
              className="input min-h-28 resize-none"
              placeholder="Ex: abordagem em via pública, averiguação vinculada à ocorrência..."
              value={motivo}
              maxLength={500}
              onChange={(event) =>
                setMotivo(event.target.value)
              }
            />

            <p className="mt-1 text-right text-xs text-slate-500">
              {motivo.length}/500
            </p>
          </div>

          <button
            type="button"
            onClick={pesquisar}
            disabled={carregando}
            className="btn-primary inline-flex w-full items-center justify-center gap-2 disabled:opacity-50 md:w-auto"
          >
            <Search className="h-5 w-5" />

            {carregando
              ? "Buscando..."
              : "Realizar pesquisa"}
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Toda consulta exige motivo e fica vinculada ao
          usuário, município, IP e dispositivo.
        </p>
      </SigCard>

      {erro ? (
        <SigCard>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {erro}
          </div>
        </SigCard>
      ) : null}

      <SigCard>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-white">
            Resultados
          </h2>

          {pesquisou && !carregando && !erro ? (
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-300">
              {resultado.length} encontrado(s)
            </span>
          ) : null}
        </div>

        {carregando ? (
          <p className="text-slate-400">
            Consultando registros...
          </p>
        ) : !pesquisou ? (
          <div className="py-16 text-center">
            <UserSearch className="mx-auto mb-4 h-16 w-16 text-cyan-400" />

            <h3 className="text-2xl font-black text-white">
              Realize uma pesquisa
            </h3>

            <p className="mt-2 text-slate-400">
              Digite um termo e informe o motivo da
              consulta.
            </p>
          </div>
        ) : erro ? (
          <div className="py-12 text-center text-slate-400">
            Corrija o problema informado e tente novamente.
          </div>
        ) : resultado.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-4 text-7xl">🔎</p>

            <h3 className="text-2xl font-black text-white">
              Nenhuma pessoa encontrada
            </h3>

            <p className="mt-2 text-slate-400">
              Não há registros neste município para a
              consulta informada.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resultado.map((pessoa) => (
              <Link
                key={pessoa.id}
                href={`/sistema/pessoas-abordadas/${pessoa.id}`}
                className="block rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4 transition hover:border-cyan-400/50"
              >
                <h3 className="text-lg font-black text-white">
                  {pessoa.nome}
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Documento:{" "}
                  {pessoa.documento || "Não informado"}{" "}
                  • Tipo:{" "}
                  {pessoa.tipo_documento || "N/I"} •
                  Telefone:{" "}
                  {pessoa.telefone || "Não informado"}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Endereço:{" "}
                  {pessoa.endereco || "Não informado"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}
