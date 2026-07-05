"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Package,
  PlusCircle,
  Search,
  FileText,
  Shield,
  Eye,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

type OcorrenciaObjeto = {
  id: number;
  protocolo: string;
  data: string;
  tipo: string;
  armas_objetos: string | null;
};

type ObjetoApreendido = {
  ocorrencia_id: number;
  protocolo: string;
  data: string;
  tipo_ocorrencia: string;
  categoria: string;
  subcategoria: string;
  descricao: string;
  marca: string;
  modelo: string;
  numeracao: string;
  quantidade: string;
  situacao: string;
  procedencia: string;
};

function obterUsuarioLogado(): UsuarioLogado | null {
  try {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) return null;

    const usuario = JSON.parse(salvo);

    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) {
      return null;
    }

    return {
      id: String(usuario.id),
      perfil: usuario.perfil,
      municipio_id: Number(usuario.municipio_id),
    };
  } catch {
    return null;
  }
}

export default function ObjetosApreendidosPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [objetos, setObjetos] = useState<ObjetoApreendido[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarObjetos() {
    setCarregando(true);
    setErro("");

    const usuarioAtual = obterUsuarioLogado();

    if (!usuarioAtual) {
      setErro("Sessão inválida. Faça login novamente.");
      setCarregando(false);
      return;
    }

    setUsuario(usuarioAtual);

    await registrarAuditoria({
      modulo: "Objetos Apreendidos",
      acao: "ACESSO",
      descricao: "Acessou a página de objetos apreendidos.",
      tabela: "ocorrencias",
      detalhes: {
        municipio_id: usuarioAtual.municipio_id,
        usuario_id: usuarioAtual.id,
        perfil: usuarioAtual.perfil,
      },
    });

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("id, protocolo, data, tipo, armas_objetos")
      .eq("municipio_id", usuarioAtual.municipio_id)
      .not("armas_objetos", "is", null)
      .order("data", { ascending: false })
      .limit(100);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Objetos Apreendidos",
        acao: "ERRO",
        descricao: "Erro ao carregar objetos apreendidos.",
        tabela: "ocorrencias",
        detalhes: {
          erro: error.message,
          municipio_id: usuarioAtual.municipio_id,
        },
      });

      setErro("Erro ao carregar objetos apreendidos.");
      setCarregando(false);
      return;
    }

    const lista: ObjetoApreendido[] = [];

    (data as OcorrenciaObjeto[] | null)?.forEach((ocorrencia) => {
      try {
        const itens = JSON.parse(ocorrencia.armas_objetos || "[]");

        if (!Array.isArray(itens)) return;

        itens.forEach((item) => {
          if (
            !item?.categoria &&
            !item?.descricao &&
            !item?.numeracao
          ) {
            return;
          }

          lista.push({
            ocorrencia_id: ocorrencia.id,
            protocolo: ocorrencia.protocolo,
            data: ocorrencia.data,
            tipo_ocorrencia: ocorrencia.tipo,
            categoria: item.categoria || "-",
            subcategoria: item.subcategoria || "-",
            descricao: item.descricao || item.observacao || "-",
            marca: item.marca || "-",
            modelo: item.modelo || "-",
            numeracao: item.numeracao || item.imei || "-",
            quantidade: item.quantidade || "1",
            situacao: item.situacao || "-",
            procedencia: item.procedencia || "-",
          });
        });
      } catch {
        return;
      }
    });

    setObjetos(lista);
    setCarregando(false);
  }

  useEffect(() => {
    void carregarObjetos();
  }, []);

  const objetosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return objetos;

    return objetos.filter((objeto) => {
      const texto = `
        ${objeto.protocolo}
        ${objeto.categoria}
        ${objeto.subcategoria}
        ${objeto.descricao}
        ${objeto.marca}
        ${objeto.modelo}
        ${objeto.numeracao}
        ${objeto.situacao}
        ${objeto.procedencia}
      `.toLowerCase();

      return texto.includes(termo);
    });
  }, [busca, objetos]);

const totalApreendidos = objetos.filter((o) => {
  const procedencia = o.procedencia.toUpperCase();
  const situacao = o.situacao.toUpperCase();

  return (
    procedencia === "APREENDIDO" ||
    situacao === "APREENDIDO"
  );
}).length;

const totalRestituidos = objetos.filter((o) => {
  const situacao = o.situacao.toUpperCase();

  return (
    situacao === "RESTITUÍDO" ||
    situacao === "RESTITUIDO"
  );
}).length;

