import { createApp } from "./app";
import { config } from "./config";
import { ensureBootstrapMaster } from "./services";

async function bootstrap() {
  await ensureBootstrapMaster();
  const app = createApp();
  if (!Number.isFinite(config.port) || config.port <= 0 || config.port > 65535) {
    throw new Error(`PORT inválido: ${String(process.env.PORT)}`);
  }
  app.listen(config.port, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log("[credilix-acessos] API + UI (se web/dist existir)");
    // eslint-disable-next-line no-console
    console.log(`[credilix-acessos] http://127.0.0.1:${config.port}  |  health: /api/health`);
    // eslint-disable-next-line no-console
    console.log(`Master seed: ${config.bootstrapMasterEmail} / ${config.bootstrapMasterPassword}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start API", error);
  process.exit(1);
});
