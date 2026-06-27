"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BotaoAcao from "@/components/BotaoAcao";
import { Pencil, Trash2 } from "lucide-react";
import {
  formatarCPF,
  formatarTelefone,
  formatarCEP,
  formatarRG,
  formatarCNH,
} from "@/lib/formatadores";

type Pessoa = {
  id: number;
  nome: string;
  documento: string | null;
  nascimento: string | null;
  endereco: string | null;
  local: string;
  data: string;
  hora: string;
  guarda: string | null;
  observacao: string | null;
  tipo_documento: string | null;
  telefone: string | null;
  cep: string | null;
  cidade: string | null;
  uf: string | null;
  bairro: string | null;
  numero: string | null;
  profissao: string | null;
  foto_url: string | null;
};

export default function PessoasAbordadas() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [endereco, setEndereco] = useState("");
  const [local, setLocal] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [guarda, setGuarda] = useState("");
  const [observacao, setObservacao] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("CPF");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [bairro, setBairro] = useState("");
  const [numero, setNumero] = useState("");
  const [profissao, setProfissao] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoUrl, setFotoUrl] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [carregando, setCarregando] = useState(true);
  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";

const podeEditar = perfilUsuario !== "CONSULTA";

  async function carregarPessoas() {
    setCarregando(true);

    const { data, error } = await supabase
  .from("pessoas_abordadas")
  .select("*")
  .eq("municipio_id", usuarioLogado.municipio_id)
  .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar pessoas.");
      setCarregando(false);
      return;
    }

    setPessoas(data || []);
    setCarregando(false);
  }

  async function consultarPessoa(documento: string) {
  const { data } = await supabase
    .from("pessoas_abordadas")
    .select("*")
    .eq("documento", documento)
    .eq("municipio_id", usuarioLogado.municipio_id)
    .limit(1)
    .maybeSingle();

  if (!data) return;

  setNome(data.nome || "");
  setNascimento(data.nascimento || "");
  setTelefone(data.telefone || "");
  setEndereco(data.endereco || "");
  setCep(data.cep || "");
  setCidade(data.cidade || "");
  setUf(data.uf || "");
  setBairro(data.bairro || "");
  setNumero(data.numero || "");
  setProfissao(data.profissao || "");
  setObservacao(data.observacao || "");
  setFotoUrl(data.foto_url || "");
  setTipoDocumento(data.tipo_documento || "CPF");
}

  async function salvarPessoa() {

    if (!nome.trim()) {
  alert("Nome é obrigatório.");
  return;
}

if (!documento.trim()) {
  alert("Documento é obrigatório.");
  return;
}

if (!nascimento) {
  alert("Data de nascimento é obrigatória.");
  return;
}

if (!data) {
  alert("Data da abordagem é obrigatória.");
  return;
}

if (!hora) {
  alert("Hora da abordagem é obrigatória.");
  return;
}

let urlFoto = fotoUrl;

if (foto) {
  const nomeArquivo = `${Date.now()}-${foto.name}`;

  const { error: uploadError } = await supabase.storage
    .from("fotos-pessoas")
    .upload(nomeArquivo, foto);

  if (uploadError) {
    console.error(uploadError);
    alert("Erro ao enviar foto.");
    return;
  }

  const { data } = supabase.storage
    .from("fotos-pessoas")
    .getPublicUrl(nomeArquivo);

  urlFoto = data.publicUrl;
}

    if (!podeEditar) {
      alert("Você não possui permissão para alterar dados da pessoa.");
      return;
    }

    if (editandoId) {
  const { error } = await supabase
    .from("pessoas_abordadas")
    .update({
      nome,
      tipo_documento: tipoDocumento,
      documento,
      telefone,
      nascimento: nascimento || null,
      cep,
      endereco,
      numero,
      bairro,
      cidade,
      uf,
      profissao,
      local,
      data: data || null,
      hora: hora || null,
      guarda,
      foto_url: urlFoto,
      observacao,
    })
    .eq("id", editandoId)
    .eq("municipio_id", usuarioLogado.municipio_id);

  if (error) {
    console.error(error);
    alert("Erro ao atualizar pessoa.");
    return;
  }

  alert("Pessoa atualizada com sucesso!");
  setEditandoId(null);

setNome("");
setTipoDocumento("CPF");
setDocumento("");
setTelefone("");
setNascimento("");

setCep("");
setEndereco("");
setNumero("");
setBairro("");
setCidade("");
setUf("");

setProfissao("");
setFoto(null);
setFotoUrl("");

setLocal("");
setData("");
setHora("");
setGuarda("");
setObservacao("");
  carregarPessoas();
  return;
}

    const { error } = await supabase.from("pessoas_abordadas").insert([
  {
  municipio_id: usuarioLogado.municipio_id,
  nome,
  tipo_documento: tipoDocumento,
  documento,
  telefone,
  nascimento: nascimento || null,

  cep,
  endereco,
  numero,
  bairro,
  cidade,
  uf,

  profissao,

  local,
  data,
  hora,
  guarda,

  foto_url: urlFoto,

  observacao,
},
]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar abordagem.");
      return;
    }

    alert("Pessoa registrada com sucesso!");

   setNome("");
setTipoDocumento("CPF");
setDocumento("");
setTelefone("");
setNascimento("");

setCep("");
setEndereco("");
setNumero("");
setBairro("");
setCidade("");
setUf("");

setProfissao("");
setFoto(null);
setFotoUrl("");

setLocal("");
setData("");
setHora("");
setGuarda("");
setObservacao("");

    carregarPessoas();
  }

  function editarPessoa(pessoa: Pessoa) {
  if (!podeEditar) {
    alert("Você não possui permissão para editar registros.");
    return;
  }

  setEditandoId(pessoa.id);
  setNome(pessoa.nome || "");
  setTipoDocumento(pessoa.tipo_documento || "CPF");
  setDocumento(pessoa.documento || "");
  setTelefone(pessoa.telefone || "");
  setNascimento(pessoa.nascimento || "");

  setCep(pessoa.cep || "");
  setEndereco(pessoa.endereco || "");
  setNumero(pessoa.numero || "");
  setBairro(pessoa.bairro || "");
  setCidade(pessoa.cidade || "");
  setUf(pessoa.uf || "");

  setProfissao(pessoa.profissao || "");
  setFotoUrl(pessoa.foto_url || "");

  setLocal(pessoa.local || "");
  setData(pessoa.data || "");
  setHora(pessoa.hora || "");
  setGuarda(pessoa.guarda || "");
  setObservacao(pessoa.observacao || "");
}

  async function excluirPessoa(id: number) {
  if (!podeEditar) {
    alert("Você não possui permissão para excluir registros.");
    return;
  }
    const confirmar = confirm("Deseja excluir este registro?");

    if (!confirmar) return;

    const { error } = await supabase
  .from("pessoas_abordadas")
  .delete()
  .eq("id", id)
  .eq("municipio_id", usuarioLogado.municipio_id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir registro.");
      return;
    }

    carregarPessoas();
  }

  useEffect(() => {
    carregarPessoas();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];

  const pessoasFiltradas = pessoas.filter((pessoa) => {
    const texto = `
      ${pessoa.nome}
      ${pessoa.documento || ""}
      ${pessoa.endereco || ""}
      ${pessoa.local}
      ${pessoa.data}
      ${pessoa.hora}
      ${pessoa.guarda || ""}
      ${pessoa.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });
 
async function buscarCEP(cepInformado: string) {
  const cepLimpo = cepInformado.replace(/\D/g, "");

  if (cepLimpo.length !== 8) return;

  try {
    const resposta = await fetch(
      `https://viacep.com.br/ws/${cepLimpo}/json/`
    );

    const dados = await resposta.json();

    if (dados.erro) return;

    setEndereco(dados.logradouro || "");
    setBairro(dados.bairro || "");
    setCidade(dados.localidade || "");
    setUf(dados.uf || "");
  } catch (error) {
    console.error("Erro ao consultar CEP:", error);
  }
}

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Pessoas Abordadas
        </h1>

        <p className="text-slate-400 text-sm md:text-base">
          Registro de abordagens realizadas pela Guarda Municipal.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Total" valor={pessoas.length} />

        <Card
          titulo="Hoje"
          valor={pessoas.filter((p) => p.data === hoje).length}
        />

        <Card
          titulo="Com documento"
          valor={pessoas.filter((p) => p.documento).length}
        />

        <Card
          titulo="Sem documento"
          valor={pessoas.filter((p) => !p.documento).length}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {podeEditar && (
  <div className="card">
    <h2 className="text-xl md:text-2xl font-bold mb-4">
      Nova Abordagem
    </h2>

          <div className="space-y-4">
            <Campo
              label="Nome completo"
              valor={nome}
              setValor={setNome}
              placeholder="Nome da pessoa"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

  <div>
    <label className="label">Tipo do Documento</label>

    <select
      className="input"
      value={tipoDocumento}
      onChange={(e) => setTipoDocumento(e.target.value)}
    >
      <option value="CPF">CPF</option>
      <option value="RG">RG</option>
      <option value="CNH">CNH</option>
      <option value="PASSAPORTE">Passaporte</option>
      <option value="OUTRO">Outro</option>
    </select>
  </div>

  <div className="md:col-span-2">
  <label className="label">Documento</label>

  <input
    className="input"
    value={documento}
    placeholder="Número do documento"
    onChange={(e) => {
      const valor = e.target.value;

      let documentoFormatado = valor;

      if (tipoDocumento === "CPF") {
        documentoFormatado = formatarCPF(valor);
      } else if (tipoDocumento === "RG") {
        documentoFormatado = formatarRG(valor);
      } else if (tipoDocumento === "CNH") {
        documentoFormatado = formatarCNH(valor);
      }

      setDocumento(documentoFormatado);

      if (
        (tipoDocumento === "CPF" &&
          documentoFormatado.length === 14) ||
        (tipoDocumento === "RG" &&
          documentoFormatado.length >= 7) ||
        (tipoDocumento === "CNH" &&
          documentoFormatado.length === 11)
      ) {
        consultarPessoa(documentoFormatado);
      }
    }}
  />
</div>

<div>
  <label className="label">Telefone</label>

  <input
    className="input"
    placeholder="(75) 99999-9999"
    value={telefone}
    maxLength={15}
    onChange={(e) =>
      setTelefone(
        formatarTelefone(e.target.value)
      )
    }
  />
</div>

<div>
  <label className="label">Profissão</label>

  <input
    className="input"
    value={profissao}
    onChange={(e) => setProfissao(e.target.value)}
    placeholder="Profissão"
  />
</div>

<div>
  <label className="label">CEP</label>

  <input
    className="input"
    value={cep}
    maxLength={9}
    placeholder="00000-000"
    onChange={(e) => {
  const valor = formatarCEP(e.target.value);

  setCep(valor);

  if (valor.length === 9) {
    buscarCEP(valor);
  }
}}
  />
</div>

</div>

            <div>
              <label className="label">Data de nascimento</label>
              <input
                type="date"
                className="input"
                value={nascimento}
                onChange={(e) => setNascimento(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

  <div className="md:col-span-2">
    <label className="label">Endereço</label>

    <input
      className="input"
      value={endereco}
      onChange={(e) => setEndereco(e.target.value)}
      placeholder="Rua, Avenida..."
    />
  </div>

  <div>
    <label className="label">Número</label>

    <input
      className="input"
      value={numero}
      maxLength={10}
      onChange={(e) => setNumero(e.target.value)}
      placeholder="123"
    />
  </div>

  <div>
    <label className="label">Bairro</label>

    <input
      className="input"
      value={bairro}
      onChange={(e) => setBairro(e.target.value)}
      placeholder="Bairro"
    />
  </div>

  <div>
    <label className="label">Cidade</label>

    <input
      className="input"
      value={cidade}
      onChange={(e) => setCidade(e.target.value)}
      placeholder="Cidade"
    />
  </div>

  <div>
    <label className="label">UF</label>

    <input
      className="input uppercase"
      maxLength={2}
      value={uf}
      onChange={(e) =>
        setUf(e.target.value.toUpperCase())
      }
      placeholder="BA"
    />
  </div>

  <div>
  <label className="label">Foto da Pessoa</label>

  <input
    type="file"
    accept="image/*"
    className="input"
    onChange={(e) =>
      setFoto(e.target.files?.[0] || null)
    }
  />
</div>

</div>

            <Campo
              label="Local da abordagem"
              valor={local}
              setValor={setLocal}
              placeholder="Ex: Praça Principal"
            />

            <div>
              <label className="label">Data</label>
              <input
                type="date"
                className="input"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Hora</label>
              <input
                type="time"
                className="input"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>

            <Campo
              label="Guarda responsável"
              valor={guarda}
              setValor={setGuarda}
              placeholder="Nome do guarda"
            />

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input h-32 resize-none"
                placeholder="Observações da abordagem"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={salvarPessoa}
              className="btn-primary w-full text-lg"
            >
              Registrar Pessoa
            </button>
          </div>
          </div>
)}

        <div className="card xl:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Pessoas Registradas
          </h2>

          <div className="mb-5">
            <label className="label">Buscar pessoa</label>
            <input
              className="input"
              placeholder="Buscar por nome, documento, local, guarda..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando pessoas...</p>
          ) : pessoasFiltradas.length === 0 ? (
            <p className="text-slate-400">Nenhuma pessoa encontrada.</p>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {pessoasFiltradas.map((pessoa) => (
                  <div
                    key={pessoa.id}
                    className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                  >
                    <div>
                      <p className="text-blue-400 font-semibold">
                        {pessoa.documento || "Sem documento"}
                      </p>

                      <div className="flex items-center gap-3">

  <div className="w-14 h-14 rounded-full overflow-hidden border border-[#C9A227] bg-slate-800 flex items-center justify-center">
    {pessoa.foto_url ? (
      <img
        src={pessoa.foto_url}
        className="w-full h-full object-cover"
      />
    ) : (
      "👤"
    )}
  </div>

  <div>
    <h3 className="text-xl font-bold">
      {pessoa.nome}
    </h3>

    <p className="text-blue-400">
      {pessoa.documento || "-"}
    </p>

    <p className="text-slate-400 text-sm">
      {pessoa.telefone || "-"}
    </p>
  </div>

</div>
                    </div>

                    <div className="text-slate-300 space-y-1">
                      
                      <p>
  <span className="text-slate-500">Telefone: </span>
  {pessoa.telefone || "-"}
</p>

<p>
  <span className="text-slate-500">Profissão: </span>
  {pessoa.profissao || "-"}
</p>
                      
                      <p>
                        <span className="text-slate-500">Nascimento: </span>
                        {pessoa.nascimento || "-"}
                      </p>

                      <p>
                        <span className="text-slate-500">Endereço: </span>
                        {pessoa.endereco || "-"}
                      </p>

                      <p>
                        <span className="text-slate-500">Local: </span>
                        {pessoa.local}
                      </p>

                      <p>
                        <span className="text-slate-500">Data/Hora: </span>
                        {pessoa.data} às {pessoa.hora}
                      </p>

                      <p>
                        <span className="text-slate-500">Guarda: </span>
                        {pessoa.guarda || "-"}
                      </p>

                      {pessoa.observacao && (
                        <p className="pt-2 text-slate-400">
                          {pessoa.observacao}
                        </p>
                      )}
                    </div>

                    {podeEditar && (
 <BotaoAcao
  title="Excluir"
  cor="red"
  onClick={() => excluirPessoa(pessoa.id)}
>
  <Trash2 size={18} />
</BotaoAcao>
)}
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-700 text-slate-400">
                    <tr>
                      <th className="text-left py-3">Nome</th>
                      <th className="text-left py-3">Documento</th>
                      <th className="text-left py-3">Local</th>
                      <th className="text-left py-3">Data</th>
                      <th className="text-left py-3">Guarda</th>
                      <th className="text-right py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pessoasFiltradas.map((pessoa) => (
                      <tr key={pessoa.id} className="border-b border-slate-800">
                        <td className="py-4">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full overflow-hidden border border-[#C9A227] bg-slate-800 flex items-center justify-center">
      {pessoa.foto_url ? (
        <img
          src={pessoa.foto_url}
          alt={pessoa.nome}
          className="w-full h-full object-cover"
        />
      ) : (
        "👤"
      )}
    </div>

    <div>
      <p className="font-semibold text-blue-400">{pessoa.nome}</p>
      <p className="text-xs text-slate-400">{pessoa.telefone || "-"}</p>
    </div>
  </div>
</td>

                        <td>{pessoa.documento || "-"}</td>

                        <td className="text-slate-400">
                          {pessoa.local}
                        </td>

                        <td>{pessoa.data}</td>

                        <td className="text-slate-400">
                          {pessoa.guarda || "-"}
                        </td>

                        <td className="text-center">
  <div className="flex items-center justify-center gap-2">

    {podeEditar && (
      <BotaoAcao
        title="Editar"
        cor="blue"
        onClick={() => editarPessoa(pessoa)}
      >
        <Pencil size={18} />
      </BotaoAcao>
    )}

    {podeEditar && (
      <BotaoAcao
        title="Excluir"
        cor="red"
        onClick={() => excluirPessoa(pessoa.id)}
      >
        <Trash2 size={18} />
      </BotaoAcao>
    )}

  </div>
</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Campo({
  label,
  valor,
  setValor,
  placeholder,
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        className="input"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
    </div>
  );
}

function Card({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">
        {titulo}
      </p>

      <h2 className="text-5xl md:text-4xl font-bold">
        {valor}
      </h2>
    </div>
  );
}