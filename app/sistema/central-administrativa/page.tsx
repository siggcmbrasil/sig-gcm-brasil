import Link from "next/link";
import {
  Users,
  Building2,
  Shield,
  Settings,
  ClipboardCheck,
  Database,
  FolderSync,
  FileCog,
} from "lucide-react";

const cards = [
  {
    titulo: "Usuários",
    icone: Users,
    href: "/sistema/usuarios",
    descricao: "Cadastro, gerenciamento e controle dos usuários do sistema.",
  },
  {
    titulo: "Municípios",
    icone: Building2,
    href: "/sistema/municipios",
    descricao: "Gerenciamento dos municípios cadastrados.",
  },
  {
    titulo: "Permissões",
    icone: Shield,
    href: "/sistema/permissoes",
    descricao: "Controle de acesso por perfil e módulos.",
  },
  {
    titulo: "Configurações",
    icone: Settings,
    href: "/sistema/configuracoes",
    descricao: "Parâmetros gerais e configurações institucionais.",
  },
  {
    titulo: "Auditoria",
    icone: ClipboardCheck,
    href: "/sistema/auditoria",
    descricao: "Registro de ações realizadas pelos usuários.",
  },
  {
    titulo: "Backup",
    icone: Database,
    href: "/sistema/backup",
    descricao: "Gerenciamento dos backups do sistema.",
  },
  {
    titulo: "Importador de Dados",
    icone: FolderSync,
    href: "/sistema/importador-dados",
    descricao: "Importação de dados externos para o SIG.",
  },
  {
    titulo: "Exportador de Dados",
    icone: FileCog,
    href: "/sistema/exportador-dados",
    descricao: "Exportação de dados e relatórios do sistema.",
  },
];

export default function CentralAdministrativaPage() {
  return (
    <section className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-4xl font-black text-white">
          ⚙️ Central Administrativa
        </h1>

        <p className="text-slate-400 mt-2">
          Administração geral da plataforma SIG-GCM Brasil.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card, index) => {
          const Icone = card.icone;

          return (
            <Link
              key={`${card.titulo}-${index}`}
              href={card.href}
              className="painel-premium p-6 hover:scale-[1.02] hover:border-blue-500/40 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Icone className="w-9 h-9 text-cyan-400" />
                </div>

                <span className="text-green-400 text-xs font-black">
                  ONLINE
                </span>
              </div>

              <h2 className="text-2xl font-black text-white">
                {card.titulo}
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                {card.descricao}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}