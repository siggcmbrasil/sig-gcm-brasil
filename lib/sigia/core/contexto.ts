export type UsuarioSIGIA = {
  id: string;
  nome: string;
  matricula?: string;
  email: string;
  perfil: string;
  municipio_id?: number;
  foto_url?: string;
};

export type ContextoSIGIA = {
  usuario?: UsuarioSIGIA | null;
  municipioId?: number;
  perfil?: string;
};

export function criarContextoSIGIA(usuario?: UsuarioSIGIA | null): ContextoSIGIA {
  return {
    usuario: usuario || null,
    municipioId: usuario?.municipio_id,
    perfil: usuario?.perfil,
  };
}