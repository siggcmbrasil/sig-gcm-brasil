import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { tmpdir } from "os";
import path from "path";
import fs from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";

const executar = promisify(execFile);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function dividirTexto(texto: string, tamanho = 1800) {
  const partes: string[] = [];

  for (let i = 0; i < texto.length; i += tamanho) {
    partes.push(texto.slice(i, i + tamanho));
  }

  return partes;
}

export async function POST(req: Request) {
  let caminhoTemporario = "";
  let documento_id: string | number | null = null;

  try {
    const body = await req.json();
    documento_id = body.documento_id;
    const usuario = body.usuario;

    if (!documento_id) {
      return NextResponse.json(
        { erro: "documento_id é obrigatório" },
        { status: 400 }
      );
    }

    if (!usuario?.id || !usuario?.municipio_id) {
      return NextResponse.json(
        { erro: "Usuário inválido. Faça login novamente." },
        { status: 401 }
      );
    }

    const { data: documento, error: erroDoc } = await supabaseAdmin
      .from("sigia_documentos")
      .select("*")
      .eq("id", documento_id)
      .eq("municipio_id", usuario.municipio_id)
      .single();

    if (erroDoc || !documento) {
      return NextResponse.json(
        { erro: "Documento não encontrado ou sem permissão." },
        { status: 404 }
      );
    }

    await supabaseAdmin
      .from("sigia_documentos")
      .update({
        status: "PROCESSANDO",
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", documento_id)
      .eq("municipio_id", usuario.municipio_id);

    const { data: arquivo, error: erroDownload } = await supabaseAdmin.storage
      .from("sigia-documentos")
      .download(documento.arquivo_url);

    if (erroDownload || !arquivo) {
      throw new Error(erroDownload?.message || "Erro ao baixar PDF");
    }

    caminhoTemporario = path.join(tmpdir(), `${randomUUID()}.pdf`);

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    await fs.writeFile(caminhoTemporario, buffer);

    const script = path.join(process.cwd(), "scripts", "sigia_extract_pdf.py");

    const { stdout } = await executar("python3", [script, caminhoTemporario], {
      maxBuffer: 1024 * 1024 * 20,
    });

    const resultado = JSON.parse(stdout);
    const paginas = resultado.paginas || [];

    if (paginas.length === 0) {
      await supabaseAdmin
        .from("sigia_documentos")
        .update({
          status: "ERRO",
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", documento_id)
        .eq("municipio_id", usuario.municipio_id);

      return NextResponse.json(
        { erro: "Nenhum texto encontrado no PDF" },
        { status: 400 }
      );
    }

    await supabaseAdmin
      .from("sigia_conhecimento")
      .delete()
      .eq("documento_id", documento_id)
      .eq("municipio_id", usuario.municipio_id);

    const registros: any[] = [];

    for (const pagina of paginas) {
      const trechos = dividirTexto(pagina.texto || "");

      trechos.forEach((conteudo, index) => {
        if (!conteudo.trim()) return;

        registros.push({
          documento_id,
          titulo: documento.titulo,
          conteudo,
          categoria: documento.categoria,
          municipio_id: documento.municipio_id,
          visibilidade: documento.visibilidade || "MUNICIPIO",
          nivel_acesso: documento.nivel_acesso || 40,
          origem: "PDF",
          status: "ATIVO",
          pagina: pagina.pagina,
          numero_trecho: index + 1,
          palavras: conteudo.split(" ").filter(Boolean).length,
        });
      });
    }

    if (registros.length === 0) {
      throw new Error("PDF sem conteúdo válido para salvar.");
    }

    const { error: erroInsert } = await supabaseAdmin
      .from("sigia_conhecimento")
      .insert(registros);

    if (erroInsert) {
      throw new Error(erroInsert.message);
    }

    await supabaseAdmin
      .from("sigia_documentos")
      .update({
        status: "ATIVO",
        texto_extraido: paginas
          .map((p: any) => p.texto)
          .join("\n")
          .slice(0, 50000),
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", documento_id)
      .eq("municipio_id", usuario.municipio_id);

    return NextResponse.json({
      sucesso: true,
      mensagem: "PDF processado com sucesso",
      total_trechos: registros.length,
    });
  } catch (error: any) {
    console.error("SIGIA ERRO:", error);

    if (documento_id) {
      await supabaseAdmin
        .from("sigia_documentos")
        .update({
          status: "ERRO",
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", documento_id);
    }

    return NextResponse.json(
      {
        erro: "Erro ao processar PDF",
        detalhe: error.message,
      },
      { status: 500 }
    );
  } finally {
    if (caminhoTemporario) {
      await fs.unlink(caminhoTemporario).catch(() => {});
    }
  }
}