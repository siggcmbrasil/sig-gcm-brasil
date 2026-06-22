export function calcularGuarnicaoDia(configEscala: any, guarnicoes: any[]) {
  if (!configEscala || !configEscala.ordem_guarnicoes?.length) {
    return null;
  }

  const dataBase = new Date(`${configEscala.data_base}T07:00:00`);
  const agora = new Date();

  const inicioPlantaoAtual = new Date(agora);

  if (inicioPlantaoAtual.getHours() < 7) {
    inicioPlantaoAtual.setDate(inicioPlantaoAtual.getDate() - 1);
  }

  inicioPlantaoAtual.setHours(7, 0, 0, 0);

  const diferencaMs = inicioPlantaoAtual.getTime() - dataBase.getTime();
  const diasPassados = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

  const ordem = configEscala.ordem_guarnicoes;

  const indiceBase = ordem.findIndex(
    (id: number) => Number(id) === Number(configEscala.guarnicao_base_id)
  );

  if (indiceBase === -1) return null;

  const indiceAtual =
    ((indiceBase + diasPassados) % ordem.length + ordem.length) %
    ordem.length;

  const guarnicaoIdAtual = ordem[indiceAtual];

  return (
    guarnicoes.find((g) => Number(g.id) === Number(guarnicaoIdAtual)) || null
  );
}