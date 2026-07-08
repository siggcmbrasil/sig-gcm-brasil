import { iniciarGPSPatrulhamento } from "./iniciarGPS";

export function restaurarPatrulhamentoAtivo({
  municipio_id,
}: {
  municipio_id: number;
}) {
  if (typeof window === "undefined") return null;

  const id = localStorage.getItem("patrulhamentoAtivoId");
  if (!id) return null;

  const patrulhamento_id = Number(id);
  if (!patrulhamento_id) return null;

  iniciarGPSPatrulhamento({
    municipio_id,
    patrulhamento_id,
  });

  return patrulhamento_id;
}