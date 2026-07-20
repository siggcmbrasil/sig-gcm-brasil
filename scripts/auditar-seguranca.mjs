import fs from 'node:fs';
import path from 'node:path';

const roots = ['app', 'components', 'lib'];
const ignored = new Set(['node_modules', '.next', '.git']);
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const findings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (extensions.has(path.extname(entry.name))) inspect(full);
  }
}

function add(level, file, message) {
  findings.push({ level, file: file.replaceAll('\\', '/'), message });
}

function inspect(file) {
  const text = fs.readFileSync(file, 'utf8');
  const clientFile = /^\s*["']use client["'];?/m.test(text);

  if (clientFile && /SUPABASE_SERVICE_ROLE_KEY|service_role/i.test(text)) {
    add('CRITICO', file, 'Service Role referenciada em arquivo Client Component.');
  }
  if (/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/i.test(text)) {
    add('CRITICO', file, 'Service Role exposta como variável NEXT_PUBLIC.');
  }
  if (/process\.env\.SUPABASE_SERVICE_ROLE_KEY/.test(text) && !file.includes(`${path.sep}api${path.sep}`) && !file.endsWith(`lib${path.sep}supabaseAdmin.ts`)) {
    add('ALTO', file, 'Service Role fora de rota de API ou cliente administrativo central.');
  }
  if (file.includes(`${path.sep}api${path.sep}`) && /supabaseAdmin/.test(text)) {
    const authenticates = /auth\.getUser\s*\(/.test(text);
    const publicRoute = file.includes(`${path.sep}publico${path.sep}`) || file.includes(`${path.sep}whatsapp${path.sep}`);
    if (!authenticates && !publicRoute) {
      add('ALTO', file, 'Rota administrativa sem validação explícita auth.getUser().');
    }
  }
  if (/\.from\(["'](?:usuarios|ocorrencias|guardas|escalas_servico|permutas_plantao)["']\)/.test(text)
      && !/municipio_id/.test(text)
      && file.includes(`${path.sep}api${path.sep}`)) {
    add('MEDIO', file, 'Consulta sensível sem referência visível a municipio_id; revisar isolamento.');
  }
}

for (const root of roots) walk(root);

const order = { CRITICO: 0, ALTO: 1, MEDIO: 2, BAIXO: 3 };
findings.sort((a, b) => order[a.level] - order[b.level] || a.file.localeCompare(b.file));

console.log('\nSIG-GCM Brasil — Auditoria estática de segurança\n');
if (!findings.length) {
  console.log('✅ Nenhum achado nas regras estáticas configuradas.');
  process.exit(0);
}
for (const item of findings) {
  console.log(`[${item.level}] ${item.file}\n  ${item.message}\n`);
}
const critical = findings.filter((f) => f.level === 'CRITICO').length;
const high = findings.filter((f) => f.level === 'ALTO').length;
console.log(`Resumo: ${critical} crítico(s), ${high} alto(s), ${findings.length} total.`);
process.exit(critical > 0 ? 2 : 0);
