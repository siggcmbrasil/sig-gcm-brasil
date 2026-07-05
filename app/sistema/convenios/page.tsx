"use client";

import { useEffect, useState } from "react";
import {
  Handshake,
  Plus,
  Trash2,
  Building2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import { registrarAuditoria } from "@/lib/auditoria";

export default function ConveniosPage() {
  const [convenios, setConvenios] = useState<any[]>([]);

  const [nome, setNome] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [responsavel, setResponsavel] =
    useState("");
  const [telefone, setTelefone] =
    useState("");
  const [email, setEmail] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [status, setStatus] =
    useState("ATIVO");
  const [observacao, setObservacao] =
    useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(
          localStorage.getItem(
            "usuarioLogado"
          ) || "{}"
        )
      : {};

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    if (!usuario?.municipio_id) return;

    const { data } = await supabase
      .from("convenios")
      .select("*")
      .eq(
        "municipio_id",
        usuario.municipio_id
      )
      .order("id", {
        ascending: false,
      });

    setConvenios(data || []);
  }

  async function salvar() {
  if (!usuario?.id || !usuario?.municipio_id) {
    alert("Sessão inválida.");
    return;
  }

  if (!nome.trim()) {
      alert("Informe o convênio.");
      return;
    }

    const { error } =
      await supabase
        .from("convenios")
        .insert({
  municipio_id: usuario.municipio_id,
  nome: nome.trim(),
  instituicao: instituicao.trim() || null,
  responsavel: responsavel.trim() || null,
  telefone: telefone.trim() || null,
  email: email.trim() || null,
  data_inicio: inicio || null,
  data_fim: fim || null,
  status,
  observacao: observacao.trim() || null,
});

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Convênios",
      acao: "CRIAR",
      descricao: `Criou o convênio ${nome}.`,
    });

    setNome("");
    setInstituicao("");
    setResponsavel("");
    setTelefone("");
    setEmail("");
    setInicio("");
    setFim("");
    setStatus("ATIVO");
    setObservacao("");

    carregar();
  }

  async function excluir(
    id: number,
    nome: string
  ) {
    if (!usuario?.id || !usuario?.municipio_id) {
  alert("Sessão inválida.");
  return;
}
    if (
      !confirm(
        "Deseja excluir este convênio?"
      )
    )
      return;

    const { error } = await supabase
  .from("convenios")
  .delete()
  .eq("id", id)
  .eq("municipio_id", usuario.municipio_id);

if (error) {
  alert(error.message);
  return;
}

    await registrarAuditoria({
      modulo: "Convênios",
      acao: "EXCLUIR",
      descricao: `Excluiu o convênio ${nome}.`,
    });

    carregar();
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Convênios"
        subtitulo="Gestão de convênios e parcerias institucionais."
        icone={Handshake}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <SigCard>
          <p className="text-slate-400">
            Total
          </p>
          <h2 className="text-4xl font-black text-white">
            {convenios.length}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400">
            Ativos
          </p>
          <h2 className="text-4xl font-black text-emerald-400">
            {
              convenios.filter(
                (c) =>
                  c.status === "ATIVO"
              ).length
            }
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400">
            Inativos
          </p>
          <h2 className="text-4xl font-black text-red-400">
            {
              convenios.filter(
                (c) =>
                  c.status === "INATIVO"
              ).length
            }
          </h2>
        </SigCard>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <SigCard>
          <h2 className="text-xl font-black mb-4">
            Novo Convênio
          </h2>

          <div className="space-y-4">
            <input
              className="input"
              placeholder="Nome"
              value={nome}
              onChange={(e) =>
                setNome(
                  e.target.value
                )
              }
            />

            <input
              className="input"
              placeholder="Instituição"
              value={instituicao}
              onChange={(e) =>
                setInstituicao(
                  e.target.value
                )
              }
            />

            <input
              className="input"
              placeholder="Responsável"
              value={responsavel}
              onChange={(e) =>
                setResponsavel(
                  e.target.value
                )
              }
            />

            <input
              className="input"
              placeholder="Telefone"
              value={telefone}
              onChange={(e) =>
                setTelefone(
                  e.target.value
                )
              }
            />

            <input
              className="input"
              placeholder="E-mail"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
            />

            <input
              type="date"
              className="input"
              value={inicio}
              onChange={(e) =>
                setInicio(
                  e.target.value
                )
              }
            />

            <input
              type="date"
              className="input"
              value={fim}
              onChange={(e) =>
                setFim(
                  e.target.value
                )
              }
            />

            <select
              className="input"
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value
                )
              }
            >
              <option value="ATIVO">
                Ativo
              </option>

              <option value="INATIVO">
                Inativo
              </option>
            </select>

            <textarea
              className="input min-h-28"
              placeholder="Observações"
              value={observacao}
              onChange={(e) =>
                setObservacao(
                  e.target.value
                )
              }
            />

            <button
              onClick={salvar}
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Salvar Convênio
            </button>
          </div>
        </SigCard>

        <div className="xl:col-span-2">
          <SigCard>
            <h2 className="text-xl font-black mb-4">
              Convênios Cadastrados
            </h2>

            <div className="space-y-3">
              {convenios.map(
                (convenio) => (
                  <div
                    key={convenio.id}
                    className="border border-slate-800 rounded-2xl p-4 bg-slate-950/60"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                          <Building2
                            size={18}
                          />
                          {
                            convenio.nome
                          }
                        </h3>

                        <p className="text-slate-400">
                          {
                            convenio.instituicao
                          }
                        </p>

                        <p className="text-sm text-slate-500 mt-2">
                          Responsável:
                          {" "}
                          {
                            convenio.responsavel
                          }
                        </p>

                        <p className="text-sm text-slate-500">
                          {
                            convenio.telefone
                          }
                        </p>

                        <p className="text-sm text-slate-500">
                          {
                            convenio.email
                          }
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          excluir(
                            convenio.id,
                            convenio.nome
                          )
                        }
                        className="bg-red-700 px-3 py-2 rounded-lg text-white h-fit"
                      >
                        <Trash2
                          size={18}
                        />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </SigCard>
        </div>
      </div>
    </div>
  );
}