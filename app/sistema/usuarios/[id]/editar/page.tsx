"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, UserCog } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

export default function EditarUsuarioPage() {
  const { id } = useParams();
  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [foto, setFoto] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);

    const { data: usuarioData, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (error || !usuarioData) {
      alert("Usuário não encontrado.");
      router.push("/sistema/usuarios");
      return;
    }

    setUsuario(usuarioData);

    const { data: municipiosData } = await supabase
      .from("municipios")
      .select("id, nome, estado")
      .order("nome");

    setMunicipios(municipiosData || []);
    setCarregando(false);
  }

  function alterar(campo: string, valor: any) {
    setUsuario((atual: any) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function formatarCpf(valor: string) {
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
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2");
  }

  async function enviarFoto() {
    if (!foto) return null;

    const nomeSeguro = foto.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .toLowerCase();

    const caminho = `${usuario.municipio_id || "sem-municipio"}/${usuario.id}-${Date.now()}-${nomeSeguro}`;

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

  async function salvar() {
    if (!usuario) return;
    if (salvando) return;

    if (!usuario.nome || !usuario.email || !usuario.perfil) {
      alert("Nome, email e perfil são obrigatórios.");
      return;
    }

    setSalvando(true);

    try {
      const novaFotoUrl = await enviarFoto();

      let query = supabase
        .from("usuarios")
        .update({
          nome: usuario.nome,
          matricula: usuario.matricula,
          telefone: usuario.telefone,
          cpf: usuario.cpf,
          cargo: usuario.cargo,
          email: usuario.email,
          perfil: usuario.perfil,
          status: usuario.status,
          observacao: usuario.observacao,
          municipio_id:
            usuarioLogado.perfil === "DESENVOLVEDOR"
              ? usuario.municipio_id
              : usuarioLogado.municipio_id,
          ...(novaFotoUrl ? { foto_url: novaFotoUrl } : {}),
        })
        .eq("id", usuario.id);

      if (usuarioLogado.perfil !== "DESENVOLVEDOR") {
        query = query.eq("municipio_id", usuarioLogado.municipio_id);
      }

      const { error } = await query;

      if (error) {
        console.error(error);
        alert(error.message);
        setSalvando(false);
        return;
      }

      await registrarAuditoria({
        modulo: "Usuários",
        acao: "EDITAR",
        descricao: `Atualizou o usuário ${usuario.nome}.`,
      });

      alert("Usuário atualizado com sucesso.");
      router.push(`/sistema/usuarios/${usuario.id}`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao atualizar usuário.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <div className="p-6 text-white">Carregando usuário...</div>;
  }

  if (!usuario) return null;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <button
        type="button"
        onClick={() => router.push(`/sistema/usuarios/${id}`)}
        className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-2"
      >
        <ArrowLeft size={18} />
        Voltar ao Dossiê
      </button>

      <div className="painel-premium p-6">
        <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
          <UserCog className="text-cyan-400" />
          Editar Usuário
        </h1>

        <p className="text-slate-400 mt-2">
          Atualize os dados, perfil, status e foto do usuário.
        </p>
      </div>

      <div className="painel-premium p-6 space-y-5 max-w-5xl">
        <div className="flex flex-col md:flex-row gap-6 md:items-center">
          {usuario.foto_url ? (
            <img
              src={usuario.foto_url}
              alt={usuario.nome}
              className="w-28 h-28 rounded-full object-cover border-4 border-cyan-500"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-4xl font-black text-slate-400">
              {usuario.nome?.charAt(0) || "U"}
            </div>
          )}

          <div className="flex-1">
            <label className="label">Alterar foto</label>
            <input
              type="file"
              accept="image/*"
              className="input"
              onChange={(e) => setFoto(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Campo
            label="Nome completo"
            valor={usuario.nome || ""}
            onChange={(v) => alterar("nome", v)}
          />

          <Campo
            label="Matrícula"
            valor={usuario.matricula || ""}
            onChange={(v) => alterar("matricula", v.toUpperCase())}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Campo
            label="CPF"
            valor={usuario.cpf || ""}
            onChange={(v) => alterar("cpf", formatarCpf(v))}
          />

          <Campo
            label="Telefone"
            valor={usuario.telefone || ""}
            onChange={(v) => alterar("telefone", formatarTelefone(v))}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Campo
            label="Cargo/Função"
            valor={usuario.cargo || ""}
            onChange={(v) => alterar("cargo", v)}
          />

          <Campo
            label="E-mail"
            valor={usuario.email || ""}
            onChange={(v) => alterar("email", v.toLowerCase())}
          />
        </div>

        {usuarioLogado.perfil === "DESENVOLVEDOR" && (
          <div>
            <label className="label">Município</label>
            <select
              className="input"
              value={usuario.municipio_id || ""}
              onChange={(e) => alterar("municipio_id", Number(e.target.value))}
            >
              <option value="">Sem município</option>

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
              value={usuario.perfil || "GUARDA"}
              onChange={(e) => alterar("perfil", e.target.value)}
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
              value={usuario.status || "PENDENTE"}
              onChange={(e) => alterar("status", e.target.value)}
            >
              <option>PENDENTE</option>
              <option>ATIVO</option>
              <option>INATIVO</option>
              <option>BLOQUEADO</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Observação</label>
          <textarea
            className="input h-28 resize-none"
            value={usuario.observacao || ""}
            onChange={(e) => alterar("observacao", e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="btn-primary w-full text-lg flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Save size={20} />
          {salvando ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </div>
  );
}

function Campo({
  label,
  valor,
  onChange,
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        className="input"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}