import CorregedoriaCrud from "@/components/corregedoria/CorregedoriaCrud";

const config = {
  "titulo": "Relatórios Correcionais",
  "descricao": "Relatórios gerenciais e institucionais da atividade correcional.",
  "tabela": "corregedoria_relatorios",
  "campoTitulo": "titulo",
  "campos": [
    {
      "nome": "titulo",
      "rotulo": "Título",
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "tipo",
      "rotulo": "Tipo",
      "tipo": "select",
      "opcoes": [
        "MENSAL",
        "TRIMESTRAL",
        "SEMESTRAL",
        "ANUAL",
        "TEMATICO"
      ],
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "periodo_inicio",
      "rotulo": "Início",
      "tipo": "date",
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "periodo_fim",
      "rotulo": "Fim",
      "tipo": "date",
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "status",
      "rotulo": "Status",
      "tipo": "select",
      "opcoes": [
        "RASCUNHO",
        "GERADO",
        "PUBLICADO",
        "ARQUIVADO"
      ],
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "responsavel",
      "rotulo": "Responsável",
      "lista": true
    },
    {
      "nome": "resumo",
      "rotulo": "Resumo executivo",
      "tipo": "textarea"
    }
  ]
} as const;

export default function Page() {
  return <CorregedoriaCrud config={config} />;
}
