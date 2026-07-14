"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Bookmark,
  Building2,
  FileText,
  Flag,
  Gavel,
  Hash,
  Heart,
  ImagePlus,
  Loader2,
  MessageCircle,
  MessageSquareText,
  MessagesSquare,
  MoreVertical,
  Paperclip,
  Pencil,
  Pin,
  Save,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Star,
  ThumbsUp,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";

type UsuarioLocal = {
  id?: number | string;
  nome?: string;
  perfil?: string;
  municipio_id?: number;
  municipio_nome?: string;
  foto_url?: string;
};

type Post = {
  id: number;
  usuario_id: number | string | null;
  municipio_id: number;
  titulo: string | null;
  texto: string;
  imagem_url: string | null;
  arquivo_url: string | null;
  tipo_publicacao: string;
  compartilhar_brasil: boolean;
  fixado: boolean;
  status: string;
  criado_em: string;
};

type Reacao = {
  id: number;
  post_id: number;
  usuario_id: number | string;
  tipo: "CURTIR" | "APOIAR" | "IMPORTANTE";
};

type Comentario = {
  id: number;
  post_id: number;
  usuario_id: number | string;
  comentario: string;
  criado_em: string;
};

type PessoaMapa = {
  nome: string;
  foto_url?: string | null;
};

type PostSalvo = {
  id: number;
  post_id: number;
  usuario_id: number | string;
};

function lerUsuario(): UsuarioLocal {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    ) as UsuarioLocal;
  } catch {
    return {};
  }
}

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");
}

function tempoRelativo(valor: string) {
  const data = new Date(valor);
  const minutos = Math.max(
    0,
    Math.floor((Date.now() - data.getTime()) / 60000)
  );

  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;

  return data.toLocaleDateString("pt-BR");
}

function nomeArquivo(url: string) {
  try {
    return decodeURIComponent(url.split("/").pop() || "Arquivo");
  } catch {
    return "Arquivo";
  }
}

