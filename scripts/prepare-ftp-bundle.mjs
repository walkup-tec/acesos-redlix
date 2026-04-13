/**
 * Pacote para publicação (FTP / upload manual), no mesmo espírito do projeto Waba.
 *
 * Gera backend (tsc) + UI (Vite), copia artefactos para ftp-bundle/ e corre npm ci --omit=dev lá dentro.
 *
 * Uso: npm run bundle:ftp
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const out = path.join(root, "ftp-bundle");

function rimraf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

console.log("[bundle:ftp] npm run build (backend tsc)");
execSync("npm run build", { cwd: root, stdio: "inherit" });

console.log("[bundle:ftp] npm run build:web (Vite)");
execSync("npm run build:web", { cwd: root, stdio: "inherit" });

const serverEntry = path.join(root, "dist", "server.js");
if (!fs.existsSync(serverEntry)) {
  console.error("[bundle:ftp] dist/server.js não encontrado após build.");
  process.exit(1);
}

const webIndex = path.join(root, "web", "dist", "index.html");
if (!fs.existsSync(webIndex)) {
  console.error("[bundle:ftp] web/dist/index.html não encontrado após build:web.");
  process.exit(1);
}

console.log("[bundle:ftp] limpando e criando ftp-bundle/");
rimraf(out);
fs.mkdirSync(out, { recursive: true });

for (const f of ["package.json", "package-lock.json"]) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) {
    console.error("Falta:", f);
    process.exit(1);
  }
  fs.copyFileSync(p, path.join(out, f));
}

copyDir(path.join(root, "dist"), path.join(out, "dist"));
copyDir(path.join(root, "web", "dist"), path.join(out, "web", "dist"));

const publicBranding = path.join(root, "public", "branding");
const publicBrandingDest = path.join(out, "public", "branding");
if (fs.existsSync(publicBranding)) {
  copyDir(publicBranding, publicBrandingDest);
} else {
  fs.mkdirSync(publicBrandingDest, { recursive: true });
}

const uploadsDest = path.join(out, "uploads");
fs.mkdirSync(uploadsDest, { recursive: true });

const envExample = path.join(root, ".env.example");
if (fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, path.join(out, "ENV-EXEMPLO.txt"));
}

console.log("[bundle:ftp] npm ci --omit=dev (dentro de ftp-bundle/)");
execSync("npm ci --omit=dev", { cwd: out, stdio: "inherit" });

const readme = `Credilix Acessos — pacote para publicar
${"=".repeat(42) }

Domínio de produção (referência): https://acessos.credilixpromotora.com.br/

CONTEÚDO
  dist/           → API compilada (Node)
  web/dist/       → UI estática servida pelo Express
  public/branding → logos e assets públicos
  uploads/        → ficheiros enviados (gravável pelo processo Node)
  node_modules/   → dependências de produção

ARRANQUE (servidor com Node.js 20+)
  cd pasta-onde-enviou-o-pacote
  node dist/server.js

  Defina antes (ficheiro .env na mesma pasta que package.json):
    PORT=<porta do host — muitos painéis definem PORT automaticamente>
    APP_BASE_URL=https://acessos.credilixpromotora.com.br
    JWT_SECRET=<segredo forte>
    SUPABASE_URL=...
    SUPABASE_SERVICE_ROLE_KEY=...
    MAIL_MODE=smtp + SMTP_* + MAIL_FROM (produção)

  A UI em produção usa a mesma origem: mantenha VITE_API_BASE_URL vazio no build.

FTP × NODE
  Hospedagem só com FTP + PHP em geral NÃO executa Node.
  Precisa de VPS, Node no cPanel, Easypanel, PM2, systemd, ou proxy reverso para um processo Node.

HTTPS
  Convites e links em e-mail exigem APP_BASE_URL em https://

Gerado em: ${new Date().toISOString()}
`;

fs.writeFileSync(path.join(out, "LEIA-ME.txt"), readme, "utf8");

console.log("[bundle:ftp] OK → pasta:", out);
