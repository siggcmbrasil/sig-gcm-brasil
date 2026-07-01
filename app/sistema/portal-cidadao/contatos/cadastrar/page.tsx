"use client";

import { useState } from "react";
import { Save, Phone } from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

export default function CadastroContatoPage() {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("TELEFONE_UTIL");
  const [responsavel, setResponsavel] = useState("");
  const [telefoneFixo, setTelefoneFixo] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [observacao, setObservacao] = useState("");

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Cadastrar Contato"
        subtitulo="Adicionar novo telefone ou instituição."
        icone={Phone}
      />

      <SigCard>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            className="input"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <select
            className="input"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="TELEFONE_UTIL">Telefone Útil</option>
            <option value="ORGAO_PUBLICO">Órgão Público</option>
            <option value="EMERGENCIA">Emergência</option>
            <option value="PARCEIRO">Instituição Parceira</option>
            <option value="INTERNO">Contato Interno</option>
          </select>

          <input
            className="input"
            placeholder="Responsável"
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
          />

          <input
            className="input"
            placeholder="Telefone Fixo"
            value={telefoneFixo}
            onChange={(e) => setTelefoneFixo(e.target.value)}
          />

          <input
            className="input"
            placeholder="Celular"
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
          />

          <input
            className="input"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="input md:col-span-2"
            placeholder="Endereço"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
          />
        </div>

        <textarea
          className="input mt-4 min-h-[120px]"
          placeholder="Observações"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />

        <SigButton
          type="gold"
          icon={Save}
          className="mt-4"
        >
          Salvar Contato
        </SigButton>
      </SigCard>
    </div>
  );
}