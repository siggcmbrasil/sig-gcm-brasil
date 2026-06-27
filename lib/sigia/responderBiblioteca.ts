export async function responderComBibliotecaSIGIA({
  pergunta,
  conhecimentoDocumentos,
  conhecimentoWeb,
}: {
  pergunta: string;
  conhecimentoDocumentos?: string | null;
  conhecimentoWeb?: string | null;
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return `
${conhecimentoDocumentos || ""}

${conhecimentoWeb ? `\n\nInformações da web:\n${conhecimentoWeb}` : ""}
`.trim();
  }

  const prompt = `
Você é a SIGIA, Inteligência Artificial do SIG-GCM Brasil.

Responda de forma clara, profissional, objetiva e institucional.

REGRAS:
- Use principalmente os documentos da Biblioteca Inteligente.
- Use informações da web apenas como complemento.
- Não invente informação.
- Se não houver base suficiente, diga claramente.
- Não responda como opinião pessoal.
- Quando possível, explique de forma prática para uso por Guarda Municipal.

Pergunta do usuário:
${pergunta}

DOCUMENTOS DA BIBLIOTECA:
${conhecimentoDocumentos || "Nenhum documento encontrado."}

INFORMAÇÕES DA WEB:
${conhecimentoWeb || "Nenhuma informação web encontrada."}

No final da resposta, inclua obrigatoriamente:

Nível de confiança:
- Alta: quando houver documento da Biblioteca e apoio da web.
- Média: quando houver apenas documento da Biblioteca.
- Baixa: quando houver apenas web ou pouca base.
- Insuficiente: quando não houver base confiável.

Fontes consultadas:
- Liste os documentos e fontes usados.
`;

  const resposta = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  const dados = await resposta.json();

  return (
    dados?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Não consegui gerar uma resposta com base nos documentos."
  );
}