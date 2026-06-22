
import Link from "next/link";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import {
  UserCog,
  Building2,
  ShieldCheck,
  Bell,
  Landmark,
} from "lucide-react";

const cards = [
  {
    titulo: "Usuários",
    icone: UserCog,
    href: "/sistema/usuarios",
    descricao: "Gerenciamento de usuários do sistema",
  },
  {
    titulo: "Municípios",
    icone: Building2,
    href: "/sistema/municipios",
    descricao: "Controle dos municípios cadastrados",
  },
  {
    titulo: "Permissões",
    icone: ShieldCheck,
    href: "/sistema/permissoes",
    descricao: "Perfis e níveis de acesso",
  },
  {
    titulo: "Avisos",
    icone: Bell,
    href: "/sistema/avisos",
    descricao: "Comunicados internos da corporação",
  },
  {
    titulo: "Dados Institucionais",
    icone: Landmark,
    href: "/sistema/configuracoes",
    descricao: "Brasão, comandante e informações oficiais",
  },
  {
  titulo: "Institucional",
  icone: Landmark,
  href: "/sistema/administracao/institucional",
  descricao: "Municípios, brasões e dados institucionais",
},
];

export default function AdministracaoPage() {
  return (
    <ProtecaoModulo modulo="administracao">
      <section className="p-6 space-y-6">
        <div className="painel-premium p-6">
          <h1 className="text-4xl font-black text-white">
            ⚙️ Central de Administração
          </h1>

          <p className="text-slate-400 mt-2">
            Configurações, permissões e gerenciamento institucional do SIG-GCM Brasil.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {cards.map((card) => {
            const Icone = card.icone;

            return (
              <Link
                key={card.href}
                href={card.href}
                className="
                  painel-premium
                  p-6
                  hover:scale-[1.02]
                  hover:border-blue-500/40
                  transition-all
                  duration-300
                "
              >
                <div className="flex items-center justify-between mb-5">
                  <div
                    className="
                      w-16 h-16
                      rounded-2xl
                      bg-blue-500/10
                      border border-blue-500/20
                      flex items-center justify-center
                    "
                  >
                    <Icone className="w-9 h-9 text-cyan-400" />
                  </div>

                  <span className="text-green-400 text-xs font-black">
                    ADMIN
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
    </ProtecaoModulo>
  );
}
