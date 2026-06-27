export async function buscarConhecimentoWebSIGIA(pergunta: string) {
  try {
    const resposta = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: pergunta,
        search_depth: "advanced",
        max_results: 5,
        include_answer: true,
      }),
    });

    if (!resposta.ok) {
      throw new Error("Erro ao consultar Tavily");
    }

    const dados = await resposta.json();

    let texto = "";

    if (dados.answer) {
      texto += `Resumo:\n${dados.answer}\n\n`;
    }

    if (dados.results?.length) {
      texto += "Fontes:\n\n";

      for (const item of dados.results) {
        texto += `📄 ${item.title}

${item.content}

Fonte:
${item.url}

----------------------------

`;
      }
    }

    return texto || null;
  } catch (error) {
    console.error("Erro Tavily:", error);
    return null;
  }
}