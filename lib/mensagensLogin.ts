const mensagensMotivacionais = [
  "A disciplina de hoje constrói a segurança de amanhã.",
  "Servir e proteger é uma missão de honra.",
  "Grandes resultados são construídos um plantão de cada vez.",
  "Quem protege vidas deixa um legado.",
  "A verdadeira liderança inspira pelo exemplo.",
  "A coragem nasce quando o dever fala mais alto.",
  "A segurança da cidade começa com compromisso.",
  "Honra, respeito e disciplina fortalecem a missão.",
  "Cada serviço bem feito aproxima a Guarda da população.",
  "O profissionalismo transforma rotina em excelência.",
  "A presença da Guarda representa ordem e proteção.",
  "Quem serve com dedicação deixa marcas positivas.",
  "A missão é diária, mas o propósito é permanente.",
  "Uma equipe unida protege melhor a cidade.",
  "O exemplo de hoje inspira a tropa de amanhã.",
  "Cada ronda é uma oportunidade de prevenir.",
  "Quem cuida da cidade também constrói esperança.",
  "A responsabilidade é o alicerce da confiança.",
  "A farda representa compromisso com vidas.",
  "A excelência nasce nos pequenos detalhes.",
];

const versiculos = [
  { referencia: "Josué 1:9", texto: "Seja forte e corajoso. Não temas, porque o Senhor teu Deus estará contigo." },
  { referencia: "Salmos 23:1", texto: "O Senhor é o meu pastor; nada me faltará." },
  { referencia: "Filipenses 4:13", texto: "Tudo posso naquele que me fortalece." },
  { referencia: "Isaías 41:10", texto: "Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus." },
  { referencia: "Salmos 91:1", texto: "Aquele que habita no esconderijo do Altíssimo descansará à sombra do Onipotente." },
  { referencia: "Provérbios 3:5", texto: "Confia no Senhor de todo o teu coração." },
  { referencia: "Romanos 8:31", texto: "Se Deus é por nós, quem será contra nós?" },
  { referencia: "Mateus 5:9", texto: "Bem-aventurados os pacificadores, porque serão chamados filhos de Deus." },
  { referencia: "Salmos 121:8", texto: "O Senhor guardará a tua saída e a tua entrada." },
  { referencia: "2 Timóteo 1:7", texto: "Deus não nos deu espírito de medo, mas de força, amor e equilíbrio." },
  { referencia: "Salmos 46:1", texto: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia." },
  { referencia: "João 14:27", texto: "Deixo-vos a paz, a minha paz vos dou." },
  { referencia: "Provérbios 16:3", texto: "Entrega ao Senhor as tuas obras, e teus planos serão estabelecidos." },
  { referencia: "Salmos 37:5", texto: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará." },
  { referencia: "Isaías 40:31", texto: "Os que esperam no Senhor renovarão as suas forças." },
  { referencia: "Colossenses 3:23", texto: "Tudo quanto fizerdes, fazei-o de todo o coração." },
  { referencia: "Salmos 27:1", texto: "O Senhor é a minha luz e a minha salvação; a quem temerei?" },
  { referencia: "Números 6:24", texto: "O Senhor te abençoe e te guarde." },
  { referencia: "Salmos 30:5", texto: "O choro pode durar uma noite, mas a alegria vem pela manhã." },
  { referencia: "1 Pedro 5:7", texto: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós." },
];

export const mensagensLogin = Array.from({ length: 366 }, (_, i) => {
  const dia = i + 1;
  const motivacional = mensagensMotivacionais[i % mensagensMotivacionais.length];
  const versiculo = versiculos[i % versiculos.length];

  return {
    dia,
    motivacional,
    versiculo: versiculo.texto,
    referencia: versiculo.referencia,
  };
});

export function getDiaDoAno() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), 0, 0);
  const diff = hoje.getTime() - inicio.getTime();
  return Math.floor(diff / 86400000);
}

export function getMensagemDoDia() {
  const dia = getDiaDoAno();
  return mensagensLogin[dia - 1] || mensagensLogin[0];
}