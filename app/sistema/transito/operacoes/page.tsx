import TransitoCrud from "@/components/transito/TransitoCrud";

export default function Page() {
  return (
    <TransitoCrud
      config={{
        titulo: "Operações Viárias",
        descricao: "Planejamento e execução de blitz, bloqueios, apoio a eventos, interdições e fiscalizações especiais.",
        tabela: "transito_operacoes",
        campoTitulo: "nome",
        campoStatus: "status",
        statusOpcoes: ["PLANEJADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"],
        campos: [{"nome": "nome", "rotulo": "Nome da operação", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "tipo", "rotulo": "Tipo", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["BLITZ", "BLOQUEIO", "EVENTO", "INTERDICAO", "FISCALIZACAO", "OUTRA"]}, {"nome": "inicio", "rotulo": "Início", "tipo": "datetime-local", "obrigatorio": true, "colunaLista": true}, {"nome": "fim", "rotulo": "Fim", "tipo": "datetime-local", "obrigatorio": false, "colunaLista": true}, {"nome": "local", "rotulo": "Local", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "status", "rotulo": "Status", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["PLANEJADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"]}, {"nome": "objetivo", "rotulo": "Objetivo", "tipo": "textarea", "obrigatorio": true, "colunaLista": false}, {"nome": "resultado", "rotulo": "Resultado", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}]
      }}
    />
  );
}
