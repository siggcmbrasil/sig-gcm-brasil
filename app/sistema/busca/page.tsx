"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type UsuarioLogado = {
  id: number;
  nome?: string;
  perfil?: string;
  municipio_id: number;
};

type ResultadoBusca = {
  tipo: string;
  icone: string;
  titulo: string;
  detalhe: string;
  href: string;
};

export default function BuscaPage() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [termoBusca, setTermoBusca] = useState(q);
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const dados = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    ) as UsuarioLogado;

    if (!dados?.id || !dados?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    setUsuario(dados);
    setTermoBusca(q);

    if (q.trim()) {
      buscar(q, dados);
    } else {
      setResultados([]);
    }
  }, [q]);

  function limparTermo(valor: string) {
    return valor.trim().slice(0, 80);
  }

  async function buscar(termoDigitado: string, usuarioAtual?: UsuarioLogado) {
    const usuarioBusca = usuarioAtual || usuario;

    if (!usuarioBusca?.id || !usuarioBusca?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    const termoLimpo = limparTermo(termoDigitado);

    if (termoLimpo.length < 2) {
      setResultados([]);
      return;
    }

    const termoLower = termoLimpo.toLowerCase();
    const nomeUsuario = usuarioBusca?.nome?.toLowerCase().trim() || "";

    await registrarAuditoria({
      modulo: "Busca Global",
      acao: "CONSULTAR",
      descricao: `Realizou busca global por: ${termoLimpo}.`,
      tabela: "busca_global",
      detalhes: {
        usuario_id: usuarioBusca.id,
        municipio_id: usuarioBusca.municipio_id,
        termo: termoLimpo,
      },
    });

    if (termoLower === nomeUsuario) {
      router.push("/sistema/perfil");
      return;
    }

    if (
      termoLower.includes("perfil") ||
      termoLower.includes("minha foto") ||
      termoLower.includes("minha conta")
    ) {
      const { data: meuGuarda } = await supabase
        .from("guardas")
        .select("id")
        .eq("municipio_id", usuarioBusca.municipio_id)
        .ilike("nome", `%${usuarioBusca.nome || ""}%`)
        .limit(1)
        .maybeSingle();

      if (meuGuarda?.id) {
        router.push(`/sistema/guardas/${meuGuarda.id}`);
        return;
      }

      router.push("/sistema/perfil");
      return;
    }

    setCarregando(true);

    const termo = `%${termoLimpo}%`;

    try {
      const [
        guardasResp,
        ocorrenciasResp,
        viaturasResp,
        locaisResp,
      ] = await Promise.all([
        supabase
          .from("guardas")
          .select("id, nome, status")
          .eq("municipio_id", usuarioBusca.municipio_id)
          .ilike("nome", termo)
          .limit(5),

        supabase
          .from("ocorrencias")
          .select("id, protocolo, tipo, local, status")
          .eq("municipio_id", usuarioBusca.municipio_id)
          .or(`tipo.ilike.${termo},local.ilike.${termo},protocolo.ilike.${termo}`)
          .limit(5),

        supabase
          .from("viaturas")
          .select("id, prefixo, modelo, status")
          .eq("municipio_id", usuarioBusca.municipio_id)
          .or(`prefixo.ilike.${termo},modelo.ilike.${termo}`)
          .limit(5),

        supabase
          .from("locais")
          .select("id, nome, tipo")
          .eq("municipio_id", usuarioBusca.municipio_id)
          .ilike("nome", termo)
          .limit(5),
      ]);

      const erro =
        guardasResp.error ||
        ocorrenciasResp.error ||
        viaturasResp.error ||
        locaisResp.error;

      if (erro) {
        await registrarAuditoria({
          modulo: "Busca Global",
          acao: "ERRO",
          descricao: "Erro ao realizar busca global.",
          tabela: "busca_global",
          detalhes: {
            erro: erro.message,
            termo: termoLimpo,
            usuario_id: usuarioBusca.id,
            municipio_id: usuarioBusca.municipio_id,
          },
        });

        alert("Erro ao realizar busca.");
        return;
      }

      setResultados([
        ...(guardasResp.data || []).map((item) => ({
          tipo: "Guarda",
          icone: "👮",
          titulo: item.nome || "Guarda",
          detalhe: item.status || "-",
          href: `/sistema/guardas/${item.id}`,
        })),

        ...(ocorrenciasResp.data || []).map((item) => ({
          tipo: "Ocorrência",
          icone: "🚨",
          titulo: item.tipo || "Ocorrência",
          detalhe: `${item.local || "-"} • ${item.status || "-"}`,
          href: `/sistema/ocorrencias/${item.id}`,
        })),

        ...(viaturasResp.data || []).map((item) => ({
          tipo: "Viatura",
          icone: "🚓",
          titulo: item.prefixo || "Viatura",
          detalhe: `${item.modelo || "-"} • ${item.status || "-"}`,
          href: "/sistema/frota",
        })),

        ...(locaisResp.data || []).map((item) => ({
          tipo: "Local",
          icone: "📍",
          titulo: item.nome || "Local",
          detalhe: item.tipo || "Local cadastrado",
          href: "/sistema/locais",
        })),
      ]);
    } finally {
      setCarregando(false);
    }
  }

  const termoAtual = useMemo(() => limparTermo(termoBusca), [termoBusca]);

  return (
    <section className="p-4 md:p-6 pb-24 text-white space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-2xl md:text-3xl font-black">
          Busca Global
        </h1>

        <p className="text-slate-400 mt-2">
          Pesquise por guardas, ocorrências, viaturas e locais do seu município.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();

          if (termoAtual.length < 2) {
            alert("Digite pelo menos 2 caracteres.");
            return;
          }

          router.push(`/sistema/busca?q=${encodeURIComponent(termoAtual)}`);
        }}
        className="painel-premium p-4 flex flex-col md:flex-row gap-3"
      >
        <input
          className="input flex-1"
          placeholder="Digite sua pesquisa..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          maxLength={80}
        />

        <button
          type="submit"
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          <Search className="w-5 h-5" />
          Buscar
        </button>
      </form>

      {q && (
        <p className="text-slate-400">
          Resultado para: <strong className="text-white">{q}</strong>
        </p>
      )}

      {carregando ? (
        <div className="painel-premium p-6 text-slate-400">Buscando...</div>
      ) : !q ? (
        <div className="painel-premium p-6 text-slate-400">
          Digite um termo para iniciar a busca.
        </div>
      ) : resultados.length === 0 ? (
        <div className="painel-premium p-6 text-slate-400">
          Nenhum resultado encontrado.
        </div>
      ) : (
        <div className="space-y-3">
          {resultados.map((item, index) => (
            <Link
              key={`${item.tipo}-${item.href}-${index}`}
              href={item.href}
              className="painel-premium p-4 flex items-center gap-4 hover:bg-blue-950/30 transition"
            >
              <span className="text-3xl">{item.icone}</span>

              <div className="min-w-0">
                <p className="text-xs text-blue-400 font-bold uppercase">
                  {item.tipo}
                </p>

                <h2 className="font-black text-lg break-words">
                  {item.titulo}
                </h2>

                <p className="text-slate-400 text-sm break-words">
                  {item.detalhe}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}