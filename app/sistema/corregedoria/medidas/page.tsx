import CorregedoriaCrud from "@/components/corregedoria/CorregedoriaCrud";

const config = {
  "titulo": "Medidas Cautelares",
  "descricao": "Registro reservado de afastamentos, restrições, recolhimentos e outras medidas provisórias.",
  "tabela": "corregedoria_medidas_cautelares",
  "campoTitulo": "numero",
  "campos": [
    {
      "nome": "numero",
      "rotulo": "Número",
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "processo_numero",
      "rotulo": "Processo",
      "lista": true
    },
    {
      "nome": "servidor_nome",
      "rotulo": "Servidor",
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "tipo",
      "rotulo": "Tipo",
      "tipo": "select",
      "opcoes": [
        "AFASTAMENTO",
        "RESTRICAO_FUNCIONAL",
        "RECOLHIMENTO_ARMA",
        "MUDANCA_LOTACAO",
        "OUTRA"
      ],
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "inicio",
      "rotulo": "Início",
      "tipo": "date",
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "fim",
      "rotulo": "Fim",
      "tipo": "date",
      "lista": true
    },
    {
      "nome": "status",
      "rotulo": "Status",
      "tipo": "select",
      "opcoes": [
        "ATIVA",
        "SUSPENSA",
        "REVOGADA",
        "ENCERRADA"
      ],
      "obrigatorio": true
    },
    {
      "nome": "fundamentacao",
      "rotulo": "Fundamentação",
      "tipo": "textarea",
      "obrigatorio": true
    }
  ]
} as const;

export default function Page() {
  return <CorregedoriaCrud config={config} />;
}
