import TransitoCrud from "@/components/transito/TransitoCrud";

export default function Page() {
  return (
    <TransitoCrud
      config={{
        titulo: "Engenharia de Tráfego",
        descricao: "Estudos, contagens, projetos, intervenções, pontos críticos e acompanhamento técnico.",
        tabela: "transito_engenharia_projetos",
        campoTitulo: "titulo",
        campoStatus: "status",
        statusOpcoes: ["ESTUDO", "PROJETO", "EM_EXECUCAO", "CONCLUIDO", "CANCELADO"],
        campos: [{"nome": "titulo", "rotulo": "Título", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "tipo", "rotulo": "Tipo", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["ESTUDO_TECNICO", "CONTAGEM", "PROJETO_VIARIO", "INTERVENCAO", "PARECER"]}, {"nome": "local", "rotulo": "Local", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "responsavel", "rotulo": "Responsável técnico", "tipo": "text", "obrigatorio": false, "colunaLista": true}, {"nome": "inicio", "rotulo": "Início", "tipo": "date", "obrigatorio": false, "colunaLista": true}, {"nome": "status", "rotulo": "Status", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["ESTUDO", "PROJETO", "EM_EXECUCAO", "CONCLUIDO", "CANCELADO"]}, {"nome": "objetivo", "rotulo": "Objetivo", "tipo": "textarea", "obrigatorio": true, "colunaLista": false}, {"nome": "conclusao", "rotulo": "Conclusão", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}]
      }}
    />
  );
}
