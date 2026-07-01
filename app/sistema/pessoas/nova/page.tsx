"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, UserPlus, XCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

function mascaraCPF(valor: string) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function mascaraTelefone(valor: string) {
  const n = valor.replace(/\D/g, "").slice(0, 11);

  if (n.length <= 10) {
    return n
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return n
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export default function NovaPessoaPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!nome.trim()) {
      alert("Informe o nome da pessoa.");
      return;
    }

    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("pessoas").insert({
      municipio_id: usuario.municipio_id,
      nome: nome.trim(),
      cpf: cpf.trim(),
      rg: rg.trim(),
      telefone: telefone.trim(),
      endereco: endereco.trim(),
      observacoes: observacoes.trim(),
    });

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Pessoa cadastrada com sucesso.");
    router.push("/sistema/pessoas");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Nova Pessoa"
        subtitulo="Cadastro de pessoa abordada ou vinculada a ocorrência."
        icone={UserPlus}
      />

      <SigCard>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Nome completo</label>

            <input
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome completo"
            />
          </div>

          <div>
            <label className="label">CPF</label>

            <input
              className="input"
              value={cpf}
              onChange={(e) =>
                setCpf(mascaraCPF(e.target.value))
              }
              placeholder="000.000.000-00"
            />
          </div>

          <div>
            <label className="label">RG</label>

            <input
              className="input"
              value={rg}
              onChange={(e) => setRg(e.target.value)}
              placeholder="Documento RG"
            />
          </div>

          <div>
            <label className="label">Telefone</label>

            <input
              className="input"
              value={telefone}
              onChange={(e) =>
                setTelefone(mascaraTelefone(e.target.value))
              }
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="label">Endereço</label>

            <input
              className="input"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, bairro ou referência"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Observações</label>

            <textarea
              className="input min-h-32 resize-none"
              value={observacoes}
              onChange={(e) =>
                setObservacoes(e.target.value)
              }
              placeholder="Informações adicionais..."
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mt-6">
          <button
            onClick={salvar}
            disabled={salvando}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />

            {salvando
              ? "Salvando..."
              : "Salvar Pessoa"}
          </button>

          <button
            onClick={() =>
              router.push("/sistema/central-pessoas")
            }
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Cancelar
          </button>
        </div>
      </SigCard>
    </div>
  );
}