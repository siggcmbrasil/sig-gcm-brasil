export default function PainelSIGIA() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card titulo="Ocorrências Hoje" valor="--" cor="red" />
      <Card titulo="Viaturas Ativas" valor="--" cor="blue" />
      <Card titulo="Guardas de Serviço" valor="--" cor="green" />
      <Card titulo="Chamados" valor="--" cor="yellow" />
    </div>
  );
}

function Card({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: string;
  cor: "red" | "blue" | "green" | "yellow";
}) {
  const cores = {
    red: "border-red-500",
    blue: "border-blue-500",
    green: "border-green-500",
    yellow: "border-yellow-500",
  };

  return (
    <div className={`rounded-2xl border ${cores[cor]} bg-slate-900 p-4`}>
      <p className="text-xs text-slate-400">{titulo}</p>
      <p className="text-3xl font-bold mt-2">{valor}</p>
    </div>
  );
}