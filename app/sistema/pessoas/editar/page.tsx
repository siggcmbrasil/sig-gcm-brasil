"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, UserPen } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function EditarPessoaPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id;

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarPessoa();
  }, []);

  async function carregarPessoa() {
    const { data, error } = await supabase
      .from("pessoas")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert("Erro ao carregar pessoa.");
      return;
    }

    setNome(data.nome || "");
    setCpf(data.cpf || "");
    setRg(data.rg || "");
    setTelefone(data.telefone || "");
    setEndereco(data.endereco || "");
    setObservacoes(data.observacoes || "");
  }

  async function salvar() {
    setSalvando(true);

    const { error } = await supabase
      .from("pessoas")
      .update({
        nome,
        cpf,
        rg,
        telefone,
        endereco,
        observacoes,
      })
      .eq("id", id);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Pessoas",
      acao: "EDITAR",
      descricao: `Atualizou os dados de ${nome}.`,
    });

    alert("Pessoa atualizada com sucesso.");
    router.push("/sistema/pessoas");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Editar Pessoa"
        subtitulo="Atualize os dados da pessoa."
        icone={UserPen}
      />

      <SigCard>
        <div className="grid md:grid-cols-2 gap-4">

          <input
            className="input md:col-span-2"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome"
          />

          <input
            className="input"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="CPF"
          />

          <input
            className="input"
            value={rg}
            onChange={(e) => setRg(e.target.value)}
            placeholder="RG"
          />

          <input
            className="input"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Telefone"
          />

          <input
            className="input"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Endereço"
          />

          <textarea
            className="input md:col-span-2 min-h-32"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observações"
          />
        </div>

        <button
          onClick={salvar}
          disabled={salvando}
          className="btn-primary mt-6"
        >
          <Save className="w-5 h-5" />
          {salvando ? "Salvando..." : "Salvar Alterações"}
        </button>
      </SigCard>
    </div>
  );
}