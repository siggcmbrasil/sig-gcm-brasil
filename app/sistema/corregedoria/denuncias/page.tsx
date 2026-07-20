import CorregedoriaCrud from "@/components/corregedoria/CorregedoriaCrud";

const config = {
  "titulo": "Denúncias Internas",
  "descricao": "Recebimento e triagem de comunicações reservadas, preservando sigilo, classificação e rastreabilidade.",
  "tabela": "corregedoria_denuncias",
  "campoTitulo": "protocolo",
  "campos": [
    {
      "nome": "protocolo",
      "rotulo": "Protocolo",
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "origem",
      "rotulo": "Origem",
      "tipo": "select",
      "opcoes": [
        "INTERNA",
        "OUVIDORIA",
        "ANONIMA",
        "COMANDO",
        "MINISTERIO_PUBLICO",
        "OUTRA"
      ],
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "classificacao",
      "rotulo": "Classificação",
      "tipo": "select",
      "opcoes": [
        "INFORMACAO",
        "RECLAMACAO",
        "DENUNCIA",
        "REPRESENTACAO"
      ],
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "sigilo",
      "rotulo": "Sigilo",
      "tipo": "select",
      "opcoes": [
        "RESTRITO",
        "SIGILOSO",
        "ULTRASSECRETO"
      ],
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "status",
      "rotulo": "Status",
      "tipo": "select",
      "opcoes": [
        "RECEBIDA",
        "EM_TRIAGEM",
        "ENCAMINHADA",
        "ARQUIVADA"
      ],
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "assunto",
      "rotulo": "Assunto",
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "relato",
      "rotulo": "Relato",
      "tipo": "textarea",
      "obrigatorio": true
    },
    {
      "nome": "encaminhamento",
      "rotulo": "Encaminhamento",
      "tipo": "textarea"
    }
  ]
} as const;

export default function Page() {
  return <CorregedoriaCrud config={config} />;
}
