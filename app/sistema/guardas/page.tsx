"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import ProtecaoModulo from "@/components/ProtecaoModulo";

type Guarda = {
  id: number;
  matricula: string;
  nome: string;
  cargo: string;
  telefone: string | null;
  status: string;
  municipio_id: number;
  data_nascimento: string | null;
  foto_url: string | null;

  cpf?: string | null;
  rg?: string | null;
  email?: string | null;
  cnh?: string | null;
  categoria_cnh?: string | null;
  validade_cnh?: string | null;
  data_admissao?: string | null;

  graduacao?: string | null;
  tipo_sanguineo?: string | null;

  contato_emergencia_nome?: string | null;
  contato_emergencia_parentesco?: string |null;
  contato_emergencia_telefone?: string | null;

  especialidades?: string[] | null;

  observacao?: string | null;
  lotacao?: string | null;
};

export default function Guardas() {
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [busca, setBusca] = useState("");

  const [matricula, setMatricula] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [email, setEmail] = useState("");
  const [cnh, setCnh] = useState("");
  const [categoriaCnh, setCategoriaCnh] = useState("");
  const [validadeCnh, setValidadeCnh] = useState("");
  const [dataAdmissao, setDataAdmissao] = useState("");
  const [status, setStatus] = useState("Em serviço");
  const [dataNascimento, setDataNascimento] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoUrl, setFotoUrl] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [graduacao, setGraduacao] = useState("");
const [tipoSanguineo, setTipoSanguineo] = useState("");
const [contatoEmergenciaNome, setContatoEmergenciaNome] = useState("");
const [contatoEmergenciaParentesco, setContatoEmergenciaParentesco] = useState("");
const [contatoEmergenciaTelefone, setContatoEmergenciaTelefone] = useState("");
const [observacao, setObservacao] = useState("");
const [lotacao, setLotacao] = useState("");
const [especialidades, setEspecialidades] = useState<string[]>([]);
  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : null;

const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";
const municipioId = usuarioLogado?.municipio_id;