const totalDestruidos = objetos.filter((o) => {
  const situacao = o.situacao.toUpperCase();

  return (
    situacao === "DESTRUÍDO" ||
    situacao === "DESTRUIDO"
  );
}).length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Objetos Apreendidos"
        subtitulo="Consulta e gerenciamento de objetos vinculados às ocorrências."
        icone={Package}
      />

      {erro && (
        <SigCard>
          <p className="text-red-400 font-semibold">{erro}</p>
        </SigCard>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <div className="text-center">
            <p className="text-3xl font-black text-cyan-400">
              {objetos.length}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Objetos Cadastrados
            </p>
          </div>
        </SigCard>

        <SigCard>
          <div className="text-center">
            <p className="text-3xl font-black text-yellow-400">
              {totalApreendidos}
            </p>
            <p className="text-slate-400 text-sm mt-1">Apreendidos</p>
          </div>
        </SigCard>

        <SigCard>
          <div className="text-center">
            <p className="text-3xl font-black text-green-400">
              {totalRestituidos}
            </p>
            <p className="text-slate-400 text-sm mt-1">Restituídos</p>
          </div>
        </SigCard>

        <SigCard>
          <div className="text-center">
            <p className="text-3xl font-black text-red-400">
              {totalDestruidos}
            </p>
            <p className="text-slate-400 text-sm mt-1">Destruídos</p>
          </div>
        </SigCard>
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Pesquisar por descrição, numeração ou ocorrência..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            maxLength={80}
          />

          <SigButton>
            <Search className="w-4 h-4 mr-2" />
            Pesquisar
          </SigButton>

          <Link href="/sistema/ocorrencias/nova">
            <SigButton>
              <PlusCircle className="w-4 h-4 mr-2" />
              Nova Ocorrência
            </SigButton>
          </Link>
        </div>
      </SigCard>

      <SigCard>
        {carregando ? (
          <div className="py-20 text-center text-slate-400">
            Carregando objetos apreendidos...
          </div>
        ) : objetosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-16 h-16 text-slate-600 mb-4" />

            <h2 className="text-2xl font-black text-white">
              Nenhum objeto encontrado
            </h2>

            <p className="text-slate-400 mt-2 max-w-xl">
              Os objetos cadastrados nas ocorrências aparecerão aqui
              automaticamente.
            </p>

            <div className="flex gap-3 mt-6">
              <Link href="/sistema/ocorrencias">
                <SigButton>
                  <FileText className="w-4 h-4 mr-2" />
                  Ocorrências
                </SigButton>
              </Link>

              <Link href="/sistema/relatorios">
                <SigButton>
                  <Shield className="w-4 h-4 mr-2" />
                  Relatórios
                </SigButton>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-950/60 text-slate-400">
                <tr>
                  <th className="text-left p-4">Ocorrência</th>
                  <th className="text-left p-4">Data</th>
                  <th className="text-left p-4">Categoria</th>
                  <th className="text-left p-4">Descrição</th>
                  <th className="text-left p-4">Numeração</th>
                  <th className="text-left p-4">Qtd.</th>
                  <th className="text-left p-4">Situação</th>
                  <th className="text-right p-4">Ações</th>
                </tr>
              </thead>

              <tbody>
                {objetosFiltrados.map((objeto, index) => (
                  <tr
                    key={`${objeto.ocorrencia_id}-${index}`}
                    className="border-t border-slate-800 hover:bg-slate-900/50"
                  >
                    <td className="p-4 text-cyan-400 font-bold">
                      {objeto.protocolo}
                    </td>

                    <td className="p-4 text-slate-300">{objeto.data}</td>

                    <td className="p-4 text-slate-300">
                      {objeto.categoria}
                    </td>

                    <td className="p-4 text-slate-300">
                      <div className="font-semibold">{objeto.descricao}</div>
                      <div className="text-xs text-slate-500">
                        {objeto.marca} {objeto.modelo}
                      </div>
                    </td>

                    <td className="p-4 text-slate-300">
                      {objeto.numeracao}
                    </td>

                    <td className="p-4 text-slate-300">
                      {objeto.quantidade}
                    </td>

                    <td className="p-4 text-slate-300">
                      {objeto.situacao}
                    </td>

                    <td className="p-4">
                      <div className="flex justify-end">
                        <Link
                          href={`/sistema/ocorrencias/${objeto.ocorrencia_id}`}
                          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-cyan-700 flex items-center justify-center"
                          title="Ver ocorrência"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SigCard>
    </div>
  );
}