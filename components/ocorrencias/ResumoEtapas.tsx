export default function ResumoEtapas({
  dados,
  equipe,
  envolvidos,
  veiculos,
  itens,
  narrativa,
  fotos,
}: {
  dados: boolean;
  equipe: boolean;
  envolvidos: boolean;
  veiculos: boolean;
  itens: boolean;
  narrativa: boolean;
  fotos: boolean;
}) {
  const etapas = [
    ["🚨", "Dados", dados],
    ["👮", "Equipe", equipe],
    ["👥", "Envolvidos", envolvidos],
    ["🚗", "Veículos", veiculos],
    ["📦", "Itens", itens],
    ["📝", "Narrativa", narrativa],
    ["📷", "Fotos", fotos],
  ];

  return (
    <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {etapas.map(([icone, nome, ok]) => (
          <div
            key={String(nome)}
            className={`rounded-xl border p-3 text-center ${
              ok
                ? "border-green-500/40 bg-green-600/10 text-green-300"
                : "border-slate-700 bg-slate-900/60 text-slate-400"
            }`}
          >
            <div className="text-2xl">{icone}</div>
            <p className="text-sm font-bold mt-1">{nome}</p>
            <p className="text-xs mt-1">{ok ? "Concluído" : "Pendente"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}   