const podeEditar = perfilUsuario !== "CONSULTA";

  async function carregarGuardas() {
    setCarregando(true);

const { data, error } = await supabase
  .from("guardas")
  .select("*")
  .eq("municipio_id", municipioId)
  .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar guardas.");
      setCarregando(false);
      return;
    }

    setGuardas(data || []);
    setCarregando(false);
  }

  async function salvarGuarda() {
    if (!municipioId) {
  alert("Município não identificado.");
  return;
}
    let urlFoto = fotoUrl;

if (foto) {
  console.log("FOTO SELECIONADA:", foto);
  const nomeArquivo = `${Date.now()}-${foto.name}`;

  const { error: uploadError } = await supabase.storage
    .from("fotos-guardas")
    .upload(nomeArquivo, foto);

  if (uploadError) {
    console.error(uploadError);
    alert("Erro ao enviar foto.");
    return;
  }

  const { data } = supabase.storage
    .from("fotos-guardas")
    .getPublicUrl(nomeArquivo);

  urlFoto = data.publicUrl;
  console.log("URL DA FOTO:", urlFoto);
}
if (editandoId) {
  const { error } = await supabase
    .from("guardas")
    .update({
  matricula,
  nome,
  cargo,
  telefone,
  status,
  cpf,
  rg,
  email,
  cnh,
  graduacao,
tipo_sanguineo: tipoSanguineo,
contato_emergencia_nome: contatoEmergenciaNome,
contato_emergencia_parentesco: contatoEmergenciaParentesco,
contato_emergencia_telefone: contatoEmergenciaTelefone,
especialidades,
  categoria_cnh: categoriaCnh,
  validade_cnh: validadeCnh || null,
  data_admissao: dataAdmissao || null,
  data_nascimento: dataNascimento || null,
  foto_url: urlFoto,
  observacao,
  lotacao,
})
    .eq("id", editandoId)
.eq("municipio_id", municipioId);

  if (error) {
    console.error(error);
    alert("Erro ao atualizar guarda.");
    return;
  }

  alert("Guarda atualizado com sucesso!");

  limparFormulario();
  carregarGuardas();
  return;
}

  if (!podeEditar) {
    alert("Você não possui permissão para cadastrar guardas.");
    return;
  }
    if (!matricula || !nome || !cargo) {
      alert("Preencha matrícula, nome e cargo.");
      return;
    }

    const { error } = await supabase.from("guardas").insert([
      {
  municipio_id: municipioId,
  matricula,
  nome,
  cargo,
  telefone,
  status,
  cpf,
  rg,
  email,
  cnh,
  graduacao,
tipo_sanguineo: tipoSanguineo,
contato_emergencia_nome: contatoEmergenciaNome,
contato_emergencia_parentesco: contatoEmergenciaParentesco,
contato_emergencia_telefone: contatoEmergenciaTelefone,
especialidades,
  categoria_cnh: categoriaCnh,
  validade_cnh: validadeCnh || null,
  data_admissao: dataAdmissao || null,
  data_nascimento: dataNascimento || null,
  foto_url: urlFoto,
  observacao,
  lotacao,
}
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao cadastrar guarda.");
      return;
    }

    alert("Guarda cadastrado com sucesso!");

    limparFormulario();

    carregarGuardas();
  }
function editarGuarda(guarda: Guarda) {

if (!podeEditar) {
  alert("Você não possui permissão para editar guardas.");
  return;
}

if (!municipioId || guarda.municipio_id !== municipioId) {
  alert("Guarda não pertence ao município atual.");
  return;
}

  setEditandoId(guarda.id);
  setMatricula(guarda.matricula);
  setNome(guarda.nome);
  setCargo(guarda.cargo);
  setTelefone(guarda.telefone || "");
  setStatus(guarda.status);
  setDataNascimento(guarda.data_nascimento || "");
  setFotoUrl(guarda.foto_url || "");
  setFoto(null);
  setCpf(guarda.cpf || "");
setRg(guarda.rg || "");
setEmail(guarda.email || "");
setCnh(guarda.cnh || "");
setCategoriaCnh(guarda.categoria_cnh || "");
setValidadeCnh(guarda.validade_cnh || "");
setDataAdmissao(guarda.data_admissao || "");
setGraduacao(guarda.graduacao || "");
setTipoSanguineo(guarda.tipo_sanguineo || "");
setContatoEmergenciaNome(guarda.contato_emergencia_nome || "");
setContatoEmergenciaParentesco(guarda.contato_emergencia_parentesco || "");
setContatoEmergenciaTelefone(guarda.contato_emergencia_telefone || "");
setEspecialidades(guarda.especialidades || []);
setObservacao(guarda.observacao || "");
}

  async function excluirGuarda(id: number) {
    if (!municipioId) {
  alert("Município não identificado.");
  return;
}
    if (!podeEditar) {
      alert("Você não possui permissão para excluir guardas.");
      return;
    }

    const confirmar = confirm("Tem certeza que deseja excluir este guarda?");

    if (!confirmar) return;

    const { error } = await supabase
  .from("guardas")
  .delete()
  .eq("id", id)
  .eq("municipio_id", municipioId);

    if (error) {
      console.error(error);
      alert("Erro ao excluir guarda.");
      return;
    }

    alert("Guarda excluído com sucesso.");
    carregarGuardas();
  }

  useEffect(() => {
    carregarGuardas();
  }, []);

  const guardasFiltrados = guardas.filter((guarda) => {
    const texto = `
      ${guarda.matricula}
      ${guarda.nome}
      ${guarda.cargo}
      ${guarda.telefone || ""}
      ${guarda.status}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

function limparFormulario() {
  setEditandoId(null);
  setMatricula("");
  setNome("");
  setCargo("");
  setTelefone("");
  setStatus("Em serviço");
  setDataNascimento("");
  setFoto(null);
  setFotoUrl("");
  setCpf("");
  setRg("");
  setEmail("");
  setCnh("");
  setGraduacao("");
setTipoSanguineo("");
setContatoEmergenciaNome("");
setContatoEmergenciaParentesco("");
setContatoEmergenciaTelefone("");
setEspecialidades([]);
  setCategoriaCnh("");
  setValidadeCnh("");
  setDataAdmissao("");
  setObservacao("");
  }

function formatarData(data: string | null) {
  if (!data) return "-";

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarCPF(valor: string) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarTelefone(valor: string) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function formatarCNH(valor: string) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11);
}

function formatarRG(valor: string) {
  return valor
    .replace(/[^0-9A-Za-z]/g, "")
    .slice(0, 20);
}

  return (
  <ProtecaoModulo modulo="guardas">
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Guardas</h1>

        <p className="text-slate-400 text-sm md:text-base">
          Cadastro e controle do efetivo da GCM Biritinga.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Efetivo total" valor={guardas.length} />

        <Card
          titulo="Em serviço"
          valor={guardas.filter((g) => g.status === "Em serviço").length}
        />

        <Card
          titulo="Folga"
          valor={guardas.filter((g) => g.status === "Folga").length}
        />

        <Card
          titulo="Férias"
          valor={guardas.filter((g) => g.status === "Férias").length}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {podeEditar && (
  <div className="card">
    <h2 className="text-xl md:text-2xl font-bold mb-4">
      Cadastrar Guarda
    </h2>

          <div className="space-y-4">
            <div>

<h3 className="text-lg font-bold text-[#C9A227] border-b border-[#C9A227]/40 pb-2 mb-4">
  👤 Dados Pessoais
</h3>

              <label className="label">Matrícula</label>
              <input
                className="input"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="Ex: GCM-001"
              />
            </div>

            <div>
              <label className="label">Nome completo</label>
              <input
                className="input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do guarda"
              />
            </div>

            <div>
  <label className="label">Graduação</label>

  <select
    className="input"
    value={graduacao}
    onChange={(e) => setGraduacao(e.target.value)}
  >
    <option value="">Selecione</option>
    <option>Guarda Municipal</option>
    <option>Guarda Classe Distinta</option>
    <option>Subinspetor</option>
    <option>Inspetor</option>
    <option>Inspetor Regional</option>
    <option>Subcomandante</option>
    <option>Comandante</option>
  </select>
</div>

            <div>
              <label className="label">Cargo / Função</label>
              <input
                className="input"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Guarda Municipal"
              />
            </div>

            <div>
  <label className="label">Lotação</label>

  <select
    className="input"
    value={lotacao}
    onChange={(e) => setLotacao(e.target.value)}
  >
    <option value="">Selecione</option>
    <option>Comando</option>
    <option>Operacional</option>
    <option>Administrativo</option>
    <option>ROMU</option>
    <option>Patrulha Escolar</option>
    <option>Maria da Penha</option>
    <option>Ambiental</option>
    <option>Trânsito</option>
    <option>Canil</option>
    <option>Motopatrulha</option>
    <option>Ciclopatrulha</option>
    <option>Defesa Civil</option>
  </select>
</div>

<h3 className="text-lg font-bold text-[#C9A227] border-b border-[#C9A227]/40 pb-2 mb-4 mt-6">
  📞 Contatos
</h3>

            <div>
              <label className="label">Telefone</label>
              <input
                className="input"
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                placeholder="(75) 99999-9999"
              />

              <div>
  <label className="label">E-mail</label>
  <input
    className="input"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="emailpessoal@guarda.com"
  />
</div>

<h3 className="text-lg font-bold text-[#C9A227] border-b border-[#C9A227]/40 pb-2 mb-4 mt-6">
  📄 Documentação
</h3>

<div>
  <label className="label">CPF</label>
  <input
    className="input"
    value={cpf}
    onChange={(e) => setCpf(formatarCPF(e.target.value))}
    placeholder="000.000.000-00"
  />
</div>

<div>
  <label className="label">RG</label>
  <input
    className="input"
    value={rg}
    onChange={(e) => setRg(formatarRG(e.target.value))}
    placeholder="RG"
  />
</div>

<div>
  <label className="label">CNH</label>
  <input
    className="input"
    value={cnh}
    onChange={(e) => setCnh(formatarCNH(e.target.value))}
    placeholder="Número da CNH"
  />
</div>

<div>
  <label className="label">Categoria CNH</label>
  <select
    className="input"
    value={categoriaCnh}
    onChange={(e) => setCategoriaCnh(e.target.value)}
  >
    <option value="">Selecione</option>
    <option>A</option>
    <option>B</option>
    <option>AB</option>
    <option>C</option>
    <option>D</option>
    <option>E</option>
    <option>AE</option>
  </select>
</div>

<div>
  <label className="label">Validade CNH</label>
  <input
    type="date"
    className="input"
    value={validadeCnh}
    onChange={(e) => setValidadeCnh(e.target.value)}
  />
</div>

<div>
  <label className="label">Data de Admissão</label>
  <input
    type="date"
    className="input"
    value={dataAdmissao}
    onChange={(e) => setDataAdmissao(e.target.value)}
  />
</div>

            </div>

<div>
  <label className="label">Data de Nascimento</label>
  <div>

<div>
  <label className="label">Tipo Sanguíneo</label>

  <select
    className="input"
    value={tipoSanguineo}
    onChange={(e) => setTipoSanguineo(e.target.value)}
  >
    <option value="">Selecione</option>
    <option>O+</option>
    <option>O-</option>
    <option>A+</option>
    <option>A-</option>
    <option>B+</option>
    <option>B-</option>
    <option>AB+</option>
    <option>AB-</option>
  </select>
</div>

<div className="border-t border-[#C9A227]/40 pt-4 space-y-4">
  <h3 className="text-lg font-bold text-[#C9A227]">
    Contato de Emergência
  </h3>

  <div>
    <label className="label">Nome do contato</label>
    <input
      className="input"
      value={contatoEmergenciaNome}
      onChange={(e) => setContatoEmergenciaNome(e.target.value)}
      placeholder="Nome completo"
    />
  </div>

  <div>
    <label className="label">Parentesco</label>
    <input
      className="input"
      value={contatoEmergenciaParentesco}
      onChange={(e) => setContatoEmergenciaParentesco(e.target.value)}
      placeholder="Ex: Esposa, mãe, pai, irmão"
    />
  </div>

  <div>
    <label className="label">Telefone de emergência</label>
    <input
      className="input"
      value={contatoEmergenciaTelefone}
      maxLength={15}
      onChange={(e) =>
        setContatoEmergenciaTelefone(formatarTelefone(e.target.value))
      }
      placeholder="(75) 99999-9999"
    />
  </div>
</div>

<div className="border-t border-[#C9A227]/40 pt-4">
  <h3 className="text-lg font-bold text-[#C9A227] mb-3">
    Especialidades
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
    {[
      "ROMU",
      "Patrulha Escolar",
      "Maria da Penha",
      "Ambiental",
      "Trânsito",
      "Motopatrulha",
      "Ciclopatrulha",
      "Defesa Civil",
      "APH",
      "Drone",
      "Canil",
    ].map((item) => (
      <label key={item} className="flex items-center gap-2 text-white">
        <input
          type="checkbox"
          checked={especialidades.includes(item)}
          onChange={(e) => {
            if (e.target.checked) {
              setEspecialidades([...especialidades, item]);
            } else {
              setEspecialidades(
                especialidades.filter((e) => e !== item)
              );
            }
          }}
        />
        {item}
      </label>
    ))}
  </div>
</div>

<div className="border-t border-[#C9A227]/40 pt-4">
  <h3 className="text-lg font-bold text-[#C9A227] mb-3">
    Observações
  </h3>

  <textarea
    className="input h-28 resize-none"
    placeholder="Observações sobre o guarda..."
    value={observacao}
    onChange={(e) => setObservacao(e.target.value)}
  />
</div>

<h3 className="text-lg font-bold text-[#C9A227] border-b border-[#C9A227]/40 pb-2 mb-4 mt-6">
  📷 Identificação
</h3>

  <label className="label">Foto do Guarda</label>

  <input
    type="file"
    accept="image/*"
    className="input"
    onChange={(e) =>
      setFoto(e.target.files?.[0] || null)
    }
  />
</div>
  <input
    type="date"
    className="input"
    value={dataNascimento}
    onChange={(e) => setDataNascimento(e.target.value)}
  />
</div>

<h3 className="text-lg font-bold text-[#C9A227] border-b border-[#C9A227]/40 pb-2 mb-4 mt-6">
  🏢 Dados Funcionais
</h3>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Em serviço</option>
                <option>Folga</option>
                <option>Férias</option>
                <option>Afastado</option>
              </select>
            </div>

            <button
              type="button"
              onClick={salvarGuarda}
              className="btn-primary w-full text-lg"
            >
              {editandoId ? "Atualizar Guarda" : "Salvar Guarda"}
            </button>
          </div>
          </div>
)}

        <div className="card xl:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Lista de Guardas
          </h2>

          <div className="mb-5">
            <label className="label">Buscar guarda</label>
            <input
              className="input"
              placeholder="Buscar por nome, matrícula, cargo ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando guardas...</p>
          ) : guardasFiltrados.length === 0 ? (
            <p className="text-slate-400">Nenhum guarda encontrado.</p>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {guardasFiltrados.map((guarda) => (
                  <div
                    key={guarda.id}
                    className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex justify-between gap-3 items-start">
                      <div>
                        <p className="text-blue-400 font-semibold">
                          {guarda.matricula}
                        </p>

                        <h3 className="text-xl font-bold">{guarda.nome}</h3>
                      </div>

                      <Status status={guarda.status} />
                    </div>

                    <div className="text-slate-300 space-y-1">
                      <p>
                        <span className="text-slate-500">Cargo: </span>
                        {guarda.cargo}
                      </p>

                      <p>
                        <span className="text-slate-500">Telefone: </span>
                        {guarda.telefone || "-"}
                      </p>
                    </div>

<Link
  href={`/sistema/guardas/${guarda.id}`}
  className="block w-full bg-green-700 hover:bg-green-800 text-white px-4 py-3 rounded-xl font-semibold text-center mb-2"
>
  👮 Dossiê do Guarda
</Link>

{podeEditar && (
  <button
    type="button"
    onClick={() => editarGuarda(guarda)}
    className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-xs mr-2"
  >
    Editar
  </button>
)}

                    <button
  type="button"
  onClick={() => excluirGuarda(guarda.id)}
  className="w-full bg-red-700 hover:bg-red-800 text-white px-4 py-3 rounded-xl font-semibold"
>
  Excluir
</button>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="text-left py-3">Matrícula</th>
                      <th className="text-left py-3">Nome</th>
                      <th className="text-left py-3">Cargo</th>
                      <th className="text-left py-3">Telefone</th>
                      <th className="text-left py-3">Nascimento</th>
                      <th className="text-left py-3">Status</th>
                      <th className="text-right py-3">Ações</th>
                    </tr>
                  </thead>

                  
                    <tbody>{guardasFiltrados.map((guarda) => (
                      <tr key={guarda.id} className="border-b border-slate-800">
                        <td className="py-4 text-blue-400 font-semibold">
  {guarda.matricula}
</td>

<td>
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-700 bg-slate-800">
      {guarda.foto_url ? (
        <img
          src={guarda.foto_url}
          alt={guarda.nome}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          👮
        </div>
      )}
    </div>

    <span className="font-medium">
      {guarda.nome}
    </span>
  </div>
</td>

                        <td className="text-slate-400">{guarda.cargo}</td>

                        <td className="text-slate-400">
                          {guarda.telefone || "-"}
                        </td>

<td className="text-slate-400">
  {formatarData(guarda.data_nascimento)}
</td>

                        <td>
                          <Status status={guarda.status} />
                        </td>

                        <td className="text-right">
  <Link
    href={`/sistema/guardas/${guarda.id}`}
    className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg text-xs mr-2 inline-block"
  >
    👮 Dossiê
  </Link>

  {podeEditar && (
    <>
      <button
        type="button"
        onClick={() => editarGuarda(guarda)}
        className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-xs mr-2"
      >
        Editar
      </button>

      <button
        type="button"
        onClick={() => excluirGuarda(guarda.id)}
        className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-xs"
      >
        Excluir
      </button>
    </>
  )}
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
  </ProtecaoModulo>
);
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">{titulo}</p>
      <h2 className="text-5xl md:text-4xl font-bold">{valor}</h2>
    </div>
  );
}

function Status({ status }: { status: string }) {
  let cor = "bg-green-700 text-green-100";

  if (status === "Folga") cor = "bg-yellow-600 text-yellow-100";
  if (status === "Férias") cor = "bg-blue-700 text-blue-100";
  if (status === "Afastado") cor = "bg-red-700 text-red-100";

  return (
    <span className={`${cor} px-3 py-2 rounded text-xs inline-block`}>
      {status}
    </span>
  );
}