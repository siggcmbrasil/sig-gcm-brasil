import TransitoCrud from "@/components/transito/TransitoCrud";

export default function Page() {
  return (
    <TransitoCrud
      config={{
        titulo: "Educação para o Trânsito",
        descricao: "Campanhas, palestras, escolas, públicos atendidos, calendário e indicadores educativos.",
        tabela: "transito_educacao_acoes",
        campoTitulo: "titulo",
        campoStatus: "status",
        statusOpcoes: ["PLANEJADA", "REALIZADA", "CANCELADA"],
        campos: [{"nome": "titulo", "rotulo": "Título da ação", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "tipo", "rotulo": "Tipo", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["CAMPANHA", "PALESTRA", "ESCOLA", "BLITZ_EDUCATIVA", "CURSO", "OUTRA"]}, {"nome": "instituicao", "rotulo": "Instituição", "tipo": "text", "obrigatorio": false, "colunaLista": true}, {"nome": "data_hora", "rotulo": "Data e hora", "tipo": "datetime-local", "obrigatorio": true, "colunaLista": true}, {"nome": "publico_estimado", "rotulo": "Público estimado", "tipo": "number", "obrigatorio": false, "colunaLista": true}, {"nome": "status", "rotulo": "Status", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["PLANEJADA", "REALIZADA", "CANCELADA"]}, {"nome": "descricao", "rotulo": "Descrição", "tipo": "textarea", "obrigatorio": true, "colunaLista": false}, {"nome": "resultados", "rotulo": "Resultados", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}]
      }}
    />
  );
}
