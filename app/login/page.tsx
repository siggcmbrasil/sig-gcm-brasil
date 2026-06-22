"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMensagemDoDia } from "@/lib/mensagensLogin";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  
const [municipioLogin, setMunicipioLogin] = useState<any>(null);

const fraseDoDia = getMensagemDoDia();

useEffect(() => {
  async function carregarMunicipioLogin() {
    const { data: config } = await supabase
      .from("configuracoes_sistema")
      .select("municipio_padrao_id")
      .limit(1)
      .single();

    let municipio = null;

if (config?.municipio_padrao_id) {
  const { data } = await supabase
    .from("municipios")
    .select("nome, estado, brasao, bandeira_municipio, bandeira_estado")
    .eq("id", config.municipio_padrao_id)
    .single();

  municipio = data;
}

    setMunicipioLogin(municipio);
  }

  carregarMunicipioLogin();
}, []);

  async function entrar() {
  if (!email || !senha) {
    alert("Digite email e senha.");
    return;
  }

  setCarregando(true);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  console.log("AUTH:", data);
console.log("ERROR:", error);

  setCarregando(false);

  if (error || !data.user) {
    alert("Usuário ou senha inválidos.");
    return;
  }

  const { data: usuarioSistema } = await supabase
    .from("usuarios")
    .select("id, nome, email, perfil, status, municipio_id, foto_url")
    .eq("email", data.user.email)
    .single();

    
  if (usuarioSistema?.perfil?.toUpperCase() === "DESENVOLVEDOR") {
  console.log("USUARIO SISTEMA:", usuarioSistema);

  const dadosUsuario = {
    id: usuarioSistema.id,
    auth_id: data.user.id,
    nome: usuarioSistema.nome || data.user.email,
    email: data.user.email,
    perfil: (usuarioSistema.perfil || "GUARDA").toUpperCase(),
    status: usuarioSistema.status || "Ativo",
    municipio_id: usuarioSistema.municipio_id,
    foto_url: usuarioSistema.foto_url || "",
  };

  console.log("SALVANDO LOCALSTORAGE:", dadosUsuario);

  localStorage.setItem(
    "usuarioLogado",
    JSON.stringify(dadosUsuario)
  );

  router.push("/sistema");
  return;
}
if (!usuarioSistema) {
  alert("Usuário não encontrado no sistema. Aguarde cadastro/aprovação.");
  await supabase.auth.signOut();
  localStorage.removeItem("usuarioLogado");
  return;
}

  if (
    usuarioSistema.status === "Pendente" ||
    usuarioSistema.status === "Inativo" ||
    usuarioSistema.status === "Bloqueado" ||
    usuarioSistema.status === "Recusado"
  ) {
    alert(`Acesso não liberado. Status atual: ${usuarioSistema.status}`);

    await supabase.auth.signOut();
    localStorage.removeItem("usuarioLogado");
    return;
  }

  localStorage.setItem(
    "usuarioLogado",
    JSON.stringify({
      id: usuarioSistema.id,
auth_id: data.user.id,
nome: usuarioSistema.nome || data.user.email,
email: data.user.email,
perfil: (usuarioSistema.perfil || "GUARDA").toUpperCase(),
status: usuarioSistema.status || "Ativo",
municipio_id: usuarioSistema.municipio_id || 1,
foto_url: usuarioSistema.foto_url || "",
    })
  );

  router.push("/sistema");
}

  return (
    <div className="min-h-screen bg-[#020b1c] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.30),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.18),transparent_28%),linear-gradient(135deg,#020814,#081d3a_45%,#020814)]" />

      <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden lg:flex flex-col justify-center px-20 py-12">
          

          <div>
            <div className="flex items-center gap-8 mb-8">
              <img
  src="/brasao-gcm-v2.png"
  alt="SIG-GCM Brasil"
  className="w-72 h-72 object-contain drop-shadow-[0_0_60px_rgba(212,175,55,0.35)] animate-[pulseGlow_4s_ease-in-out_infinite]"/>
<div>
                <h1 className="text-7xl font-black tracking-tight sig-title">
                  SIG-GCM
                </h1>

                <p className="text-yellow-400 font-black text-4xl tracking-[0.35em]">
                  BRASIL
                </p>
              </div>
            </div>
           
            <div className="mt-10 max-w-xl">
              <h2 className="text-3xl font-black leading-tight max-w-xl">
                Sistema Integrado de Gestão das Guardas Civis Municipais
              </h2>

              <p className="text-slate-300 mt-5 text-lg">
                Central operacional para ocorrências, escalas, viaturas,
                guarnições, patrulhamento, chamados e relatórios institucionais.
              </p>

              <div className="mt-8 border-l-4 border-yellow-400 pl-5">
<p className="text-yellow-300 italic text-2xl font-semibold">
  "{fraseDoDia.versiculo}"
</p>

<p className="text-yellow-500 mt-2 font-bold">
  {fraseDoDia.referencia}
</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-10">
            <MiniSelo icone="🛡️" titulo="Gestão" texto="Integrada" />
            <MiniSelo icone="🚔" titulo="Operação" texto="24h" />
            <MiniSelo icone="📊" titulo="Dados" texto="Estratégicos" />
            <MiniSelo icone="🔐" titulo="Segurança" texto="Controle" />
          </div>
        </section>

        <section className="flex items-start justify-center p-6 pt-20">
          <div className="w-full max-w-md">
            <div className="painel-premium p-8 border border-yellow-400/70 shadow-[0_0_100px_rgba(212,175,55,0.28)]">
              <div className="flex flex-col items-center text-center mb-8">
                <img
  src="/brasao-gcm-v2.png"
  alt="SIG-GCM Brasil"
  className="w-44 h-44 object-contain mb-6 animar-brasao"
/>

                <h1 className="text-6xl font-black sig-title">
  SIG-GCM
</h1>

<p className="text-yellow-400 text-3xl font-black tracking-[0.4em]">
  BRASIL
</p>

<p className="text-yellow-400 font-bold mt-4">
  Sistema Integrado das Guardas Municipais
</p>

<p className="text-slate-400 text-sm mt-2">
  Acesso restrito a usuários autorizados
</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="label">Email</label>

                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu email"
                  />
                </div>

                <div>
                  <label className="label">Senha</label>

                  <input
                    className="input"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                  />
                </div>

                <button
                  type="button"
                  onClick={entrar}
                  disabled={carregando}
                  className="sig-btn-gold w-full disabled:opacity-50"
                >
                  {carregando ? "Entrando..." : "Entrar no Sistema"}
                </button>
                <div className="text-center pt-2">
  <p className="text-sm text-slate-400">
    Ainda não possui acesso?
  </p>

  <button
    type="button"
    onClick={() => router.push("/cadastro")}
    className="text-yellow-400 hover:text-yellow-300 font-bold text-sm mt-1"
  >
    Solicitar cadastro
  </button>
</div>
              </div>

              <div className="mt-10 rounded-3xl border border-yellow-500/30 bg-slate-950/60 p-8 backdrop-blur-md animar-card">
  <div className="text-center">

<p className="text-sm text-slate-400 mb-3 font-semibold">
  {new Date().toLocaleDateString("pt-BR")}
</p>

    <p className="text-lg font-bold text-blue-300">
      🛡️ MENSAGEM DO DIA
    </p>

    <p className="mt-2 text-white italic text-base">
      "{fraseDoDia.motivacional}"
    </p>

    <div className="mt-4 border-t border-slate-700 pt-4">
      <p className="text-sm font-bold text-yellow-400">
        📖 VERSÍCULO DO DIA
      </p>

      <p className="mt-2 text-slate-200 italic text-base">
        "{fraseDoDia.versiculo}"
      </p>

      <p className="mt-2 text-sm font-bold text-yellow-500">
        {fraseDoDia.referencia}
      </p>

      <p className="mt-3 text-xs text-slate-500 italic">
  🇧🇷 Servindo e protegendo a sociedade com honra e compromisso.
</p>
    </div>

  </div>
</div>

             <div className="mt-8 grid grid-cols-3 gap-3">
  <BandeiraImagem src="/bandeira-brasil.png" titulo="Brasil" />

  <BandeiraImagem
    src={municipioLogin?.bandeira_estado || "/bandeira-bahia.png"}
    titulo={municipioLogin?.estado || "Estado"}
  />

  <BandeiraImagem
    src={municipioLogin?.bandeira_municipio || "/bandeira-biritinga.png"}
    titulo={municipioLogin?.nome || "Município"}
  />
</div>

              <div className="text-center mt-8 border-t border-slate-800 pt-5">
                <p className="text-xs text-slate-500">
                  SIG-GCM Brasil © {new Date().getFullYear()}
                </p>

                <p className="text-xs text-blue-400 font-semibold">
                  Desenvolvido por Maick Lustosa Costa
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniSelo({
  icone,
  titulo,
  texto,
}: {
  icone: string;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="painel-premium p-4 text-center border border-yellow-500/30">
      <p className="text-3xl">{icone}</p>
      <p className="text-yellow-400 font-black text-sm mt-2">{titulo}</p>
      <p className="text-slate-300 text-xs">{texto}</p>
    </div>
  );
}

function BandeiraImagem({
  src,
  titulo,
}: {
  src: string;
  titulo: string;
}) {
  return (
    <div className="bg-slate-950/70 border border-yellow-500/30 rounded-xl p-2 text-center">
      <img
        src={src}
        alt={titulo}
        className="w-full h-20 object-cover rounded-lg border border-yellow-500/30"
      />

      <p className="text-yellow-400 font-black text-xs mt-2">
        {titulo}
      </p>
    </div>
  );
}