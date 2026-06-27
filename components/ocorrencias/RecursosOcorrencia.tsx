export default function RecursosOcorrencia({
  mostrarVeiculos,
  setMostrarVeiculos,
  mostrarObjetos,
  setMostrarObjetos,
  fotosLength,
}: {
  mostrarVeiculos: boolean;
  setMostrarVeiculos: (valor: boolean) => void;
  mostrarObjetos: boolean;
  setMostrarObjetos: (valor: boolean) => void;
  fotosLength: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-5">
      <h2 className="text-xl font-bold mb-2">⚙️ Recursos da Ocorrência</h2>

      <p className="text-slate-400 text-sm mb-5">
        Selecione quais informações farão parte desta ocorrência.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="flex items-center gap-3 rounded-xl border border-slate-700 p-4 cursor-pointer hover:border-blue-500">
          <input
            type="checkbox"
            checked={mostrarVeiculos}
            onChange={() => setMostrarVeiculos(!mostrarVeiculos)}
          />

          <div>
            <p className="font-bold">🚗 Veículos</p>
            <p className="text-xs text-slate-400">
              Adicionar veículos envolvidos.
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-slate-700 p-4 cursor-pointer hover:border-red-500">
          <input
            type="checkbox"
            checked={mostrarObjetos}
            onChange={() => setMostrarObjetos(!mostrarObjetos)}
          />

          <div>
            <p className="font-bold">📦 Itens</p>
            <p className="text-xs text-slate-400">
              Armas, drogas, celulares, documentos...
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-slate-700 p-4 cursor-pointer hover:border-green-500">
          <input type="checkbox" checked={fotosLength > 0} readOnly />

          <div>
            <p className="font-bold">📷 Fotos</p>
            <p className="text-xs text-slate-400">
              Adicione imagens da ocorrência.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}