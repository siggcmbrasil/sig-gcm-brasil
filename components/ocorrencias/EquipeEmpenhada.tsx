import CardFormularioSIG from "./CardFormularioSIG";

type Guarda = {
  id: number;
  matricula: string;
  nome: string;
  cargo: string;
  status: string;
};

export default function EquipeEmpenhada({
  guardas,
  guardasSelecionados,
  setGuardasSelecionados,
}: {
  guardas: Guarda[];
  guardasSelecionados: string[];
  setGuardasSelecionados: (valor: string[]) => void;
}) {
  return (
    <CardFormularioSIG
      icone="🚔"
      titulo="Equipe Empenhada"
      descricao="Selecione todos os guardas que participaram do atendimento."
    >
      <label className="label">Selecionar guardas</label>

      <select
        className="input"
        onChange={(e) => {
          const nome = e.target.value;
          if (!nome) return;

          if (!guardasSelecionados.includes(nome)) {
            setGuardasSelecionados([...guardasSelecionados, nome]);
          }

          e.target.value = "";
        }}
      >
        <option value="">Selecione ou busque guardas para adicionar</option>

        {guardas.map((guarda) => (
          <option key={guarda.id} value={guarda.nome}>
            {guarda.nome} • {guarda.cargo}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {guardasSelecionados.map((nome) => {
          const guarda = guardas.find((g) => g.nome === nome);
          if (!guarda) return null;

          return (
            <div
              key={guarda.id}
              className="relative bg-slate-950/40 border border-slate-700 rounded-xl p-4"
            >
              <button
                type="button"
                onClick={() =>
                  setGuardasSelecionados(
                    guardasSelecionados.filter((g) => g !== guarda.nome)
                  )
                }
                className="absolute top-2 right-3 text-red-400 text-xl"
              >
                ×
              </button>

              <p className="font-bold">{guarda.nome}</p>
              <p className="text-sm text-slate-400">
                {guarda.matricula} • {guarda.cargo}
              </p>
              <p className="text-xs text-blue-400">{guarda.status}</p>
            </div>
          );
        })}
      </div>
    </CardFormularioSIG>
  );
}