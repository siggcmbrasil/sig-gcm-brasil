"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const mensagens = [
  {
    motivacional: "A disciplina de hoje constrói a segurança de amanhã.",
    versiculo: "Sede fortes e corajosos. Não temais, porque o Senhor vosso Deus é convosco.",
    referencia: "Josué 1:9",
  },
  {
    motivacional: "Servir e proteger é uma missão de honra.",
    versiculo: "O Senhor é a minha força e o meu escudo.",
    referencia: "Salmos 28:7",
  },
  {
    motivacional: "Grandes resultados são construídos um plantão de cada vez.",
    versiculo: "Tudo posso naquele que me fortalece.",
    referencia: "Filipenses 4:13",
  },
  {
    motivacional: "Quem protege vidas deixa um legado.",
    versiculo: "Entrega o teu caminho ao Senhor; confia nele.",
    referencia: "Salmos 37:5",
  },
  {
    motivacional: "A verdadeira liderança inspira pelo exemplo.",
    versiculo: "Não temas, porque eu sou contigo.",
    referencia: "Isaías 41:10",
  },
  {
    motivacional: "A coragem não é ausência de medo, mas a decisão de seguir em frente.",
    versiculo: "Se Deus é por nós, quem será contra nós?",
    referencia: "Romanos 8:31",
  },
  {
    motivacional: "Cada cidadão protegido é uma vitória silenciosa.",
    versiculo: "Confia no Senhor de todo o teu coração.",
    referencia: "Provérbios 3:5",
  },
  {
    motivacional: "A excelência é construída nos detalhes.",
    versiculo: "O Senhor guardará a tua saída e a tua entrada.",
    referencia: "Salmos 121:8",
  },
  {
    motivacional: "Honra, disciplina e respeito são marcas dos grandes profissionais.",
    versiculo: "Tudo tem o seu tempo determinado.",
    referencia: "Eclesiastes 3:1",
  },
  {
    motivacional: "Nenhum esforço feito com propósito é em vão.",
    versiculo: "Os que esperam no Senhor renovarão as suas forças.",
    referencia: "Isaías 40:31",
  },
  {
    motivacional: "A segurança da cidade começa com o compromisso de cada agente.",
    versiculo: "O Senhor pelejará por vós.",
    referencia: "Êxodo 14:14",
  },
  {
    motivacional: "Quem serve com dedicação transforma realidades.",
    versiculo: "Bem-aventurados os pacificadores.",
    referencia: "Mateus 5:9",
  },
  {
    motivacional: "Grandes missões exigem grandes responsabilidades.",
    versiculo: "Tudo quanto fizerdes, fazei-o de coração.",
    referencia: "Colossenses 3:23",
  },
  {
    motivacional: "Persistência vence obstáculos que parecem impossíveis.",
    versiculo: "Posso todas as coisas naquele que me fortalece.",
    referencia: "Filipenses 4:13",
  },
  {
    motivacional: "O exemplo arrasta mais que as palavras.",
    versiculo: "O Senhor é meu pastor e nada me faltará.",
    referencia: "Salmos 23:1",
  },
  {
    motivacional: "Quem se prepara hoje lidera amanhã.",
    versiculo: "Buscai primeiro o Reino de Deus.",
    referencia: "Mateus 6:33",
  },
  {
    motivacional: "A rotina de excelência gera resultados extraordinários.",
    versiculo: "A minha graça te basta.",
    referencia: "2 Coríntios 12:9",
  },
  {
    motivacional: "O profissionalismo fortalece a instituição.",
    versiculo: "Seja forte e corajoso.",
    referencia: "Josué 1:9",
  },
  {
    motivacional: "O sucesso é a soma de pequenas ações diárias.",
    versiculo: "O choro pode durar uma noite, mas a alegria vem pela manhã.",
    referencia: "Salmos 30:5",
  },
  {
    motivacional: "Cada plantão é uma oportunidade de fazer a diferença.",
    versiculo: "Lançando sobre Ele toda a vossa ansiedade.",
    referencia: "1 Pedro 5:7",
  },

  {
    motivacional: "Protegemos pessoas, patrimônios e sonhos.",
    versiculo: "O Senhor é bom, uma fortaleza no dia da angústia.",
    referencia: "Naum 1:7",
  },
  {
    motivacional: "A união da equipe multiplica resultados.",
    versiculo: "Onde estiverem dois ou três reunidos em meu nome.",
    referencia: "Mateus 18:20",
  },
  {
    motivacional: "O respeito é conquistado pela conduta.",
    versiculo: "Andai em amor.",
    referencia: "Efésios 5:2",
  },
  {
    motivacional: "Toda missão cumprida fortalece a sociedade.",
    versiculo: "Aquele que começou boa obra em vós a aperfeiçoará.",
    referencia: "Filipenses 1:6",
  },
  {
    motivacional: "Nenhum desafio é maior que uma equipe preparada.",
    versiculo: "O Senhor firma os passos do homem.",
    referencia: "Salmos 37:23",
  },

  /* Continue até 50 */

  {
    motivacional: "O compromisso com a população é a essência da Guarda Municipal.",
    versiculo: "A paz de Deus guardará os vossos corações.",
    referencia: "Filipenses 4:7",
  },
  {
    motivacional: "A dedicação diária constrói uma instituição forte.",
    versiculo: "O Senhor é a minha luz e a minha salvação.",
    referencia: "Salmos 27:1",
  },
  {
    motivacional: "Cada turno concluído é uma missão honrada.",
    versiculo: "Entrega as tuas obras ao Senhor.",
    referencia: "Provérbios 16:3",
  },
  {
    motivacional: "A verdadeira força está no caráter.",
    versiculo: "Em paz me deito e logo adormeço.",
    referencia: "Salmos 4:8",
  },
  {
    motivacional: "Servir à comunidade é um privilégio e uma responsabilidade.",
    versiculo: "O Senhor te abençoe e te guarde.",
    referencia: "Números 6:24",
  }
];

const hoje = new Date();

const indice =
  hoje.getFullYear() +
  hoje.getMonth() +
  hoje.getDate();

const fraseDoDia = mensagens[indice % mensagens.length];

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
    municipio_id: usuarioSistema.municipio_id || 1,
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
  <BandeiraImagem
    src="/bandeira-brasil.png"
    titulo="Brasil"
  />

  <BandeiraImagem
    src="/bandeira-bahia.png"
    titulo="Bahia"
  />

  <BandeiraImagem
    src="/brasao-biritinga.png"
    titulo="Biritinga"
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