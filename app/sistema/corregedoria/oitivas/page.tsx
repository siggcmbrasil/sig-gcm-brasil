import CorregedoriaCrud from "@/components/corregedoria/CorregedoriaCrud";

const config = {
  "titulo": "Oitivas e Depoimentos",
  "descricao": "Agenda e registro das oitivas vinculadas às apurações correcionais.",
  "tabela": "corregedoria_oitivas",
  "campoTitulo": "titulo",
  "campos": [
    {
      "nome": "titulo",
      "rotulo": "Título",
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "processo_numero",
      "rotulo": "Processo",
      "lista": true
    },
    {
      "nome": "tipo",
      "rotulo": "Tipo",
      "tipo": "select",
      "opcoes": [
        "DENUNCIANTE",
        "INVESTIGADO",
        "TESTEMUNHA",
        "PERITO",
        "OUTRO"
      ],
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "participante",
      "rotulo": "Participante",
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "data_hora",
      "rotulo": "Data e hora",
      "tipo": "datetime-local",
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "status",
      "rotulo": "Status",
      "tipo": "select",
      "opcoes": [
        "AGENDADA",
        "REALIZADA",
        "REMARCADA",
        "CANCELADA"
      ],
      "obrigatorio": true
    },
    {
      "nome": "local",
      "rotulo": "Local"
    },
    {
      "nome": "termo",
      "rotulo": "Termo/Resumo",
      "tipo": "textarea"
    }
  ]
} as const;

export default function Page() {
  return <CorregedoriaCrud config={config} />;
}
