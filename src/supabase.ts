import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
}

function readJwtRole(jwt: string): string | undefined {
  const parts = jwt.split(".");
  if (parts.length !== 3) {
    return undefined;
  }
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(json) as { role?: string };
    return payload.role;
  } catch {
    return undefined;
  }
}

const keyRole = readJwtRole(config.supabaseServiceRoleKey);
if (keyRole === "anon" || keyRole === "authenticated") {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY está com a chave errada (parece "anon" ou JWT de usuário). ' +
      "No Supabase: Settings → API → copie o secret **service_role** (não a anon public). " +
      "Com anon, o PostgREST aplica RLS e inserts falham (ex.: tabela tenants).",
  );
}

export const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
