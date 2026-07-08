"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, UserPlus } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

export default function NovoUsuarioPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState("GUARDA");
  const [status, setStatus] = useState("PENDENTE");
  const [observacao, setObservacao] = useState("");
  const [foto, setFoto] = useState<File | null>(null);

  const [municipioId, setMunicipioId] = useState("");
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregarMunicipios();
  }, []);

  async function carregarMunicipios() {
    const { data } = await supabase
      .from("municipios")
      .select("id, nome, estado")
      .order("nome");

    setMunicipios(data || []);
  }

  function formatarCpf(valor: string) {
    let v = valor.replace(/\D/g, "").slice(0, 11);

    v = v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    setCpf(v);
  }

  function formatarTelefone(valor: string) {
    let v = valor.replace(/\D/g, "").slice(0, 11);

    v = v
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2");

    setTelefone(v);
  }

  async function enviarFoto() {
    if (!foto) return null;

    const nomeSeguro = foto.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .toLowerCase();

    const municipio =
      usuarioLogado.perfil === "DESENVOLVEDOR"
        ? municipioId || "sem-municipio"
        : usuarioLogado.municipio_id;

    const caminho = `${municipio}/${Date.now()}-${nomeSeguro}`;

    const { error } = await supabase.storage
      .from("usuarios-fotos")
      .upload(caminho, foto);

    if (error) {
      console.error(error);
      throw new Error("Erro ao enviar foto.");
    }

    const { data } = supabase.storage
      .from("usuarios-fotos")
      .getPublicUrl(caminho);

    return data.publicUrl;
  }

  async function salvarUsuario() {
    if (salvando) return;

    if (!nome.trim() || !email.trim() || !perfil) {
      alert("Preencha nome, e-mail e perfil.");
      return;
    }

    if (!senha.trim()) {
      alert("Informe uma senha inicial.");
      return;
    }

    if (senha.length < 8) {
      alert("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    if (
      usuarioLogado.perfil === "DESENVOLVEDOR" &&
      !municipioId
    ) {
      alert("Selecione o município.");
      return;
    }

    setSalvando(true);

    try {
      const { data: emailExistente } = await supabase
        .from("usuarios")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (emailExistente) {
        alert("Já existe usuário cadastrado com este e-mail.");
        setSalvando(false);
        return;
      }

      const fotoUrl = await enviarFoto();

      const resposta = await fetch("/api/criar-usuario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome.trim(),
          matricula: matricula.trim(),
          telefone,
          email: email.trim().toLowerCase(),
          cpf,
          foto_url: fotoUrl,
          cargo: cargo.trim(),
          senha,
          perfil,
          status: "PENDENTE",
          observacao,
          municipio_id:
            usuarioLogado.perfil === "DESENVOLVEDOR"
              ? Number(municipioId)
              : usuarioLogado.municipio_id,
          perfil_logado: usuarioLogado.perfil,
          municipio_logado: usuarioLogado.municipio_id,
        }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        alert(resultado.error || "Erro ao criar usuário.");
        setSalvando(false);
        return;
      }

      await registrarAuditoria({
        modulo: "Usuários",
        acao: "CRIAR",
        descricao: `Cadastrou o usuário ${nome}.`,
      });

      alert("Usuário cadastrado com sucesso. Ele ficará PENDENTE até aprovação.");
      router.push("/sistema/usuarios");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao salvar usuário.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <button
        type="button"
        onClick={() => router.push("/sistema/usuarios")}
        className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-2"
      >
        <ArrowLeft size={18} />
        Voltar para Usuários
      </button>

      <div className="painel-premium p-6">
        <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
          <UserPlus className="text-cyan-400" />
          Novo Usuário
        </h1>

        <p className="text-slate-400 mt-2">
          Cadastre um novo usuário do SIG-GCM Brasil. O acesso ficará pendente
          até aprovação administrativa.
        </p>
      </div>

      <div className="painel-premium p-6 space-y-5 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-4">
          <Campo
            label="Nome completo *"
            valor={nome}
            setValor={setNome}
            placeholder="Nome do usuário"
          />

          <Campo
            label="Matrícula"
            valor={matricula}
            setValor={setMatricula}
            placeholder="Ex: GCM-001"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">CPF</label>
            <input
              className="input"
              value={cpf}
              placeholder="000.000.000-00"
              onChange={(e) => formatarCpf(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Telefone</label>
            <input
              className="input"
              value={telefone}
              placeholder="(75) 99999-9999"
              onChange={(e) => formatarTelefone(e.target.value)}
            />
          </div>
        </div>

        <Campo
          label="Cargo/Função"
          valor={cargo}
          setValor={setCargo}
          placeholder="Ex: Guarda Municipal"
        />

        <div className="grid md:grid-cols-2 gap-4">
          <Campo
            label="E-mail de acesso *"
            valor={email}
            setValor={setEmail}
            placeholder="usuario@email.com"
          />

          <Campo
            label="Senha inicial *"
            valor={senha}
            setValor={setSenha}
            placeholder="Mínimo de 8 caracteres"
            type="password"
          />
        </div>

        <div>
          <label className="label">Foto do usuário</label>
          <input
            type="file"
            accept="image/*"
            className="input"
            onChange={(e) => setFoto(e.target.files?.[0] || null)}
          />
        </div>

        {usuarioLogado.perfil === "DESENVOLVEDOR" && (
          <div>
            <label className="label">Município *</label>
            <select
              className="input"
              value={municipioId}
              onChange={(e) => setMunicipioId(e.target.value)}
            >
              <option value="">Selecione</option>

              {municipios.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} - {m.estado}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Perfil</label>
            <select
              className="input"
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
            >
              <option>DESENVOLVEDOR</option>
              <option>ADMIN</option>
              <option>COMANDANTE</option>
              <option>DIRETOR</option>
              <option>CMT_GUARNICAO</option>
              <option>PLANTONISTA</option>
              <option>GUARDA</option>
              <option>CONSULTA</option>
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled
            >
              <option>PENDENTE</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Observação</label>
          <textarea
            className="input h-28 resize-none"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observações sobre o usuário..."
          />
        </div>

        <button
          type="button"
          onClick={salvarUsuario}
          disabled={salvando}
          className="btn-primary w-full text-lg flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Save size={20} />
          {salvando ? "Salvando..." : "Salvar Usuário"}
        </button>
      </div>
    </div>
  );
}

function Campo({
  label,
  valor,
  setValor,
  placeholder,
  type = "text",
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        type={type}
        className="input"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
    </div>
  );
}