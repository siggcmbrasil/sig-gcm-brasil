import { randomUUID } from "crypto";
import { execFile } from "child_process";
import fs from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";
import { NextRequest, NextResponse } from "next/server";

import { autenticarUsuarioApi } from "@/lib/seguranca/autenticacaoApi";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const executar = promisify(execFile);
const PERFIS_PROCESSAMENTO = new Set([
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
]);

function dividirTexto(texto: string, tamanho = 1800) {
  const partes: string[] = [];

  for (let indice = 0; indice < texto.length; indice += tamanho) {
    partes.push(texto.slice(indice, indice + tamanho));
  }

  return partes;
}

export async function POST(request: NextRequest) {
  let caminhoTemporario = "";
  let documentoId: string | number | null = null;
  let municipioIdSeguro: number | null = null;

  try {
    const autenticacao = await autenticarUsuarioApi(request);

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    const { usuario } = autenticacao;

    if (!PERFIS_PROCESSAMENTO.has(usuario.perfil)) {
      return NextResponse.json(
        { erro: "Perfil sem permissão para processar documentos." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      documento_id?: string | number;
    };

    documentoId = body.documento_id ?? null;

    if (!documentoId) {
      return NextResponse.json(
        { erro: "documento_id é obrigatório." },
        { status: 400 }
      );
    }

    let consultaDocumento = supabaseAdmin
      .from("sigia_documentos")
      .select("*")
      .eq("id", documentoId);

    if (usuario.perfil !== "DESENVOLVEDOR") {
      consultaDocumento = consultaDocumento.eq(
        "municipio_id",
        usuario.municipio_id
      );
    }

    const { data: documento, error: erroDocumento } =
      await consultaDocumento.maybeSingle();

    if (erroDocumento || !documento) {
      return NextResponse.json(
        { erro: "Documento não encontrado ou sem permissão." },
        { status: 404 }
      );
    }

    municipioIdSeguro = Number(documento.municipio_id);

    await supabaseAdmin
      .from("sigia_documentos")
      .update({
        status: "PROCESSANDO",
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", documentoId)
      .eq("municipio_id", municipioIdSeguro);

    const { data: arquivo, error: erroDownload } =
      await supabaseAdmin.storage
        .from("sigia-documentos")
        .download(String(documento.arquivo_url));

    if (erroDownload || !arquivo) {
      throw new Error("Não foi possível baixar o documento.");
    }

    if (arquivo.size > 25 * 1024 * 1024) {
      throw new Error("O PDF ultrapassa o limite de 25 MB.");
    }

    caminhoTemporario = path.join(tmpdir(), `${randomUUID()}.pdf`);
    await fs.writeFile(
      caminhoTemporario,
      Buffer.from(await arquivo.arrayBuffer())
    );

    const script = path.join(
      process.cwd(),
      "scripts",
      "sigia_extract_pdf.py"
    );

    const { stdout } = await executar(
      "python3",
      [script, caminhoTemporario],
      {
        timeout: 120000,
        maxBuffer: 20 * 1024 * 1024,
      }
    );

    const resultado = JSON.parse(stdout) as {
      paginas?: Array<{ pagina: number; texto: string }>;
    };
    const paginas = resultado.paginas || [];

    if (paginas.length === 0) {
      throw new Error("Nenhum texto foi encontrado no PDF.");
    }

    await supabaseAdmin
      .from("sigia_conhecimento")
      .delete()
      .eq("documento_id", documentoId)
      .eq("municipio_id", municipioIdSeguro);

    const registros = paginas.flatMap((pagina) =>
      dividirTexto(String(pagina.texto || ""))
        .map((conteudo, indice) => ({ conteudo, indice }))
        .filter(({ conteudo }) => conteudo.trim())
        .map(({ conteudo, indice }) => ({
          documento_id: documentoId,
          titulo: documento.titulo,
          conteudo,
          categoria: documento.categoria,
          municipio_id: municipioIdSeguro,
          visibilidade: documento.visibilidade || "MUNICIPIO",
          nivel_acesso: documento.nivel_acesso || 40,
          origem: "PDF",
          status: "ATIVO",
          pagina: pagina.pagina,
          numero_trecho: indice + 1,
          palavras: conteudo.split(/\s+/).filter(Boolean).length,
        }))
    );

    if (registros.length === 0) {
      throw new Error("PDF sem conteúdo válido para salvar.");
    }

    const { error: erroInsercao } = await supabaseAdmin
      .from("sigia_conhecimento")
      .insert(registros);

    if (erroInsercao) {
      throw new Error("Não foi possível salvar o conteúdo extraído.");
    }

    await supabaseAdmin
      .from("sigia_documentos")
      .update({
        status: "ATIVO",
        texto_extraido: paginas
          .map((pagina) => pagina.texto)
          .join("\n")
          .slice(0, 50000),
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", documentoId)
      .eq("municipio_id", municipioIdSeguro);

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: "PDF processado com sucesso.",
        total_trechos: registros.length,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro SIGIA /extrair-pdf:", error);

    if (documentoId && municipioIdSeguro) {
      await supabaseAdmin
        .from("sigia_documentos")
        .update({
          status: "ERRO",
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", documentoId)
        .eq("municipio_id", municipioIdSeguro);
    }

    return NextResponse.json(
      {
        erro:
          error instanceof Error
            ? error.message
            : "Erro ao processar PDF.",
      },
      { status: 500 }
    );
  } finally {
    if (caminhoTemporario) {
      await fs.unlink(caminhoTemporario).catch(() => undefined);
    }
  }
}
