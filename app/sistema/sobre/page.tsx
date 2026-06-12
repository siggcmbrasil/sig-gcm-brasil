export default function SobrePage() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Cabeçalho */}
          <div className="bg-gradient-to-r from-green-700 to-green-900 text-white p-8 text-center">
            <img
              src="/logo.png"
              alt="SIG-GCM Brasil"
              className="w-28 h-28 object-contain mx-auto mb-4"
            />

            <h1 className="text-4xl font-bold">SIG-GCM Brasil</h1>

            <p className="mt-2 text-green-100">
              Sistema Integrado de Gestão para Guardas Municipais
            </p>

            <p className="mt-4 italic text-green-200">
              Tecnologia a serviço da segurança pública municipal.
            </p>
          </div>

          {/* Conteúdo */}
          <div className="p-8 text-gray-800">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-green-700 mb-4">
                Sobre o Sistema
              </h2>

              <p className="leading-relaxed">
                O SIG-GCM Brasil é uma plataforma desenvolvida para modernizar
                a gestão das Guardas Municipais brasileiras, integrando setores
                operacionais, administrativos e estratégicos em um único
                ambiente.
              </p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-700 p-4 rounded mb-8">
              <p>
                <strong>Missão:</strong> Fornecer tecnologia, organização e
                inteligência para fortalecer as Guardas Municipais do Brasil.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border rounded-xl p-5 bg-white">
                <h3 className="font-bold text-lg mb-3 text-green-700">
                  Recursos Operacionais
                </h3>

                <ul className="space-y-2 text-gray-700">
                  <li>✅ Ocorrências</li>
                  <li>✅ Chamados</li>
                  <li>✅ Patrulhamento</li>
                  <li>✅ Banco de Horas</li>
                  <li>✅ Escalas de Serviço</li>
                  <li>✅ Permutas de Plantão</li>
                </ul>
              </div>

              <div className="border rounded-xl p-5 bg-white">
                <h3 className="font-bold text-lg mb-3 text-green-700">
                  Recursos Administrativos
                </h3>

                <ul className="space-y-2 text-gray-700">
                  <li>✅ Gestão de Guardas</li>
                  <li>✅ Guarnições</li>
                  <li>✅ Viaturas</li>
                  <li>✅ Relatórios Operacionais</li>
                  <li>✅ Estatísticas</li>
                  <li>🚧 Inteligência Artificial</li>
                </ul>
              </div>
            </div>

            <div className="bg-slate-100 border rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-green-700 mb-4">
                Suporte e Contato
              </h2>

              <div className="space-y-2 text-gray-800">
                <p>
                  📧 <strong>Suporte:</strong> suporte@siggcmbrasil.com
                </p>

                <p>
                  📧 <strong>Comercial:</strong> comercial@siggcmbrasil.com
                </p>

                <p>
                  🌐 <strong>Site:</strong> siggcmbrasil.com
                </p>
              </div>
            </div>

            <div className="border-t pt-6 text-center">
              <p className="font-semibold text-gray-800">
                SIG-GCM Brasil v1.0.0
              </p>

              <p className="text-sm text-gray-500 mt-2">
                © 2026 SIG-GCM Brasil. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}