import { createApp } from "./app";
import { config } from "./config";
import { ensureBootstrapMaster } from "./services";

async function bootstrap() {
  const app = createApp();
  if (!Number.isFinite(config.port) || config.port <= 0 || config.port > 65535) {
    throw new Error(`PORT inválido: ${String(process.env.PORT)}`);
  }

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(config.port, "0.0.0.0", () => resolve());
    server.on("error", reject);
  });

  // eslint-disable-next-line no-console
  console.log("[credilix-acessos] API + UI (se web/dist existir)");
  // eslint-disable-next-line no-console
  console.log(`[credilix-acessos] http://127.0.0.1:${config.port}  |  health: /api/health`);
  // eslint-disable-next-line no-console
  console.log(`Master seed (após Supabase OK): ${config.bootstrapMasterEmail} / ${config.bootstrapMasterPassword}`);
  // eslint-disable-next-line no-console
  console.log("[credilix-acessos] Sincronizando com Supabase…");

  ensureBootstrapMaster()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log("[credilix-acessos] Supabase OK — Master e tenant verificados.");
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(
        "[credilix-acessos] Falha ao falar com o Supabase (login e dados não funcionam). Verifique SUPABASE_URL / rede / projeto ativo no dashboard.",
        error,
      );
    });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start API", error);
  process.exit(1);
});
