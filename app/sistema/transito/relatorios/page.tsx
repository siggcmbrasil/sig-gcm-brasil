import TransitoCrud from "@/components/transito/TransitoCrud";

export default function Page() {
  return (
    <TransitoCrud
      config={{
        titulo: "Relatórios e Indicadores",
        descricao: "Registro de relatórios gerenciais, períodos, indicadores, responsáveis e situação de emissão.",
        tabela: "transito_relatorios",
        campoTitulo: "titulo",
        campoStatus: "status",
        statusOpcoes: ["RASCUNHO", "GERADO", "PUBLICADO", "ARQUIVADO"],
        campos: [{"nome": "titulo", "rotulo": "Título", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "tipo", "rotulo": "Tipo", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["FISCALIZACAO", "ACIDENTES", "AUTOS", "OPERACOES", "ARRECADACAO", "SINALIZACAO", "GERENCIAL"]}, {"nome": "periodo_inicio", "rotulo": "Período inicial", "tipo": "date", "obrigatorio": true, "colunaLista": true}, {"nome": "periodo_fim", "rotulo": "Período final", "tipo": "date", "obrigatorio": true, "colunaLista": true}, {"nome": "responsavel", "rotulo": "Responsável", "tipo": "text", "obrigatorio": false, "colunaLista": true}, {"nome": "status", "rotulo": "Status", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["RASCUNHO", "GERADO", "PUBLICADO", "ARQUIVADO"]}, {"nome": "resumo", "rotulo": "Resumo executivo", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}]
      }}
    />
  );
}
