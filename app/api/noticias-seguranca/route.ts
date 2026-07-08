import { NextResponse } from "next/server";

const termos = [
  "Guarda Municipal",
  "GCM",
  "segurança pública",
  "SENASP",
  "Ministério da Justiça segurança pública",
  "STF segurança pública",
  "STJ segurança pública",
  "trânsito CTB",
];

function limparTexto(texto: string) {
  return texto
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function extrairItens(xml: string) {
  const itens = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

  return itens.map((match) => {
    const item = match[1];

    const titulo = item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
    const data = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
    const fonte = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "";

    return {
      titulo: limparTexto(titulo),
      link: limparTexto(link),
      fonte: limparTexto(fonte || "Google Notícias"),
      data_publicacao: data ? new Date(data).toISOString() : null,
    };
  });
}

export async function GET() {
  try {
    const noticias: any[] = [];

    for (const termo of termos) {
      const url =
        "https://news.google.com/rss/search?q=" +
        encodeURIComponent(`${termo} Brasil`) +
        "&hl=pt-BR&gl=BR&ceid=BR:pt-419";

      const resposta = await fetch(url, {
        next: { revalidate: 900 },
      });

      const xml = await resposta.text();
      noticias.push(...extrairItens(xml));
    }

    const unicas = Array.from(
      new Map(noticias.map((n) => [n.link, n])).values()
    ).slice(0, 40);

    return NextResponse.json({
      sucesso: true,
      noticias: unicas,
    });
  } catch (error) {
    console.error("Erro ao buscar notícias:", error);

    return NextResponse.json(
      {
        sucesso: false,
        noticias: [],
        erro: "Erro ao buscar notícias.",
      },
      { status: 500 }
    );
  }
}