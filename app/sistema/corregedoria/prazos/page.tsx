import CorregedoriaCrud from "@/components/corregedoria/CorregedoriaCrud";

const config = {
  "titulo": "Prazos Processuais",
  "descricao": "Controle centralizado de prazos, suspensões, prorrogações e vencimentos.",
  "tabela": "corregedoria_prazos",
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
        "INSTRUCAO",
        "DEFESA",
        "RELATORIO",
        "DECISAO",
        "RECURSO",
        "OUTRO"
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
      "nome": "vencimento",
      "rotulo": "Vencimento",
      "tipo": "date",
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "status",
      "rotulo": "Status",
      "tipo": "select",
      "opcoes": [
        "ABERTO",
        "SUSPENSO",
        "PRORROGADO",
        "CUMPRIDO",
        "VENCIDO"
      ],
      "obrigatorio": true,
      "lista": true
    },
    {
      "nome": "responsavel",
      "rotulo": "Responsável"
    },
    {
      "nome": "observacoes",
      "rotulo": "Observações",
      "tipo": "textarea"
    }
  ]
} as const;

export default function Page() {
  return <CorregedoriaCrud config={config} />;
}
