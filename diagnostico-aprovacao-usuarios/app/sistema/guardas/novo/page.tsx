"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, UserPlus, XCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import { registrarAuditoria } from "@/lib/auditoria";

function formatarCPF(valor: string) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatarTelefone(valor: string) {
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

function formatarCNH(valor: string) {
  return valor.replace(/\D/g, "").slice(0, 11);
}

function formatarRG(valor: string) {
  return valor.replace(/[^0-9A-Za-z]/g, "").slice(0, 20);
}

function calcularAnos(data?: string) {
  if (!data) return null;

  const hoje = new Date();
  const base = new Date(data);

  let anos = hoje.getFullYear() - base.getFullYear();
  const mes = hoje.getMonth() - base.getMonth();

  if (mes < 0 || (mes === 0 && hoje.getDate() < base.getDate())) {
    anos--;
  }

  return anos;
}

export default function NovoGuardaPage() {
  const router = useRouter();
  const params = useSearchParams();
  const idEditar = params.get("id");

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
  const [graduacao, setGraduacao] = useState("");
  const [tipoSanguineo, setTipoSanguineo] = useState("");
  const [lotacao, setLotacao] = useState("");
  const [contatoEmergenciaNome, setContatoEmergenciaNome] = useState("");
  const [contatoEmergenciaParentesco, setContatoEmergenciaParentesco] =
    useState("");
  const [contatoEmergenciaTelefone, setContatoEmergenciaTelefone] =
    useState("");
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [observacao, setObservacao] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoUrl, setFotoUrl] = useState("");
  const [previewFoto, setPreviewFoto] = useState("");
  const [salvando, setSalvando] = useState(false);

  const idade = calcularAnos(dataNascimento);
  const anosServico = calcularAnos(dataAdmissao);

  const cnhVencida =
    validadeCnh && new Date(validadeCnh + "T23:59:59") < new Date();

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const municipioId = usuarioLogado?.municipio_id;

  useEffect(() => {
    if (idEditar && municipioId) {
      carregarGuarda();
    }
  }, [idEditar, municipioId]);

  async function carregarGuarda() {
    if (!municipioId || !idEditar) return;

    const { data, error } = await supabase
      .from("guardas")
      .select("*")
      .eq("id", idEditar)
      .eq("municipio_id", municipioId)
      .single();

    if (error) {
      alert("Erro ao carregar guarda.");
      return;
    }

    setMatricula(data.matricula || "");
    setNome(data.nome || "");
    setCargo(data.cargo || "");
    setTelefone(data.telefone || "");
    setStatus(data.status || "Em serviço");
    setDataNascimento(data.data_nascimento || "");
    setFotoUrl(data.foto_url || "");
    setCpf(data.cpf || "");
    setRg(data.rg || "");
    setEmail(data.email || "");
    setCnh(data.cnh || "");
    setCategoriaCnh(data.categoria_cnh || "");
    setValidadeCnh(data.validade_cnh || "");
    setDataAdmissao(data.data_admissao || "");
    setGraduacao(data.graduacao || "");
    setTipoSanguineo(data.tipo_sanguineo || "");
    setContatoEmergenciaNome(data.contato_emergencia_nome || "");
    setContatoEmergenciaParentesco(data.contato_emergencia_parentesco || "");
    setContatoEmergenciaTelefone(data.contato_emergencia_telefone || "");
    setEspecialidades(data.especialidades || []);
    setObservacao(data.observacao || "");
    setLotacao(data.lotacao || "");
  }

  async function salvarGuarda() {
    if (!municipioId) {
      alert("Município não identificado.");
      return;
    }

    if (!matricula.trim() || !nome.trim() || !cargo.trim()) {
      alert("Preencha matrícula, nome e cargo.");
      return;
    }

    if (cpf && cpf.replace(/\D/g, "").length !== 11) {
      alert("CPF inválido.");
      return;
    }

    if (email && !email.includes("@")) {
      alert("E-mail inválido.");
      return;
    }

    const { data: cpfExistente } = await supabase
      .from("guardas")
      .select("id")
      .eq("municipio_id", municipioId)
      .eq("cpf", cpf.replace(/\D/g, ""))
      .neq("id", idEditar || 0)
      .maybeSingle();

    if (cpfExistente) {
      alert("Já existe um guarda cadastrado com este CPF.");
      return;
    }

    const { data: matriculaExistente } = await supabase
      .from("guardas")
      .select("id")
      .eq("municipio_id", municipioId)
      .eq("matricula", matricula.trim())
      .neq("id", idEditar || 0)
      .maybeSingle();

    if (matriculaExistente) {
      alert("Já existe um guarda com esta matrícula.");
      return;
    }

    if (email.trim()) {
      const { data: emailExistente } = await supabase
        .from("guardas")
        .select("id")
        .eq("municipio_id", municipioId)
        .eq("email", email.trim().toLowerCase())
        .neq("id", idEditar || 0)
        .maybeSingle();

      if (emailExistente) {
        alert("Já existe um guarda com este e-mail.");
        return;
      }
    }

    if (foto && foto.size > 5 * 1024 * 1024) {
      alert("A foto deve ter no máximo 5MB.");
      return;
    }

    setSalvando(true);

    let urlFoto = fotoUrl;

    if (foto) {
      const nomeArquivo = `${municipioId}/${Date.now()}-${foto.name}`;

      const { error: uploadError } = await supabase.storage
        .from("fotos-guardas")
        .upload(nomeArquivo, foto);

      if (uploadError) {
        setSalvando(false);
        alert("Erro ao enviar foto.");
        return;
      }

      const { data } = supabase.storage
        .from("fotos-guardas")
        .getPublicUrl(nomeArquivo);

      urlFoto = data.publicUrl;
    }

    const payload = {
      municipio_id: municipioId,
      matricula: matricula.trim(),
      nome: nome.trim().toUpperCase(),
      cargo: cargo.trim().toUpperCase(),
      telefone: telefone.replace(/\D/g, ""),
      status,
      cpf: cpf.replace(/\D/g, ""),
      rg: rg.trim().toUpperCase(),
      cnh: cnh.replace(/\D/g, ""),
      email: email.trim().toLowerCase(),
      graduacao: graduacao?.toUpperCase() || null,
      tipo_sanguineo: tipoSanguineo || null,
      contato_emergencia_nome: contatoEmergenciaNome.trim() || null,
      contato_emergencia_parentesco:
        contatoEmergenciaParentesco.trim() || null,
      contato_emergencia_telefone: contatoEmergenciaTelefone.replace(/\D/g, ""),
      especialidades,
      categoria_cnh: categoriaCnh || null,
      validade_cnh: validadeCnh || null,
      data_admissao: dataAdmissao || null,
      data_nascimento: dataNascimento || null,
      foto_url: urlFoto,
      observacao: observacao.trim() || null,
      lotacao: lotacao?.toUpperCase() || null,
    };

    const { data, error } = idEditar
      ? await supabase
          .from("guardas")
          .update(payload)
          .eq("id", idEditar)
          .eq("municipio_id", municipioId)
          .select()
          .single()
      : await supabase.from("guardas").insert([payload]).select().single();

    const novoId = data?.id;

    if (error) {
      setSalvando(false);
      alert(error.message);
      return;
    }

    setSalvando(false);

    await registrarAuditoria({
      modulo: "Guardas",
      acao: idEditar ? "EDITAR" : "CRIAR",
      tabela: "guardas",
      descricao: idEditar
        ? `Atualizou o cadastro do guarda ${nome}.`
        : `Cadastrou o guarda ${nome}.`,
      detalhes: {
        guarda_id: novoId,
        nome,
        matricula,
        cpf,
        graduacao,
        lotacao,
      },
    });

    alert(
      idEditar
        ? "Guarda atualizado com sucesso."
        : "Guarda cadastrado com sucesso."
    );

    if (novoId) {
      const abrir = confirm("Deseja abrir o dossiê deste guarda agora?");

      if (abrir) {
        router.push(`/sistema/guardas/${novoId}`);
        return;
      }
    }

    router.push("/sistema/guardas");
  }

  function alternarEspecialidade(item: string) {
    if (especialidades.includes(item)) {
      setEspecialidades(especialidades.filter((e) => e !== item));
    } else {
      setEspecialidades([...especialidades, item]);
    }
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="p-4 md:p-6 pb-24 space-y-6">
        <SigPageHeader
          titulo={idEditar ? "Editar Guarda" : "Novo Guarda"}
          subtitulo="Cadastro funcional completo do guarda municipal."
          icone={UserPlus}
        />

        <SigCard>
          <div className="space-y-8">
            <Bloco titulo="Dados Pessoais">
              <div className="grid md:grid-cols-2 gap-4">
                <Campo label="Matrícula">
                  <input
                    className="input"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    placeholder="Ex: GCM-001"
                  />
                </Campo>

                <Campo label="Nome completo">
                  <input
                    className="input"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome do guarda"
                  />
                </Campo>

                <Campo label="Graduação">
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
                </Campo>

                <Campo label="Cargo / Função">
                  <input
                    className="input"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ex: Guarda Municipal"
                  />
                </Campo>

                <Campo label="Lotação">
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
                </Campo>

                <Campo label="Data de Nascimento">
                  <input
                    type="date"
                    className="input"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                  />

                  {idade !== null && (
                    <p className="text-xs text-cyan-400 mt-1">
                      Idade aproximada: {idade} anos
                    </p>
                  )}
                </Campo>

                <Campo label="Tipo Sanguíneo">
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
                </Campo>
              </div>
            </Bloco>

            <Bloco titulo="Contatos">
              <div className="grid md:grid-cols-2 gap-4">
                <Campo label="Telefone">
                  <input
                    className="input"
                    value={telefone}
                    onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                    placeholder="(75) 99999-9999"
                  />
                </Campo>

                <Campo label="E-mail">
                  <input
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </Campo>
              </div>
            </Bloco>

            <Bloco titulo="Documentação">
              <div className="grid md:grid-cols-2 gap-4">
                <Campo label="CPF">
                  <input
                    className="input"
                    value={cpf}
                    onChange={(e) => setCpf(formatarCPF(e.target.value))}
                    placeholder="000.000.000-00"
                  />
                </Campo>

                <Campo label="RG">
                  <input
                    className="input"
                    value={rg}
                    onChange={(e) => setRg(formatarRG(e.target.value))}
                    placeholder="RG"
                  />
                </Campo>

                <Campo label="CNH">
                  <input
                    className="input"
                    value={cnh}
                    onChange={(e) => setCnh(formatarCNH(e.target.value))}
                    placeholder="Número da CNH"
                  />
                </Campo>

                <Campo label="Categoria CNH">
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
                </Campo>

                <Campo label="Validade CNH">
                  <input
                    type="date"
                    className="input"
                    value={validadeCnh}
                    onChange={(e) => setValidadeCnh(e.target.value)}
                  />

                  {cnhVencida && (
                    <p className="text-xs text-red-400 mt-1">
                      ⚠️ CNH vencida.
                    </p>
                  )}
                </Campo>

                <Campo label="Data de Admissão">
                  <input
                    type="date"
                    className="input"
                    value={dataAdmissao}
                    onChange={(e) => setDataAdmissao(e.target.value)}
                  />

                  {anosServico !== null && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Tempo de serviço aproximado: {anosServico} anos
                    </p>
                  )}
                </Campo>
              </div>
            </Bloco>

            <Bloco titulo="Contato de Emergência">
              <div className="grid md:grid-cols-3 gap-4">
                <Campo label="Nome do contato">
                  <input
                    className="input"
                    value={contatoEmergenciaNome}
                    onChange={(e) => setContatoEmergenciaNome(e.target.value)}
                    placeholder="Nome completo"
                  />
                </Campo>

                <Campo label="Parentesco">
                  <input
                    className="input"
                    value={contatoEmergenciaParentesco}
                    onChange={(e) => setContatoEmergenciaParentesco(e.target.value)}
                    placeholder="Ex: esposa, mãe, pai"
                  />
                </Campo>

                <Campo label="Telefone de emergência">
                  <input
                    className="input"
                    value={contatoEmergenciaTelefone}
                    onChange={(e) =>
                      setContatoEmergenciaTelefone(
                        formatarTelefone(e.target.value)
                      )
                    }
                    placeholder="(75) 99999-9999"
                  />
                </Campo>
              </div>
            </Bloco>

            <Bloco titulo="Especialidades">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  "Patrulha Rural",
                  "GOC",
                  "Videomonitoramento",
                  "Instrutor",
                  "Corregedoria",
                  "Ouvidoria",
                  "Patrulha Comunitária",
                  "Busca e Salvamento",
                  "Operador de Rádio",
                  "Patrulha Náutica",
                  "Mediação de Conflitos",
                ].map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-white"
                  >
                    <input
                      type="checkbox"
                      checked={especialidades.includes(item)}
                      onChange={() => alternarEspecialidade(item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </Bloco>

            <Bloco titulo="Identificação">
              <div className="grid md:grid-cols-2 gap-4">
                <Campo label="Foto do Guarda">
                  <input
                    type="file"
                    accept="image/*"
                    className="input"
                    onChange={(e) => {
                      const arquivo = e.target.files?.[0];

                      if (!arquivo) return;

                      setFoto(arquivo);
                      setPreviewFoto(URL.createObjectURL(arquivo));
                    }}
                  />
                </Campo>

                {(previewFoto || fotoUrl) && (
                  <div>
                    <label className="label">Foto atual</label>
                    <img
                      src={previewFoto || fotoUrl}
                      alt="Foto do guarda"
                      className="w-24 h-24 rounded-full object-cover border border-cyan-500/30"
                    />
                  </div>
                )}
              </div>
            </Bloco>

            <Bloco titulo="Dados Funcionais">
              <div className="grid md:grid-cols-2 gap-4">
                <Campo label="Status">
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
                </Campo>

                <Campo label="Observações">
                  <textarea
                    className="input min-h-28 resize-none"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Observações sobre o guarda..."
                  />
                </Campo>
              </div>
            </Bloco>

            <div className="flex flex-col md:flex-row gap-3">
              <button
                type="button"
                onClick={salvarGuarda}
                disabled={salvando}
                className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {salvando
                  ? "Salvando..."
                  : idEditar
                  ? "Atualizar Guarda"
                  : "Salvar Guarda"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/sistema/guardas")}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Cancelar
              </button>
            </div>
          </div>
        </SigCard>
      </div>
    </ProtecaoModulo>
  );
}

function Bloco({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-black text-cyan-400 border-b border-cyan-500/30 pb-2 mb-4">
        {titulo}
      </h2>

      {children}
    </section>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}