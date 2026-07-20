import TransitoCrud from "@/components/transito/TransitoCrud";

export default function Page() {
  return (
    <TransitoCrud
      config={{
        titulo: "Acidentes de Trânsito",
        descricao: "Registro técnico completo com vítimas, veículos, condições da via, narrativa, croqui e providências.",
        tabela: "transito_acidentes",
        campoTitulo: "protocolo",
        campoStatus: "status",
        statusOpcoes: ["REGISTRADO", "EM_ATENDIMENTO", "CONCLUIDO", "CANCELADO"],
        campos: [{"nome": "protocolo", "rotulo": "Protocolo", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "tipo", "rotulo": "Tipo", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["SEM_VITIMA", "COM_VITIMA", "ATROPELAMENTO", "CAPOTAMENTO", "CHOQUE", "OUTRO"]}, {"nome": "gravidade", "rotulo": "Gravidade", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["SEM_VITIMA", "LEVE", "GRAVE", "FATAL"]}, {"nome": "local", "rotulo": "Local", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "data_hora", "rotulo": "Data e hora", "tipo": "datetime-local", "obrigatorio": true, "colunaLista": true}, {"nome": "vitimas", "rotulo": "Quantidade de vítimas", "tipo": "number", "obrigatorio": false, "colunaLista": true}, {"nome": "status", "rotulo": "Status", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["REGISTRADO", "EM_ATENDIMENTO", "CONCLUIDO", "CANCELADO"]}, {"nome": "condicoes_via", "rotulo": "Condições da via", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}, {"nome": "narrativa", "rotulo": "Narrativa técnica", "tipo": "textarea", "obrigatorio": true, "colunaLista": false}, {"nome": "providencias", "rotulo": "Providências", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}]
      }}
    />
  );
}
