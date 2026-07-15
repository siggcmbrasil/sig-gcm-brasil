"use client";

type Usuario = {
  nome?: string;
  perfil?: string;
  municipio_id?: number;
};

export default function SIGIAHeader({
  usuario,
}: {
  usuario: Usuario | null;
}) {
  return (
    <div className="p-6 md:p-8 border-b border-yellow-500/20 bg-gradient-to-r from-slate-950 to-blue-950">

      <p className="text-yellow-400 text-sm uppercase tracking-[0.3em]">
        Inteligência Artificial
      </p>

      <h1 className="text-5xl font-black mt-2">
        SIG<span className="text-yellow-400">IA</span>
      </h1>

      <p className="mt-3 text-slate-300">
        Inteligência Artificial do SIG-GCM Brasil
      </p>

      {usuario && (
        <div className="mt-6 rounded-2xl border border-blue-500/20 bg-slate-950/60 p-4">

          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Usuário conectado
          </p>

          <div className="grid md:grid-cols-3 gap-4 mt-4">

            <div>
              <p className="text-slate-500 text-xs">
                Nome
              </p>

              <p className="font-bold">
                {usuario.nome}
              </p>
            </div>

            <div>
              <p className="text-slate-500 text-xs">
                Perfil
              </p>

              <p className="font-bold text-yellow-400">
                {usuario.perfil}
              </p>
            </div>

            <div>
              <p className="text-slate-500 text-xs">
                Município
              </p>

              <p className="font-bold text-cyan-400">
                {usuario.municipio_id}
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}