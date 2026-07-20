import TransitoCrud from "@/components/transito/TransitoCrud";

export default function Page() {
  return (
    <TransitoCrud
      config={{
        titulo: "Recursos e JARI",
        descricao: "Defesas prévias, recursos, prazos, sessões, decisões e rastreabilidade processual.",
        tabela: "transito_recursos_jari",
        campoTitulo: "protocolo",
        campoStatus: "status",
        statusOpcoes: ["EM_ANALISE", "AGUARDANDO_SESSAO", "DEFERIDO", "INDEFERIDO", "ARQUIVADO"],
        campos: [{"nome": "protocolo", "rotulo": "Protocolo", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "auto_numero", "rotulo": "Número do auto", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "requerente", "rotulo": "Requerente", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "tipo", "rotulo": "Tipo", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["DEFESA_PREVIA", "RECURSO_JARI", "RECURSO_CETRAN"]}, {"nome": "recebido_em", "rotulo": "Recebido em", "tipo": "datetime-local", "obrigatorio": true, "colunaLista": true}, {"nome": "prazo_em", "rotulo": "Prazo", "tipo": "date", "obrigatorio": false, "colunaLista": true}, {"nome": "status", "rotulo": "Status", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["EM_ANALISE", "AGUARDANDO_SESSAO", "DEFERIDO", "INDEFERIDO", "ARQUIVADO"]}, {"nome": "decisao", "rotulo": "Decisão", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}, {"nome": "fundamentacao", "rotulo": "Fundamentação", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}]
      }}
    />
  );
}
