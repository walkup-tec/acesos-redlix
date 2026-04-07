import dotenv from "dotenv";

// Garante que `.env` do projeto prevaleça sobre `PORT` herdado do sistema (ex.: 5000 no Windows).
dotenv.config({ override: true });

const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:5050";

function parseMailMode(raw: string | undefined): "off" | "log" | "smtp" {
  if (raw === "smtp" || raw === "log" || raw === "off") {
    return raw;
  }
  return "log";
}

export const config = {
  port: Number(process.env.PORT ?? 5050),
  jwtSecret: process.env.JWT_SECRET ?? "change-this-secret",
  appBaseUrl,
  exposeEmailCodesInApi: process.env.DEBUG_EXPOSE_EMAIL_CODES === "true",
  mail: {
    mode: parseMailMode(process.env.MAIL_MODE),
    from: process.env.MAIL_FROM ?? "",
    smtp: {
      host: process.env.SMTP_HOST ?? "",
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER ?? "",
      pass: process.env.SMTP_PASS ?? "",
    },
  },
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  bootstrapTenantName: process.env.BOOTSTRAP_TENANT_NAME ?? "Credilix",
  bootstrapMasterEmail: process.env.BOOTSTRAP_MASTER_EMAIL ?? "master@credilix.local",
  bootstrapMasterPassword: process.env.BOOTSTRAP_MASTER_PASSWORD ?? "Master@123",
  branding: {
    name: "Credilix",
    logoUrl: process.env.BRANDING_LOGO_URL ?? `${appBaseUrl}/branding-assets/logo-credilix-dark.png`,
    colors: {
      primary: "#86209A",
      secondary: "#DF9E0C",
      accent: "#F64F67",
      foreground: "#2D1F35",
      background: "#FCFCFC",
    },
  },
};