export default function FeedSIGPage() {
  const [usuario] = useState<UsuarioLocal>(() => lerUsuario());
  const [posts, setPosts] = useState<Post[]>([]);
  const [reacoes, setReacoes] = useState<Reacao[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [salvos, setSalvos] = useState<PostSalvo[]>([]);
  const [pessoas, setPessoas] = useState<Record<string, PessoaMapa>>({});
  const [texto, setTexto] = useState("");
  const [titulo, setTitulo] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<
    "TODOS" | "FIXADOS" | "IMAGENS" | "ARQUIVOS" | "BRASIL"
  >("TODOS");
  const [hashtagAtiva, setHashtagAtiva] = useState("");
  const [compartilharBrasil, setCompartilharBrasil] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [comentariosAbertos, setComentariosAbertos] = useState<Set<number>>(
    new Set()
  );
  const [comentariosTexto, setComentariosTexto] = useState<
    Record<number, string>
  >({});
  const [carregando, setCarregando] = useState(true);
  const [publicando, setPublicando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoTitulo, setEditandoTitulo] = useState("");
  const [editandoTexto, setEditandoTexto] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [apagandoId, setApagandoId] = useState<number | null>(null);
  const [menuPostAberto, setMenuPostAberto] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const inputArquivoRef = useRef<HTMLInputElement | null>(null);

  async function carregar() {
    if (!usuario.municipio_id) {
      setErro("Município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const postsResposta = await supabase
      .from("feed_sig")
      .select(
        "id,usuario_id,municipio_id,titulo,texto,imagem_url,arquivo_url,tipo_publicacao,compartilhar_brasil,fixado,status,criado_em"
      )
      .eq("municipio_id", usuario.municipio_id)
      .eq("status", "PUBLICADO")
      .order("fixado", { ascending: false })
      .order("criado_em", { ascending: false })
      .limit(100);

    if (postsResposta.error) {
      setErro(postsResposta.error.message);
      setCarregando(false);
      return;
    }

    const listaPosts = (postsResposta.data as Post[] | null) || [];
    const idsPosts = listaPosts.map((post) => post.id);
    const idsUsuarios = Array.from(
      new Set(
        listaPosts
          .map((post) => post.usuario_id)
          .filter((id): id is string | number => id !== null)
      )
    );

    const [
      reacoesResposta,
      comentariosResposta,
      salvosResposta,
      usuariosResposta,
    ] = await Promise.all([
        idsPosts.length
          ? supabase
              .from("feed_sig_reacoes")
              .select("id,post_id,usuario_id,tipo")
              .in("post_id", idsPosts)
          : Promise.resolve({ data: [], error: null }),
        idsPosts.length
          ? supabase
              .from("feed_sig_comentarios")
              .select("id,post_id,usuario_id,comentario,criado_em")
              .in("post_id", idsPosts)
              .order("criado_em", { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        idsPosts.length && usuario.id
          ? supabase
              .from("feed_sig_salvos")
              .select("id,post_id,usuario_id")
              .eq("usuario_id", usuario.id)
              .in("post_id", idsPosts)
          : Promise.resolve({ data: [], error: null }),
        idsUsuarios.length
          ? supabase
              .from("usuarios")
              .select("id,nome,foto_url")
              .in("id", idsUsuarios)
          : Promise.resolve({ data: [], error: null }),
      ]);

    const mapaPessoas: Record<string, PessoaMapa> = {};

    for (const pessoa of (usuariosResposta.data || []) as Array<{
      id: number | string;
      nome: string | null;
      foto_url?: string | null;
    }>) {
      mapaPessoas[String(pessoa.id)] = {
        nome: pessoa.nome || "Usuário",
        foto_url: pessoa.foto_url,
      };
    }

    setPosts(listaPosts);
    setReacoes((reacoesResposta.data as Reacao[] | null) || []);
    setComentarios(
      (comentariosResposta.data as Comentario[] | null) || []
    );
    setSalvos((salvosResposta.data as PostSalvo[] | null) || []);
    setPessoas(mapaPessoas);
    setCarregando(false);
  }

  useEffect(() => {
    void carregar();

    const canal = supabase
      .channel("feed-sig-social")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feed_sig" },
        () => void carregar()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feed_sig_reacoes" },
        () => void carregar()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feed_sig_comentarios" },
        () => void carregar()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function selecionarArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const selecionado = evento.target.files?.[0] || null;

    if (!selecionado) return;

    if (selecionado.size > 15 * 1024 * 1024) {
      alert("O arquivo deve ter no máximo 15 MB.");
      evento.target.value = "";
      return;
    }

    if (preview) URL.revokeObjectURL(preview);

    setArquivo(selecionado);
    setPreview(
      selecionado.type.startsWith("image/")
        ? URL.createObjectURL(selecionado)
        : ""
    );
  }

  function limparArquivo() {
    if (preview) URL.revokeObjectURL(preview);
    setArquivo(null);
    setPreview("");
    if (inputArquivoRef.current) inputArquivoRef.current.value = "";
  }

  async function enviarArquivo() {
    if (!arquivo || !usuario.municipio_id || !usuario.id) {
      return { imagem_url: null, arquivo_url: null };
    }

    const extensao = arquivo.name.split(".").pop() || "bin";
    const caminho =
      `${usuario.municipio_id}/${usuario.id}/` +
      `${Date.now()}-${crypto.randomUUID()}.${extensao}`;

    const upload = await supabase.storage
      .from("feed-sig")
      .upload(caminho, arquivo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (upload.error) throw upload.error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("feed-sig").getPublicUrl(caminho);

    return arquivo.type.startsWith("image/")
      ? { imagem_url: publicUrl, arquivo_url: null }
      : { imagem_url: null, arquivo_url: publicUrl };
  }

  async function publicar() {
    if (!usuario.id || !usuario.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    const mensagem = texto.trim();

    if (!mensagem && !arquivo) {
      alert("Digite uma mensagem ou selecione um arquivo.");
      return;
    }

    setPublicando(true);

    try {
      const urls = await enviarArquivo();

      const resposta = await supabase.from("feed_sig").insert({
        usuario_id: usuario.id,
        municipio_id: usuario.municipio_id,
        titulo: titulo.trim() || null,
        texto: mensagem,
        imagem_url: urls.imagem_url,
        arquivo_url: urls.arquivo_url,
        tipo_publicacao: arquivo
          ? arquivo.type.startsWith("image/")
            ? "IMAGEM"
            : "ARQUIVO"
          : "TEXTO",
        compartilhar_brasil: compartilharBrasil,
        status: "PUBLICADO",
      });

      if (resposta.error) throw resposta.error;

      await registrarAuditoria({
        modulo: "Feed SIG",
        acao: "PUBLICAR",
        descricao: "Publicou no Feed SIG.",
        tabela: "feed_sig",
        detalhes: {
          compartilhar_brasil: compartilharBrasil,
          possui_arquivo: Boolean(arquivo),
        },
      });

      setTexto("");
      setTitulo("");
      setCompartilharBrasil(false);
      limparArquivo();
      await carregar();
    } catch (error) {
      console.error("Erro ao publicar:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível publicar."
      );
    } finally {
      setPublicando(false);
    }
  }

  function iniciarEdicao(post: Post) {
    if (String(post.usuario_id) !== String(usuario.id)) {
      return;
    }

    setEditandoId(post.id);
    setEditandoTitulo(post.titulo || "");
    setEditandoTexto(post.texto || "");
    setMenuPostAberto(null);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEditandoTitulo("");
    setEditandoTexto("");
  }

  async function salvarEdicao(post: Post) {
    if (!usuario.id || String(post.usuario_id) !== String(usuario.id)) {
      alert("Somente o autor pode editar esta publicação.");
      return;
    }

    const novoTexto = editandoTexto.trim();

    if (!novoTexto && !post.imagem_url && !post.arquivo_url) {
      alert("A publicação precisa ter texto ou anexo.");
      return;
    }

    setSalvandoEdicao(true);

    const resposta = await supabase
      .from("feed_sig")
      .update({
        titulo: editandoTitulo.trim() || null,
        texto: novoTexto,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", post.id)
      .eq("usuario_id", usuario.id);

    if (resposta.error) {
      alert(resposta.error.message);
      setSalvandoEdicao(false);
      return;
    }

    await registrarAuditoria({
      modulo: "Feed SIG",
      acao: "EDITAR_PUBLICACAO",
      descricao: `Editou a publicação ${post.id}.`,
      tabela: "feed_sig",
      registro_id: String(post.id),
    });

    cancelarEdicao();
    await carregar();
    setSalvandoEdicao(false);
  }

  async function apagarPublicacao(post: Post) {
    if (!usuario.id || String(post.usuario_id) !== String(usuario.id)) {
      alert("Somente o autor pode apagar esta publicação.");
      return;
    }

    if (!confirm("Deseja realmente apagar esta publicação?")) {
      return;
    }

    setApagandoId(post.id);
    setMenuPostAberto(null);

    const resposta = await supabase
      .from("feed_sig")
      .delete()
      .eq("id", post.id)
      .eq("usuario_id", usuario.id);

    if (resposta.error) {
      alert(resposta.error.message);
      setApagandoId(null);
      return;
    }

    await registrarAuditoria({
      modulo: "Feed SIG",
      acao: "APAGAR_PUBLICACAO",
      descricao: `Apagou a publicação ${post.id}.`,
      tabela: "feed_sig",
      registro_id: String(post.id),
    });

    await carregar();
    setApagandoId(null);
  }

  async function alternarSalvo(postId: number) {
    if (!usuario.id || !usuario.municipio_id) {
      return;
    }

    const existente = salvos.find(
      (item) =>
        item.post_id === postId &&
        String(item.usuario_id) === String(usuario.id)
    );

    if (existente) {
      const resposta = await supabase
        .from("feed_sig_salvos")
        .delete()
        .eq("id", existente.id);

      if (resposta.error) {
        alert(resposta.error.message);
        return;
      }
    } else {
      const resposta = await supabase.from("feed_sig_salvos").insert({
        post_id: postId,
        usuario_id: usuario.id,
        municipio_id: usuario.municipio_id,
      });

      if (resposta.error) {
        alert(resposta.error.message);
        return;
      }
    }

    await carregar();
  }

  async function compartilharPublicacao(post: Post) {
    const conteudo = [
      post.titulo || "Publicação da Rede Interna SIG",
      post.texto,
      usuario.municipio_nome || "Guarda Municipal",
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.titulo || "Rede Interna SIG",
          text: conteudo,
        });
      } else {
        await navigator.clipboard.writeText(conteudo);
        alert("Publicação copiada.");
      }
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      alert("Não foi possível compartilhar a publicação.");
    }
  }

  async function denunciarPublicacao(post: Post) {
    if (!usuario.id || !usuario.municipio_id) {
      return;
    }

    const motivo = prompt(
      "Informe o motivo da denúncia desta publicação:"
    );

    if (!motivo?.trim()) {
      return;
    }

    const resposta = await supabase
      .from("feed_sig_denuncias")
      .insert({
        post_id: post.id,
        usuario_id: usuario.id,
        municipio_id: usuario.municipio_id,
        motivo: motivo.trim(),
        status: "PENDENTE",
      });

    if (resposta.error) {
      alert(resposta.error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Feed SIG",
      acao: "DENUNCIAR_PUBLICACAO",
      descricao: `Denunciou a publicação ${post.id}.`,
      tabela: "feed_sig_denuncias",
      registro_id: String(post.id),
    });

    alert("Denúncia registrada.");
    setMenuPostAberto(null);
  }

  async function alternarFixado(post: Post) {
    const perfisPermitidos = [
      "DESENVOLVEDOR",
      "ADMIN",
      "COMANDANTE",
      "DIRETOR",
    ];

    if (
      !usuario.perfil ||
      !perfisPermitidos.includes(usuario.perfil.toUpperCase())
    ) {
      alert("Seu perfil não pode fixar publicações.");
      return;
    }

    const resposta = await supabase
      .from("feed_sig")
      .update({
        fixado: !post.fixado,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", post.id)
      .eq("municipio_id", usuario.municipio_id);

    if (resposta.error) {
      alert(resposta.error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Feed SIG",
      acao: post.fixado
        ? "DESAFIXAR_PUBLICACAO"
        : "FIXAR_PUBLICACAO",
      descricao: `${
        post.fixado ? "Desafixou" : "Fixou"
      } a publicação ${post.id}.`,
      tabela: "feed_sig",
      registro_id: String(post.id),
    });

    setMenuPostAberto(null);
    await carregar();
  }

  async function reagir(postId: number, tipo: Reacao["tipo"]) {
    if (!usuario.id || !usuario.municipio_id) return;

    const existente = reacoes.find(
      (reacao) =>
        reacao.post_id === postId &&
        String(reacao.usuario_id) === String(usuario.id)
    );

    if (existente?.tipo === tipo) {
      await supabase
        .from("feed_sig_reacoes")
        .delete()
        .eq("id", existente.id);
    } else if (existente) {
      await supabase
        .from("feed_sig_reacoes")
        .update({ tipo })
        .eq("id", existente.id);
    } else {
      await supabase.from("feed_sig_reacoes").insert({
        post_id: postId,
        usuario_id: usuario.id,
        municipio_id: usuario.municipio_id,
        tipo,
      });
    }

    await carregar();
  }

  async function comentar(postId: number) {
    if (!usuario.id || !usuario.municipio_id) return;

    const comentario = (comentariosTexto[postId] || "").trim();
    if (!comentario) return;

    const resposta = await supabase
      .from("feed_sig_comentarios")
      .insert({
        post_id: postId,
        usuario_id: usuario.id,
        municipio_id: usuario.municipio_id,
        comentario,
      });

    if (resposta.error) {
      alert(resposta.error.message);
      return;
    }

    setComentariosTexto((atual) => ({ ...atual, [postId]: "" }));
    await carregar();
  }

  const hashtags = useMemo(() => {
    const contagem = new Map<string, number>();

    for (const post of posts) {
      const encontrados = `${post.titulo || ""} ${post.texto || ""}`.match(
        /#[A-Za-zÀ-ÿ0-9_]+/g
      );

      for (const hashtag of encontrados || []) {
        const chave = hashtag.toLowerCase();
        contagem.set(chave, (contagem.get(chave) || 0) + 1);
      }
    }

    return Array.from(contagem.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [posts]);

  const postsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const hashtag = hashtagAtiva.trim().toLowerCase();

    return posts.filter((post) => {
      const correspondeFiltro =
        filtro === "TODOS" ||
        (filtro === "FIXADOS" && post.fixado) ||
        (filtro === "IMAGENS" && Boolean(post.imagem_url)) ||
        (filtro === "ARQUIVOS" && Boolean(post.arquivo_url)) ||
        (filtro === "BRASIL" && post.compartilhar_brasil);

      if (!correspondeFiltro) {
        return false;
      }

      const conteudo = `${post.titulo || ""} ${post.texto || ""}`.toLowerCase();

      const correspondeBusca = !termo || conteudo.includes(termo);
      const correspondeHashtag = !hashtag || conteudo.includes(hashtag);

      return correspondeBusca && correspondeHashtag;
    });
  }, [busca, filtro, hashtagAtiva, posts]);

  const totalPosts = useMemo(() => posts.length, [posts]);

  return (
    <ProtecaoModulo modulo="feed_sig">
      <main className="sig-page">
        <div className="sig-page-content mx-auto max-w-5xl">
          <SigPageHeader
            titulo="Rede Interna SIG"
            subtitulo="Comunicação social institucional da Guarda Municipal."
            detalhe={`${usuario.municipio_nome || "Município"} • ${totalPosts} publicações`}
            icone={MessageSquareText}
            acoes={
              <>
                <Link
                  href="/sistema/feed-sig/chat"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/[0.06] px-4 text-sm font-black text-blue-300 transition hover:bg-blue-400/10"
                >
                  <MessagesSquare className="h-4 w-4" />
                  Chat
                </Link>

                <Link
                  href="/sistema/feed-sig/dashboard"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 text-sm font-black text-cyan-300 transition hover:bg-cyan-400/10"
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Link>

                <Link
                  href="/sistema/feed-sig/salvos"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-4 text-sm font-black text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300"
                >
                  <Bookmark className="h-4 w-4" />
                  Salvos
                </Link>

                {[
                  "DESENVOLVEDOR",
                  "ADMIN",
                  "COMANDANTE",
                  "DIRETOR",
                ].includes(
                  String(usuario.perfil || "").toUpperCase()
                ) ? (
                  <Link
                    href="/sistema/feed-sig/moderacao"
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 text-sm font-black text-amber-300 transition hover:bg-amber-400/10"
                  >
                    <Gavel className="h-4 w-4" />
                    Moderação
                  </Link>
                ) : null}
              </>
            }
          />

          {erro ? <div className="sig-error">{erro}</div> : null}

          <SigCard>
            <div className="flex flex-col gap-4">
              <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4">
                <Search className="h-5 w-5 shrink-0 text-cyan-300" />

                <input
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  placeholder="Pesquisar no Feed SIG..."
                  className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                />

                {busca ? (
                  <button
                    type="button"
                    onClick={() => setBusca("")}
                    className="rounded-lg p-1 text-slate-500 hover:text-white"
                    aria-label="Limpar pesquisa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  ["TODOS", "Todos"],
                  ["FIXADOS", "Fixados"],
                  ["IMAGENS", "Imagens"],
                  ["ARQUIVOS", "Arquivos"],
                  ["BRASIL", "Feed Brasil"],
                ].map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setFiltro(valor as typeof filtro)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition ${
                      filtro === valor
                        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                        : "border-slate-800 bg-slate-950/60 text-slate-500 hover:text-white"
                    }`}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>

              {hashtags.length > 0 ? (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                    <Hash className="h-4 w-4 text-cyan-300" />
                    Assuntos em destaque
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {hashtagAtiva ? (
                      <button
                        type="button"
                        onClick={() => setHashtagAtiva("")}
                        className="shrink-0 rounded-full border border-red-400/20 bg-red-400/[0.06] px-3 py-1.5 text-xs font-black text-red-300"
                      >
                        Limpar #{hashtagAtiva.replace("#", "")}
                      </button>
                    ) : null}

                    {hashtags.map(([hashtag, quantidade]) => (
                      <button
                        key={hashtag}
                        type="button"
                        onClick={() => setHashtagAtiva(hashtag)}
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-black ${
                          hashtagAtiva === hashtag
                            ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                            : "border-slate-800 bg-slate-950/60 text-slate-400"
                        }`}
                      >
                        {hashtag} · {quantidade}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </SigCard>

          <SigCard destaque>
            <div className="flex items-start gap-3">
              <Avatar
                nome={usuario.nome || "GCM"}
                foto={usuario.foto_url}
                tamanho="grande"
              />

              <div className="min-w-0 flex-1">
                <input
                  value={titulo}
                  onChange={(evento) =>
                    setTitulo(evento.target.value.slice(0, 120))
                  }
                  placeholder="Título da publicação (opcional)"
                  className="mb-3 h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 font-bold text-white outline-none placeholder:text-slate-600"
                />

                <textarea
                  value={texto}
                  onChange={(evento) =>
                    setTexto(evento.target.value.slice(0, 3000))
                  }
                  placeholder="Compartilhe uma informação, operação, aviso ou conquista..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-base leading-7 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
                />

                {arquivo ? (
                  <div className="relative mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Prévia"
                        className="max-h-80 w-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-4">
                        <FileText className="h-7 w-7 text-cyan-300" />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-white">
                            {arquivo.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={limparArquivo}
                      className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={inputArquivoRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      onChange={selecionarArquivo}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => inputArquivoRef.current?.click()}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm font-bold text-slate-300"
                    >
                      <ImagePlus className="h-4 w-4" />
                      Foto ou arquivo
                    </button>

                    <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm font-bold text-slate-300">
                      <input
                        type="checkbox"
                        checked={compartilharBrasil}
                        onChange={(evento) =>
                          setCompartilharBrasil(evento.target.checked)
                        }
                        className="accent-cyan-500"
                      />
                      <Share2 className="h-4 w-4" />
                      Compartilhar no Feed Brasil
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => void publicar()}
                    disabled={publicando || (!texto.trim() && !arquivo)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 font-black text-white hover:bg-cyan-500 disabled:opacity-50"
                  >
                    {publicando ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                    Publicar
                  </button>
                </div>
              </div>
            </div>
          </SigCard>

          <section className="space-y-5">
            {carregando ? (
              <div className="sig-loading">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
              </div>
            ) : postsFiltrados.length === 0 ? (
              <SigCard>
                <div className="py-12 text-center text-slate-500">
                  Nenhuma publicação corresponde aos filtros selecionados.
                </div>
              </SigCard>
            ) : (
              postsFiltrados.map((post) => {
                const autor =
                  pessoas[String(post.usuario_id)] ||
                  (String(post.usuario_id) === String(usuario.id)
                    ? {
                        nome: usuario.nome || "Usuário",
                        foto_url: usuario.foto_url,
                      }
                    : { nome: "Integrante da Guarda" });

                const reacoesPost = reacoes.filter(
                  (reacao) => reacao.post_id === post.id
                );
                const comentariosPost = comentarios.filter(
                  (comentario) => comentario.post_id === post.id
                );
                const minhaReacao = reacoesPost.find(
                  (reacao) =>
                    String(reacao.usuario_id) === String(usuario.id)
                );

                return (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 shadow-xl"
                  >
                    {post.fixado ? (
                      <div className="flex items-center gap-2 border-b border-amber-400/20 bg-amber-400/10 px-5 py-2 text-xs font-black uppercase text-amber-300">
                        <Star className="h-4 w-4 fill-current" />
                        Publicação fixada
                      </div>
                    ) : null}

                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <Avatar
                          nome={autor.nome}
                          foto={autor.foto_url || undefined}
                          tamanho="grande"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-black text-white">
                            {autor.nome}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {usuario.municipio_nome || "Guarda Municipal"}
                            </span>
                            <span>•</span>
                            <span>{tempoRelativo(post.criado_em)}</span>
                            {post.compartilhar_brasil ? (
                              <>
                                <span>•</span>
                                <span className="text-cyan-300">
                                  Feed Brasil
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setMenuPostAberto((atual) =>
                                  atual === post.id ? null : post.id
                                )
                              }
                              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-900 hover:text-white"
                              aria-label="Opções da publicação"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>

                            {menuPostAberto === post.id ? (
                              <div className="absolute right-0 top-11 z-20 w-52 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
                                {String(post.usuario_id) === String(usuario.id) ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => iniciarEdicao(post)}
                                      className="flex min-h-11 w-full items-center gap-3 px-4 text-sm font-bold text-slate-200 transition hover:bg-slate-900"
                                    >
                                      <Pencil className="h-4 w-4 text-cyan-300" />
                                      Editar
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => void apagarPublicacao(post)}
                                      disabled={apagandoId === post.id}
                                      className="flex min-h-11 w-full items-center gap-3 border-t border-slate-800 px-4 text-sm font-bold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                                    >
                                      {apagandoId === post.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                      Apagar
                                    </button>
                                  </>
                                ) : null}

                                {[
                                  "DESENVOLVEDOR",
                                  "ADMIN",
                                  "COMANDANTE",
                                  "DIRETOR",
                                ].includes(
                                  String(usuario.perfil || "").toUpperCase()
                                ) ? (
                                  <button
                                    type="button"
                                    onClick={() => void alternarFixado(post)}
                                    className="flex min-h-11 w-full items-center gap-3 border-t border-slate-800 px-4 text-sm font-bold text-slate-200 transition hover:bg-slate-900"
                                  >
                                    <Pin className="h-4 w-4 text-amber-300" />
                                    {post.fixado ? "Desafixar" : "Fixar no topo"}
                                  </button>
                                ) : null}

                                <button
                                  type="button"
                                  onClick={() => void compartilharPublicacao(post)}
                                  className="flex min-h-11 w-full items-center gap-3 border-t border-slate-800 px-4 text-sm font-bold text-slate-200 transition hover:bg-slate-900"
                                >
                                  <Share2 className="h-4 w-4 text-blue-300" />
                                  Compartilhar
                                </button>

                                <button
                                  type="button"
                                  onClick={() => void denunciarPublicacao(post)}
                                  className="flex min-h-11 w-full items-center gap-3 border-t border-slate-800 px-4 text-sm font-bold text-amber-300 transition hover:bg-amber-500/10"
                                >
                                  <Flag className="h-4 w-4" />
                                  Denunciar
                                </button>
                              </div>
                            ) : null}
                          </div>
                      </div>

                      {editandoId === post.id ? (
                        <div className="mt-5 space-y-3">
                          <input
                            value={editandoTitulo}
                            onChange={(evento) =>
                              setEditandoTitulo(
                                evento.target.value.slice(0, 120)
                              )
                            }
                            placeholder="Título da publicação"
                            className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 font-bold text-white outline-none focus:border-cyan-400/50"
                          />

                          <textarea
                            value={editandoTexto}
                            onChange={(evento) =>
                              setEditandoTexto(
                                evento.target.value.slice(0, 3000)
                              )
                            }
                            rows={5}
                            className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-900 p-4 text-[15px] leading-7 text-white outline-none focus:border-cyan-400/50"
                          />

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={cancelarEdicao}
                              disabled={salvandoEdicao}
                              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-700 px-4 text-sm font-bold text-slate-300 disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                              Cancelar
                            </button>

                            <button
                              type="button"
                              onClick={() => void salvarEdicao(post)}
                              disabled={salvandoEdicao}
                              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-black text-white disabled:opacity-50"
                            >
                              {salvandoEdicao ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {post.titulo ? (
                            <h2 className="mt-5 text-xl font-black text-white">
                              {post.titulo}
                            </h2>
                          ) : null}

                          {post.texto ? (
                            <p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-200">
                              {post.texto}
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>

                    {post.imagem_url ? (
                      <img
                        src={post.imagem_url}
                        alt="Imagem da publicação"
                        className="max-h-[620px] w-full bg-black object-contain"
                      />
                    ) : null}

                    {post.arquivo_url ? (
                      <a
                        href={post.arquivo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mx-5 mb-5 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4"
                      >
                        <Paperclip className="h-6 w-6 text-cyan-300" />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-white">
                            {nomeArquivo(post.arquivo_url)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Abrir anexo
                          </p>
                        </div>
                      </a>
                    ) : null}

                    <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3 text-xs text-slate-500">
                      <span>{reacoesPost.length} reações</span>
                      <button
                        type="button"
                        onClick={() =>
                          setComentariosAbertos((atual) => {
                            const novo = new Set(atual);
                            novo.has(post.id)
                              ? novo.delete(post.id)
                              : novo.add(post.id);
                            return novo;
                          })
                        }
                      >
                        {comentariosPost.length} comentários
                      </button>
                    </div>

                    <div className="grid grid-cols-4 border-t border-slate-800">
                      <AcaoReacao
                        ativo={minhaReacao?.tipo === "CURTIR"}
                        icone={Heart}
                        titulo="Curtir"
                        onClick={() => void reagir(post.id, "CURTIR")}
                      />
                      <AcaoReacao
                        ativo={minhaReacao?.tipo === "APOIAR"}
                        icone={ThumbsUp}
                        titulo="Apoiar"
                        onClick={() => void reagir(post.id, "APOIAR")}
                      />
                      <AcaoReacao
                        ativo={comentariosAbertos.has(post.id)}
                        icone={MessageCircle}
                        titulo="Comentar"
                        onClick={() =>
                          setComentariosAbertos((atual) => {
                            const novo = new Set(atual);
                            novo.has(post.id)
                              ? novo.delete(post.id)
                              : novo.add(post.id);
                            return novo;
                          })
                        }
                      />
                      <AcaoReacao
                        ativo={salvos.some(
                          (item) =>
                            item.post_id === post.id &&
                            String(item.usuario_id) === String(usuario.id)
                        )}
                        icone={Bookmark}
                        titulo="Salvar"
                        onClick={() => void alternarSalvo(post.id)}
                      />
                    </div>

                    {comentariosAbertos.has(post.id) ? (
                      <div className="border-t border-slate-800 bg-slate-950/60 p-5">
                        <div className="space-y-3">
                          {comentariosPost.map((comentario) => {
                            const autorComentario =
                              pessoas[String(comentario.usuario_id)] ||
                              (String(comentario.usuario_id) ===
                              String(usuario.id)
                                ? { nome: usuario.nome || "Usuário" }
                                : { nome: "Integrante da Guarda" });

                            return (
                              <div
                                key={comentario.id}
                                className="flex items-start gap-3"
                              >
                                <Avatar
                                  nome={autorComentario.nome}
                                  tamanho="pequeno"
                                />
                                <div className="min-w-0 flex-1 rounded-2xl bg-slate-900 p-3">
                                  <p className="text-xs font-black text-white">
                                    {autorComentario.nome}
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                                    {comentario.comentario}
                                  </p>
                                  <p className="mt-1 text-[10px] text-slate-600">
                                    {tempoRelativo(comentario.criado_em)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          <input
                            value={comentariosTexto[post.id] || ""}
                            onChange={(evento) =>
                              setComentariosTexto((atual) => ({
                                ...atual,
                                [post.id]: evento.target.value,
                              }))
                            }
                            onKeyDown={(evento) => {
                              if (evento.key === "Enter") {
                                evento.preventDefault();
                                void comentar(post.id);
                              }
                            }}
                            placeholder="Escreva um comentário..."
                            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 text-sm text-white outline-none placeholder:text-slate-600"
                          />
                          <button
                            type="button"
                            onClick={() => void comentar(post.id)}
                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-white"
                          >
                            <Send className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </section>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Avatar({
  nome,
  foto,
  tamanho,
}: {
  nome: string;
  foto?: string | null;
  tamanho: "pequeno" | "grande";
}) {
  const classe =
    tamanho === "grande" ? "h-12 w-12 text-sm" : "h-9 w-9 text-xs";

  return foto ? (
    <img
      src={foto}
      alt={nome}
      className={`${classe} shrink-0 rounded-2xl border border-cyan-400/20 object-cover`}
    />
  ) : (
    <div
      className={`${classe} flex shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 font-black text-cyan-200`}
    >
      {iniciais(nome)}
    </div>
  );
}

function AcaoReacao({
  ativo,
  icone: Icone,
  titulo,
  onClick,
}: {
  ativo: boolean;
  icone: typeof Heart;
  titulo: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 items-center justify-center gap-2 border-r border-slate-800 text-sm font-bold last:border-r-0 ${
        ativo
          ? "bg-cyan-400/10 text-cyan-300"
          : "text-slate-400 hover:bg-slate-900 hover:text-white"
      }`}
    >
      <Icone className={`h-5 w-5 ${ativo ? "fill-current" : ""}`} />
      {titulo}
    </button>
  );
}
