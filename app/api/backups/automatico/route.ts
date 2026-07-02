import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("x-backup-token");

    if (token !== process.env.BACKUP_CRON_SECRET) {
      return NextResponse.json(
        { ok: false, erro: "Não autorizado." },
        { status: 401 }
      );
    }

    const { data: municipios, error } = await supabaseAdmin
      .from("municipios")
      .select("id, nome")
      .eq("ativo", true);

    if (error) throw error;

    let total = 0;

    for (const municipio of municipios || []) {
      const municipioId = municipio.id;

      const { data: guardas } = await supabaseAdmin
        .from("guardas")
        .select("*")
        .eq("municipio_id", municipioId);

      const { data: ocorrencias } = await supabaseAdmin
        .from("ocorrencias")
        .select("*")
        .eq("municipio_id", municipioId);

      const { data: viaturas } = await supabaseAdmin
        .from("viaturas")
        .select("*")
        .eq("municipio_id", municipioId);

      const backup = {
        sistema: "SIG-GCM Brasil",
        municipio_id: municipioId,
        municipio_nome: municipio.nome,
        criado_em: new Date().toISOString(),
        guardas: guardas || [],
        ocorrencias: ocorrencias || [],
        viaturas: viaturas || [],
      };

      const conteudo = JSON.stringify(backup, null, 2);
      const nomeArquivo = `backup_auto_${municipioId}_${Date.now()}.json`;
      const caminho = `${municipioId}/${nomeArquivo}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("backups")
        .upload(caminho, conteudo, {
          contentType: "application/json",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseAdmin.storage
        .from("backups")
        .getPublicUrl(caminho);

      const { error: insertError } = await supabaseAdmin
        .from("backups_sistema")
        .insert({
          municipio_id: municipioId,
          usuario_id: null,
          nome_arquivo: nomeArquivo,
          caminho,
          automatico: true,
          tamanho: `${Math.ceil(conteudo.length / 1024)} KB`,
          arquivo_url: urlData.publicUrl,
          observacao: "Backup automático diário gerado pelo sistema.",
        });

      if (insertError) throw insertError;

      await supabaseAdmin.from("auditoria_sistema").insert({
        municipio_id: municipioId,
        usuario_id: null,
        modulo: "BACKUP",
        acao: "BACKUP_AUTOMATICO",
        detalhes: `Backup automático gerado: ${nomeArquivo}`,
      });

      total++;
    }

    return NextResponse.json({
      ok: true,
      mensagem: "Backups automáticos gerados com sucesso.",
      total,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        erro: error.message || "Erro ao gerar backup automático.",
      },
      { status: 500 }
    );
  }
}