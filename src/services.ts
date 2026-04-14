import bcrypt from "bcryptjs";
import fs from "node:fs/promises";
import path from "node:path";
import { v4 as uuid } from "uuid";
import { AuthContext, signInviteToken, signToken, verifyInviteToken } from "./auth";
import { buildInviteEmailHtml, trySendMail } from "./mailer";
import { Bank, CommissionTable, ContentItem, ContentType, Product, Tenant, TenantUser, UserRole, UserStatus } from "./types";
import { supabase } from "./supabase";
import { config } from "./config";

const uploadsRoot = path.resolve(process.cwd(), "uploads");
const CONTENT_FOLDER_MARKER_PREFIX = "__folder__/";
let cachedHasSystemCodeColumn: boolean | null = null;
let cachedHasStatusReasonColumn: boolean | null = null;
let cachedHasContentDisplayNameColumn: boolean | null = null;
let cachedHasCommissionObservationColumn: boolean | null = null;

export function errorMessageFromUnknown(e: unknown): string {
  if (e instanceof Error) {
    const m = e.message?.trim();
    if (m) {
      return m;
    }
  }
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) {
      return m.trim();
    }
  }
  if (e && typeof e === "object" && "details" in e) {
    const d = (e as { details?: unknown }).details;
    if (typeof d === "string" && d.trim()) {
      return d.trim();
    }
  }
  try {
    const s = JSON.stringify(e);
    if (typeof s === "string" && s !== "undefined") {
      return s;
    }
  } catch {
    /* ignore */
  }
  return "Erro desconhecido.";
}

function assertResolvedFileInsideUploads(absolutePath: string): void {
  const root = path.resolve(uploadsRoot);
  const resolved = path.resolve(absolutePath);
  if (process.platform === "win32") {
    const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
    if (!resolved.toLowerCase().startsWith(rootWithSep.toLowerCase())) {
      throw new Error("Arquivo inválido.");
    }
    return;
  }
  const rel = path.relative(root, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("Arquivo inválido.");
  }
}

function mimeTypeForContentType(type: ContentType): string {
  switch (type) {
    case "PDF":
      return "application/pdf";
    case "PNG":
      return "image/png";
    case "JPEG":
    case "IMAGE":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

async function hasSystemCodeColumn(): Promise<boolean> {
  if (cachedHasSystemCodeColumn !== null) {
    return cachedHasSystemCodeColumn;
  }
  const { error } = await supabase.from("users").select("system_code").limit(1);
  if (!error) {
    cachedHasSystemCodeColumn = true;
    return true;
  }
  if (typeof error === "object" && error && "code" in error && (error as { code?: unknown }).code === "42703") {
    cachedHasSystemCodeColumn = false;
    return false;
  }
  throw error;
}

async function hasStatusReasonColumn(): Promise<boolean> {
  if (cachedHasStatusReasonColumn !== null) {
    return cachedHasStatusReasonColumn;
  }
  const { error } = await supabase.from("users").select("status_reason").limit(1);
  if (!error) {
    cachedHasStatusReasonColumn = true;
    return true;
  }
  if (typeof error === "object" && error && "code" in error && (error as { code?: unknown }).code === "42703") {
    cachedHasStatusReasonColumn = false;
    return false;
  }
  throw error;
}

async function hasContentDisplayNameColumn(): Promise<boolean> {
  if (cachedHasContentDisplayNameColumn !== null) {
    return cachedHasContentDisplayNameColumn;
  }
  const { error } = await supabase.from("contents").select("display_name").limit(1);
  if (!error) {
    cachedHasContentDisplayNameColumn = true;
    return true;
  }
  if (typeof error === "object" && error && "code" in error && (error as { code?: unknown }).code === "42703") {
    cachedHasContentDisplayNameColumn = false;
    return false;
  }
  throw error;
}

async function hasCommissionObservationColumn(): Promise<boolean> {
  if (cachedHasCommissionObservationColumn !== null) {
    return cachedHasCommissionObservationColumn;
  }
  const { error } = await supabase.from("commission_tables").select("observation").limit(1);
  if (!error) {
    cachedHasCommissionObservationColumn = true;
    return true;
  }
  if (typeof error === "object" && error && "code" in error && (error as { code?: unknown }).code === "42703") {
    cachedHasCommissionObservationColumn = false;
    return false;
  }
  if (typeof error === "object" && error && "code" in error && (error as { code?: unknown }).code === "PGRST204") {
    cachedHasCommissionObservationColumn = false;
    return false;
  }
  throw error;
}

function normalizeBirthDateInput(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) {
    const [, dd, mm, yyyy] = br;
    const iso = `${yyyy}-${mm}-${dd}`;
    const date = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) {
      throw new Error("Data de nascimento inválida.");
    }
    if (date.getUTCFullYear() !== Number(yyyy) || date.getUTCMonth() + 1 !== Number(mm) || date.getUTCDate() !== Number(dd)) {
      throw new Error("Data de nascimento inválida.");
    }
    return iso;
  }

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return value;
  }

  throw new Error("Data de nascimento deve estar no formato DD/MM/AAAA.");
}

function rolePrefix(role: UserRole): string {
  switch (role) {
    case "VENDEDOR":
      return "V";
    case "LIDER":
      return "L";
    case "SUPORTE":
      return "S";
    case "MASTER":
    default:
      return "M";
  }
}

function legacySystemCodeFromId(userId: string, role: UserRole): string {
  const prefix = rolePrefix(role);
  let acc = 0;
  for (let i = 0; i < userId.length; i += 1) {
    acc = (acc * 31 + userId.charCodeAt(i)) % 10000;
  }
  const numeric = String(acc).padStart(4, "0");
  return `${prefix}-${numeric}`;
}

async function generateUniqueSystemCode(tenantId: string, role: UserRole, excludeUserId?: string): Promise<string> {
  const prefix = rolePrefix(role);
  if (!(await hasSystemCodeColumn())) {
    const number = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    return `${prefix}-${number}`;
  }
  for (let attempt = 0; attempt < 250; attempt += 1) {
    const number = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    const code = `${prefix}-${number}`;
    let query = supabase.from("users").select("id").eq("tenant_id", tenantId).eq("system_code", code);
    if (excludeUserId) {
      query = query.neq("id", excludeUserId);
    }
    const { data, error } = await query.maybeSingle<{ id: string }>();
    if (error) {
      throw error;
    }
    if (!data?.id) {
      return code;
    }
  }
  throw new Error("Não foi possível gerar um ID de sistema único.");
}

function generateTemporaryPassword(length = 10): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}

function extractMissingColumnFromSchemaError(error: unknown): string | null {
  const message =
    typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : "";
  const match = message.match(/Could not find the '([^']+)' column/i);
  return match ? match[1] : null;
}

function randomCode(length = 6): string {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

function assertCanManageUsers(auth: AuthContext): void {
  if (!(auth.role === "MASTER" || auth.canManageUsers)) {
    throw new Error("Sem permissão para gerenciar usuários.");
  }
}

function isMasterAuth(auth: AuthContext): boolean {
  return auth.role === "MASTER";
}

export type InviteUserPermissions = {
  role: UserRole;
  canManageUsers: boolean;
  permViewContents: boolean;
  permCreateManagers: boolean;
  permCreateSellers: boolean;
  permCommissionTables: boolean;
  permContents: boolean;
};

function assertInviterCanGrant(auth: AuthContext, permissions: InviteUserPermissions): void {
  if (isMasterAuth(auth)) {
    return;
  }
  if (permissions.canManageUsers && !auth.canManageUsers) {
    throw new Error("Você não pode conceder a permissão: autorizar/ativar usuários.");
  }
  if (permissions.permViewContents && !auth.permViewContents && !auth.permContents) {
    throw new Error("Você não pode conceder a permissão: acessar conteúdo.");
  }
  if (permissions.permCreateManagers && !auth.permCreateManagers) {
    throw new Error("Você não pode conceder a permissão: criar usuários gestores.");
  }
  if (permissions.permCreateSellers && !auth.permCreateSellers) {
    throw new Error("Você não pode conceder a permissão: criar usuários vendedores.");
  }
  if (permissions.permCommissionTables && !auth.permCommissionTables) {
    throw new Error("Você não pode conceder a permissão: tabelas de comissão.");
  }
  if (permissions.permContents && !auth.permContents) {
    throw new Error("Você não pode conceder a permissão: conteúdos.");
  }
}

function hasAnyInvitePermission(p: InviteUserPermissions): boolean {
  return (
    p.canManageUsers ||
    p.permViewContents ||
    p.permCreateManagers ||
    p.permCreateSellers ||
    p.permCommissionTables ||
    p.permContents
  );
}

/** Valor de `users.full_name` enquanto o convite não foi concluído; visível no painel até o cadastro do convidado. */
export const INVITED_PENDING_FULL_NAME = "(Aguardando Validação)";

function normalizeInviteEmail(raw: string): string {
  return raw.normalize("NFC").trim().toLowerCase();
}

function assertCanEditCommissionTables(auth: AuthContext): void {
  if (!isMasterAuth(auth) && !auth.permCommissionTables) {
    throw new Error("Sem permissão para criar ou editar tabelas de comissão.");
  }
}

function assertCanEditContents(auth: AuthContext): void {
  if (!isMasterAuth(auth) && !auth.permContents) {
    throw new Error("Sem permissão para criar ou editar conteúdos.");
  }
}

function assertCanViewContents(auth: AuthContext): void {
  if (!isMasterAuth(auth) && !auth.permViewContents && !auth.permContents) {
    throw new Error("Sem permissão para acessar conteúdos.");
  }
}

export type PublicTenantUser = {
  id: string;
  tenantId: string;
  systemCode?: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: TenantUser["status"];
  canManageUsers: boolean;
  permViewContents: boolean;
  permCreateManagers: boolean;
  permCreateSellers: boolean;
  permCommissionTables: boolean;
  permContents: boolean;
  profile?: TenantUser["profile"];
  documents?: TenantUser["documents"];
  firstAccessVerifiedAt?: string;
  statusReason?: string;
  createdAt: string;
  updatedAt: string;
};

export function toPublicTenantUser(user: TenantUser): PublicTenantUser {
  return {
    id: user.id,
    tenantId: user.tenantId,
    systemCode: user.systemCode,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    canManageUsers: user.canManageUsers,
    permViewContents: user.permViewContents,
    permCreateManagers: user.permCreateManagers,
    permCreateSellers: user.permCreateSellers,
    permCommissionTables: user.permCommissionTables,
    permContents: user.permContents,
    profile: user.profile,
    documents: user.documents,
    firstAccessVerifiedAt: user.firstAccessVerifiedAt,
    statusReason: user.statusReason,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/** Lista de usuários: anexos só para Master ou quem pode gerenciar usuários. */
export function toPublicTenantUserForViewer(user: TenantUser, auth: AuthContext): PublicTenantUser {
  const pub = toPublicTenantUser(user);
  if (auth.role !== "MASTER" && !auth.canManageUsers) {
    pub.documents = undefined;
  }
  return pub;
}

export async function ensureBootstrapMaster(): Promise<void> {
  const { data: existingTenant } = await supabase
    .from("tenants")
    .select("id,name,created_at")
    .eq("name", config.bootstrapTenantName)
    .maybeSingle<Tenant>();

  let tenantId = existingTenant?.id;
  if (!tenantId) {
    const { data: createdTenant, error: createTenantError } = await supabase
      .from("tenants")
      .insert({ id: uuid(), name: config.bootstrapTenantName })
      .select("id")
      .single<{ id: string }>();
    if (createTenantError) {
      throw createTenantError;
    }
    tenantId = createdTenant.id;
  }

  const { data: existingMaster } = await supabase
    .from("users")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", config.bootstrapMasterEmail.toLowerCase())
    .maybeSingle<{ id: string }>();

  if (existingMaster) {
    return;
  }

  const masterPasswordHash = await bcrypt.hash(config.bootstrapMasterPassword, 10);
  const masterSystemCode = await generateUniqueSystemCode(tenantId, "MASTER");
  const insertPayload: Record<string, unknown> = {
    id: uuid(),
    tenant_id: tenantId,
    full_name: "Master Credilix",
    email: config.bootstrapMasterEmail.toLowerCase(),
    role: "MASTER",
    status: "ACTIVE",
    system_code: masterSystemCode,
    can_manage_users: true,
    perm_view_contents: true,
    perm_create_managers: true,
    perm_create_sellers: true,
    perm_commission_tables: true,
    perm_contents: true,
    password_hash: masterPasswordHash,
    first_access_verified_at: nowIso(),
  };

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { error } = await supabase.from("users").insert(insertPayload);
    if (!error) {
      return;
    }
    const missingColumn = extractMissingColumnFromSchemaError(error);
    if (!missingColumn || !(missingColumn in insertPayload)) {
      throw error;
    }
    delete insertPayload[missingColumn];
  }
}

export async function login(email: string, password: string): Promise<{ token: string; user: PublicTenantUser }> {
  const { data: row, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle<Record<string, unknown>>();
  if (error) {
    throw error;
  }

  const user = row ? mapUser(row) : undefined;
  if (!user || !user.passwordHash) {
    throw new Error("Credenciais inválidas.");
  }
  if (!user.systemCode) {
    if (await hasSystemCodeColumn()) {
      user.systemCode = await generateUniqueSystemCode(user.tenantId, user.role, user.id);
      const { error: codeError } = await supabase
        .from("users")
        .update({ system_code: user.systemCode, updated_at: nowIso() })
        .eq("id", user.id)
        .eq("tenant_id", user.tenantId);
      if (codeError) {
        throw codeError;
      }
    } else {
      user.systemCode = legacySystemCodeFromId(user.id, user.role);
    }
  }
  if (user.status !== "ACTIVE") {
    throw new Error("Usuário não está ativo.");
  }
  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    throw new Error("Credenciais inválidas.");
  }

  const token = signToken({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    canManageUsers: user.canManageUsers,
    permViewContents: user.permViewContents,
    permCreateManagers: user.permCreateManagers,
    permCreateSellers: user.permCreateSellers,
    permCommissionTables: user.permCommissionTables,
    permContents: user.permContents,
  });
  return { token, user: toPublicTenantUser(user) };
}

export type InviteUserResult = {
  user: TenantUser;
  inviteLink: string;
  /** Sempre `true` quando a função retorna; falha de e-mail interrompe antes do `insert` no banco */
  emailSent: true;
};

export async function getInviteRegistrationContext(
  token: string,
): Promise<{ userId: string; email: string; fullName: string }> {
  const userId = verifyInviteToken(token);
  const { data, error } = await supabase
    .from("users")
    .select("id,email,full_name,status")
    .eq("id", userId)
    .maybeSingle<{ id: string; email: string; full_name: string; status: string }>();
  if (error) {
    throw error;
  }
  if (!data || data.status !== "INVITED") {
    throw new Error("Convite inválido ou cadastro já utilizado.");
  }
  const stored = data.full_name ?? "";
  const fullNameForForm =
    stored === INVITED_PENDING_FULL_NAME || stored.trim() === "" ? "" : stored;
  return { userId: data.id, email: data.email, fullName: fullNameForForm };
}

export async function inviteUser(
  auth: AuthContext,
  payload: { email: string; permissions: InviteUserPermissions },
): Promise<InviteUserResult> {
  assertCanManageUsers(auth);
  if (!hasAnyInvitePermission(payload.permissions)) {
    throw new Error("Selecione pelo menos uma permissão.");
  }
  assertInviterCanGrant(auth, payload.permissions);

  const email = normalizeInviteEmail(payload.email);
  const { data: exists, error: existsError } = await supabase
    .from("users")
    .select("id")
    .eq("tenant_id", auth.tenantId)
    .eq("email", email)
    .maybeSingle<{ id: string }>();
  if (existsError) {
    throw new Error(errorMessageFromUnknown(existsError));
  }
  if (exists?.id) {
    throw new Error("E-mail já cadastrado neste tenant.");
  }

  const p = payload.permissions;
  const shouldUseSystemCode = await hasSystemCodeColumn();
  const systemCode = shouldUseSystemCode ? await generateUniqueSystemCode(auth.tenantId, p.role) : undefined;
  const user: TenantUser = {
    id: uuid(),
    tenantId: auth.tenantId,
    systemCode,
    fullName: INVITED_PENDING_FULL_NAME,
    email,
    role: p.role,
    status: "INVITED",
    canManageUsers: p.canManageUsers,
    permViewContents: p.permViewContents,
    permCreateManagers: p.permCreateManagers,
    permCreateSellers: p.permCreateSellers,
    permCommissionTables: p.permCommissionTables,
    permContents: p.permContents,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const insertPayload = toUserInsert(user);
  if (!shouldUseSystemCode) {
    delete insertPayload.system_code;
  }

  const inviteJwt = signInviteToken(user.id);
  const base = config.appBaseUrl.replace(/\/$/, "");
  const inviteLink = `${base}/convite?token=${encodeURIComponent(inviteJwt)}`;
  const subject = `Convite — ${config.branding.name}`;
  const text = `Olá,\n\nVocê foi convidado para acessar o painel ${config.branding.name}.\n\nComplete seu cadastro pelo link abaixo (válido por 7 dias):\n\n${inviteLink}\n\nSe você não esperava este e-mail, ignore.\n`;

  const html = buildInviteEmailHtml({
    inviteLink,
    appName: config.branding.name,
    primaryColor: config.branding.colors.primary,
  });
  const mailResult = await trySendMail({ to: user.email, subject, text, html });
  if (!mailResult.ok) {
    throw new Error(
      `Não foi possível enviar o e-mail de convite. O usuário não foi criado. ${mailResult.error}`,
    );
  }

  const { error: insertError } = await supabase.from("users").insert(insertPayload);
  if (insertError) {
    throw new Error(
      `O convite foi enviado por e-mail, mas falhou ao gravar o usuário no banco: ${errorMessageFromUnknown(insertError)}. Entre em contato com o suporte; evite reenviar o convite até regularizar o cadastro.`,
    );
  }

  return {
    user,
    inviteLink,
    emailSent: true,
  };
}

function formatBrazilianAddressLine(parts: {
  street: string;
  addressNumber: string;
  addressComplement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}): string {
  const z = parts.zipCode.replace(/\D/g, "");
  const cep = z.length === 8 ? `${z.slice(0, 5)}-${z.slice(5)}` : parts.zipCode.trim();
  const comp = parts.addressComplement.trim();
  const main = `${parts.street.trim()}, ${parts.addressNumber.trim()}`;
  return `${main}${comp ? ` — ${comp}` : ""} — ${parts.neighborhood.trim()}, ${parts.city.trim()}/${parts.state.trim().toUpperCase()} — CEP ${cep}`;
}

export async function completeRegistration(
  userId: string,
  payload: {
    fullName: string;
    cpf: string;
    rg: string;
    birthDate: string;
    fatherName: string;
    motherName: string;
    zipCode: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    addressNumber: string;
    addressComplement: string;
    password: string;
    identityPath: string;
    identityBackPath: string;
    addressProofPath: string;
  },
): Promise<TenantUser> {
  const { data: row, error: findError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle<Record<string, unknown>>();
  if (findError) {
    throw findError;
  }
  const user = row ? mapUser(row) : undefined;
  if (!user) {
    throw new Error("Usuário não encontrado.");
  }
  if (user.status !== "INVITED") {
    throw new Error("Usuário já finalizou cadastro.");
  }

  const normalizedBirthDate = normalizeBirthDateInput(payload.birthDate);
  const composedAddress = formatBrazilianAddressLine({
    street: payload.street,
    addressNumber: payload.addressNumber,
    addressComplement: payload.addressComplement,
    neighborhood: payload.neighborhood,
    city: payload.city,
    state: payload.state,
    zipCode: payload.zipCode,
  });
  const zipDigits = payload.zipCode.replace(/\D/g, "");
  const { error } = await supabase
    .from("users")
    .update({
      full_name: payload.fullName.trim(),
      cpf: payload.cpf.replace(/\D/g, ""),
      rg: payload.rg.trim(),
      birth_date: normalizedBirthDate,
      address: composedAddress,
      father_name: payload.fatherName.trim(),
      mother_name: payload.motherName.trim(),
      zip_code: zipDigits.length === 8 ? `${zipDigits.slice(0, 5)}-${zipDigits.slice(5)}` : payload.zipCode.trim(),
      street: payload.street.trim(),
      neighborhood: payload.neighborhood.trim(),
      city: payload.city.trim(),
      state: payload.state.trim().toUpperCase().slice(0, 2),
      address_number: payload.addressNumber.trim(),
      address_complement: payload.addressComplement.trim() || null,
      identity_document_path: payload.identityPath,
      identity_document_back_path: payload.identityBackPath,
      address_proof_path: payload.addressProofPath,
      password_hash: await bcrypt.hash(payload.password, 10),
      status: "AWAITING_REVIEW",
      updated_at: nowIso(),
    })
    .eq("id", userId);
  if (error) {
    throw error;
  }
  const { data: updatedRow, error: reloadError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle<Record<string, unknown>>();
  if (reloadError) {
    throw reloadError;
  }
  if (!updatedRow) {
    throw new Error("Usuário não encontrado após atualização.");
  }
  return mapUser(updatedRow);
}

export async function approveUser(auth: AuthContext, userId: string): Promise<{ user: TenantUser; verificationCode: string }> {
  assertCanManageUsers(auth);
  const { data: row, error: findError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .eq("tenant_id", auth.tenantId)
    .maybeSingle<Record<string, unknown>>();
  if (findError) {
    throw findError;
  }
  const user = row ? mapUser(row) : undefined;
  if (!user) {
    throw new Error("Usuário não encontrado.");
  }
  if (user.status !== "PENDING_APPROVAL" && user.status !== "AWAITING_REVIEW") {
    throw new Error("Usuário não está pendente de aprovação.");
  }
  user.status = "ACTIVE";
  user.verificationCode = randomCode();
  const { error } = await supabase
    .from("users")
    .update({
      status: "ACTIVE",
      verification_code: user.verificationCode,
      updated_at: nowIso(),
    })
    .eq("id", userId);
  if (error) {
    throw error;
  }

  const accessUrl = config.appBaseUrl.replace(/\/$/, "") + "/";
  const subject = "Acesso ativado — Credilix";
  const text = `Olá ${user.fullName}!\nParabéns! Seu acesso ao conteúdo exclusivo da Credilix foi ativado.\nSegue os dados de acesso:\n\nAcesse: ${accessUrl}\nUsuário: ${user.email}\nSenha: a senha cadastrada por você\n\nPara dúvidas ou suporte, solicite ao seu gerente.\nAtenciosamente,\nEquipe Credilix`;
  await trySendMail({ to: user.email, subject, text });

  return { user, verificationCode: user.verificationCode };
}

export async function verifyFirstAccess(email: string, code: string): Promise<void> {
  const { data: row, error: findError } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle<Record<string, unknown>>();
  if (findError) {
    throw findError;
  }
  const user = row ? mapUser(row) : undefined;
  if (!user || user.verificationCode !== code) {
    throw new Error("Código inválido.");
  }
  const { error } = await supabase
    .from("users")
    .update({
      verification_code: null,
      first_access_verified_at: nowIso(),
      updated_at: nowIso(),
    })
    .eq("id", user.id);
  if (error) {
    throw error;
  }
}

export async function blockUser(auth: AuthContext, userId: string, blocked: boolean): Promise<TenantUser> {
  assertCanManageUsers(auth);
  const { data: row, error: findError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .eq("tenant_id", auth.tenantId)
    .maybeSingle<Record<string, unknown>>();
  if (findError) {
    throw findError;
  }
  const user = row ? mapUser(row) : undefined;
  if (!user) {
    throw new Error("Usuário não encontrado.");
  }
  user.status = blocked ? "BLOCKED" : "ACTIVE";
  const { error } = await supabase
    .from("users")
    .update({ status: user.status, updated_at: nowIso() })
    .eq("id", user.id);
  if (error) {
    throw error;
  }
  return user;
}

export type UpdateUserProfilePayload = {
  fullName: string;
  email: string;
  role: UserRole;
  cpf: string;
  rg: string;
  birthDate: string;
  address: string;
  reason: string;
  fatherName?: string;
  motherName?: string;
  zipCode?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  addressNumber?: string;
  addressComplement?: string;
};

export async function updateUserProfileByManager(
  auth: AuthContext,
  userId: string,
  payload: UpdateUserProfilePayload,
): Promise<TenantUser> {
  assertCanManageUsers(auth);
  const reason = payload.reason.trim();
  if (!reason) {
    throw new Error("Informe o motivo da alteração.");
  }

  const { data: row, error: findError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .eq("tenant_id", auth.tenantId)
    .maybeSingle<Record<string, unknown>>();
  if (findError) throw findError;
  const user = row ? mapUser(row) : undefined;
  if (!user) throw new Error("Usuário não encontrado.");

  const normalizedEmail = payload.email.toLowerCase().trim();
  const { data: duplicateEmail } = await supabase
    .from("users")
    .select("id")
    .eq("tenant_id", auth.tenantId)
    .eq("email", normalizedEmail)
    .neq("id", userId)
    .maybeSingle<{ id: string }>();
  if (duplicateEmail?.id) {
    throw new Error("Já existe outro usuário com este e-mail.");
  }

  const birthDate = normalizeBirthDateInput(payload.birthDate);
  const cpfDigits = payload.cpf.replace(/\D/g, "");
  if (cpfDigits.length !== 11) {
    throw new Error("CPF inválido.");
  }
  const shouldUseSystemCode = await hasSystemCodeColumn();
  let nextSystemCode = user.systemCode;
  if (shouldUseSystemCode && (!nextSystemCode || rolePrefix(user.role) !== rolePrefix(payload.role))) {
    nextSystemCode = await generateUniqueSystemCode(auth.tenantId, payload.role, userId);
  }
  const updatePayload: Record<string, unknown> = {
    full_name: payload.fullName.trim(),
    email: normalizedEmail,
    role: payload.role,
    cpf: cpfDigits,
    rg: payload.rg.trim(),
    birth_date: birthDate,
    address: payload.address.trim(),
    updated_at: nowIso(),
  };
  const z = payload.zipCode?.replace(/\D/g, "") ?? "";
  if (payload.fatherName !== undefined) {
    updatePayload.father_name = payload.fatherName.trim() || null;
  }
  if (payload.motherName !== undefined) {
    updatePayload.mother_name = payload.motherName.trim() || null;
  }
  if (payload.zipCode !== undefined) {
    updatePayload.zip_code = z.length === 8 ? `${z.slice(0, 5)}-${z.slice(5)}` : payload.zipCode.trim() || null;
  }
  if (payload.street !== undefined) {
    updatePayload.street = payload.street.trim() || null;
  }
  if (payload.neighborhood !== undefined) {
    updatePayload.neighborhood = payload.neighborhood.trim() || null;
  }
  if (payload.city !== undefined) {
    updatePayload.city = payload.city.trim() || null;
  }
  if (payload.state !== undefined) {
    const uf = payload.state.trim().toUpperCase().slice(0, 2);
    updatePayload.state = uf || null;
  }
  if (payload.addressNumber !== undefined) {
    updatePayload.address_number = payload.addressNumber.trim() || null;
  }
  if (payload.addressComplement !== undefined) {
    updatePayload.address_complement = payload.addressComplement.trim() || null;
  }
  if (await hasStatusReasonColumn()) {
    updatePayload.status_reason = reason;
  }
  if (shouldUseSystemCode) {
    updatePayload.system_code = nextSystemCode ?? null;
  }
  const { error: updateError } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", userId)
    .eq("tenant_id", auth.tenantId);
  if (updateError) throw updateError;

  const { data: updatedRow, error: reloadError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .eq("tenant_id", auth.tenantId)
    .single<Record<string, unknown>>();
  if (reloadError) throw reloadError;
  return mapUser(updatedRow);
}

export async function setUserLifecycleStatus(
  auth: AuthContext,
  userId: string,
  status: "ACTIVE" | "INACTIVE" | "BLOCKED",
  reason?: string,
): Promise<TenantUser> {
  assertCanManageUsers(auth);
  const cleanedReason = reason?.trim() ?? "";
  if ((status === "INACTIVE" || status === "BLOCKED") && !cleanedReason) {
    throw new Error("Informe o motivo da ação.");
  }
  const { data: row, error: findError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .eq("tenant_id", auth.tenantId)
    .maybeSingle<Record<string, unknown>>();
  if (findError) throw findError;
  const user = row ? mapUser(row) : undefined;
  if (!user) throw new Error("Usuário não encontrado.");

  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: nowIso(),
  };
  if (await hasStatusReasonColumn()) {
    updatePayload.status_reason = status === "ACTIVE" ? null : cleanedReason;
  }
  const { error: updateError } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", userId)
    .eq("tenant_id", auth.tenantId);
  if (updateError) throw updateError;
  user.status = status;
  user.statusReason = status === "ACTIVE" ? undefined : cleanedReason;
  return user;
}

export async function resetUserAccessByManager(auth: AuthContext, userId: string): Promise<TenantUser> {
  assertCanManageUsers(auth);
  const { data: row, error: findError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .eq("tenant_id", auth.tenantId)
    .maybeSingle<Record<string, unknown>>();
  if (findError) throw findError;
  const user = row ? mapUser(row) : undefined;
  if (!user) throw new Error("Usuário não encontrado.");

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const updatePayload: Record<string, unknown> = {
    password_hash: passwordHash,
    reset_code: null,
    updated_at: nowIso(),
  };
  if (await hasStatusReasonColumn()) {
    updatePayload.status_reason = "Reset de acesso executado por gestor.";
  }
  const { error: updateError } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", userId)
    .eq("tenant_id", auth.tenantId);
  if (updateError) throw updateError;

  const subject = `Reset de acesso — ${config.branding.name}`;
  const text = `Olá ${user.fullName},\n\nSeu acesso ao painel ${config.branding.name} foi resetado por um gestor.\n\nSenha temporária: ${temporaryPassword}\n\nRecomendamos trocar a senha no próximo acesso.\n`;
  await trySendMail({ to: user.email, subject, text });
  return user;
}

/** Não revela se o e-mail existe; só envia código quando o usuário está cadastrado. */
export async function forgotPassword(email: string): Promise<void> {
  const { data: row, error: findError } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle<Record<string, unknown>>();
  if (findError) {
    throw findError;
  }
  const user = row ? mapUser(row) : undefined;
  if (!user) {
    return;
  }
  user.resetCode = randomCode();
  const { error } = await supabase
    .from("users")
    .update({ reset_code: user.resetCode, updated_at: nowIso() })
    .eq("id", user.id);
  if (error) {
    throw error;
  }

  const base = config.appBaseUrl.replace(/\/$/, "");
  const subject = `Redefinição de senha — ${config.branding.name}`;
  const text = `Olá,\n\nFoi solicitada uma nova senha para o painel ${config.branding.name}.\n\nCódigo de 6 dígitos: ${user.resetCode}\n\nUse este código com seu e-mail na tela de login (opção esqueci a senha) ou em ${base}/ativar.\n\nSe não foi você, ignore este e-mail.\n`;
  await trySendMail({ to: user.email, subject, text });
}

export async function validateResetCode(email: string, resetCode: string): Promise<void> {
  const { data: row, error: findError } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle<Record<string, unknown>>();
  if (findError) {
    throw findError;
  }
  const user = row ? mapUser(row) : undefined;
  if (!user || user.resetCode !== resetCode) {
    throw new Error("Código de redefinição inválido.");
  }
}

export async function resetPassword(email: string, resetCode: string, newPassword: string): Promise<void> {
  const { data: row, error: findError } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle<Record<string, unknown>>();
  if (findError) {
    throw findError;
  }
  const user = row ? mapUser(row) : undefined;
  if (!user || user.resetCode !== resetCode) {
    throw new Error("Código de redefinição inválido.");
  }
  const { error } = await supabase
    .from("users")
    .update({
      password_hash: await bcrypt.hash(newPassword, 10),
      reset_code: null,
      updated_at: nowIso(),
    })
    .eq("id", user.id);
  if (error) {
    throw error;
  }
}

export async function getCurrentUserProfile(auth: AuthContext): Promise<PublicTenantUser> {
  const { data: row, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", auth.userId)
    .eq("tenant_id", auth.tenantId)
    .maybeSingle<Record<string, unknown>>();
  if (error) {
    throw error;
  }
  const user = row ? mapUser(row) : undefined;
  if (!user) {
    throw new Error("Usuário não encontrado.");
  }
  if (!user.systemCode) {
    if (await hasSystemCodeColumn()) {
      user.systemCode = await generateUniqueSystemCode(user.tenantId, user.role, user.id);
      const { error: codeError } = await supabase
        .from("users")
        .update({ system_code: user.systemCode, updated_at: nowIso() })
        .eq("id", user.id)
        .eq("tenant_id", user.tenantId);
      if (codeError) {
        throw codeError;
      }
    } else {
      user.systemCode = legacySystemCodeFromId(user.id, user.role);
    }
  }
  return toPublicTenantUser(user);
}

export async function listUsers(auth: AuthContext): Promise<TenantUser[]> {
  const { data, error } = await supabase.from("users").select("*").eq("tenant_id", auth.tenantId);
  if (error) {
    throw error;
  }
  const users = (data ?? []).map((row) => mapUser(row as Record<string, unknown>));
  if (await hasSystemCodeColumn()) {
    for (const user of users) {
      if (!user.systemCode) {
        const code = await generateUniqueSystemCode(user.tenantId, user.role, user.id);
        const { error: updateCodeError } = await supabase
          .from("users")
          .update({ system_code: code, updated_at: nowIso() })
          .eq("id", user.id)
          .eq("tenant_id", user.tenantId);
        if (updateCodeError) {
          throw updateCodeError;
        }
        user.systemCode = code;
      }
    }
  } else {
    for (const user of users) {
      if (!user.systemCode) {
        user.systemCode = legacySystemCodeFromId(user.id, user.role);
      }
    }
  }
  return users;
}

export async function createProduct(auth: AuthContext, name: string): Promise<Product> {
  const product: Product = {
    id: uuid(),
    tenantId: auth.tenantId,
    name,
    createdBy: auth.userId,
    createdAt: nowIso(),
  };
  const { error } = await supabase.from("products").insert({
    id: product.id,
    tenant_id: product.tenantId,
    name: product.name,
    created_by: product.createdBy,
    created_at: product.createdAt,
  });
  if (error) {
    throw error;
  }
  return product;
}

export async function listProducts(auth: AuthContext): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*").eq("tenant_id", auth.tenantId);
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => ({
    id: String(row.id),
    tenantId: String(row.tenant_id),
    name: String(row.name),
    createdBy: String(row.created_by),
    createdAt: String(row.created_at),
  }));
}

export async function createBank(auth: AuthContext, name: string): Promise<Bank> {
  const bank: Bank = {
    id: uuid(),
    tenantId: auth.tenantId,
    name,
    createdBy: auth.userId,
    createdAt: nowIso(),
  };
  const { error } = await supabase.from("banks").insert({
    id: bank.id,
    tenant_id: bank.tenantId,
    name: bank.name,
    created_by: bank.createdBy,
    created_at: bank.createdAt,
  });
  if (error) {
    throw error;
  }
  return bank;
}

export async function listBanks(auth: AuthContext): Promise<Bank[]> {
  const { data, error } = await supabase.from("banks").select("*").eq("tenant_id", auth.tenantId);
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => ({
    id: String(row.id),
    tenantId: String(row.tenant_id),
    name: String(row.name),
    createdBy: String(row.created_by),
    createdAt: String(row.created_at),
  }));
}

export async function createCommissionTable(
  auth: AuthContext,
  payload: { productId: string; bank: string; name: string; deadline: string; commissionPercent: number; observation?: string },
): Promise<CommissionTable> {
  assertCanEditCommissionTables(auth);
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", payload.productId)
    .eq("tenant_id", auth.tenantId)
    .maybeSingle<{ id: string }>();
  if (!product) {
    throw new Error("Produto não encontrado para este tenant.");
  }
  const table: CommissionTable = {
    id: uuid(),
    tenantId: auth.tenantId,
    productId: payload.productId,
    bank: payload.bank,
    name: payload.name,
    deadline: payload.deadline,
    commissionPercent: payload.commissionPercent,
    observation: payload.observation,
    createdBy: auth.userId,
    createdAt: nowIso(),
  };
  const rowToInsert: Record<string, unknown> = {
    id: table.id,
    tenant_id: table.tenantId,
    product_id: table.productId,
    bank: table.bank,
    name: table.name,
    deadline: table.deadline,
    commission_percent: table.commissionPercent,
    created_by: table.createdBy,
    created_at: table.createdAt,
  };
  if (await hasCommissionObservationColumn()) {
    rowToInsert.observation = table.observation?.trim() ? table.observation.trim() : null;
  }
  const { error } = await supabase.from("commission_tables").insert(rowToInsert);
  if (error) {
    throw error;
  }
  return table;
}

export async function listCommissionTables(auth: AuthContext, productId?: string): Promise<CommissionTable[]> {
  let query = supabase.from("commission_tables").select("*").eq("tenant_id", auth.tenantId);
  if (productId) {
    query = query.eq("product_id", productId);
  }
  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => ({
    id: String(row.id),
    tenantId: String(row.tenant_id),
    productId: String(row.product_id),
    bank: String(row.bank),
    name: String(row.name),
    deadline: String(row.deadline),
    commissionPercent: Number(row.commission_percent),
    observation: row.observation ? String(row.observation) : undefined,
    createdBy: String(row.created_by),
    createdAt: String(row.created_at),
  }));
}

export async function updateCommissionTable(
  auth: AuthContext,
  tableId: string,
  payload: { bank: string; name: string; deadline: string; commissionPercent: number; observation?: string },
): Promise<CommissionTable> {
  assertCanEditCommissionTables(auth);
  const updatePayload: Record<string, unknown> = {
    bank: payload.bank,
    name: payload.name,
    deadline: payload.deadline,
    commission_percent: payload.commissionPercent,
  };
  if (await hasCommissionObservationColumn()) {
    updatePayload.observation = payload.observation?.trim() ? payload.observation.trim() : null;
  }
  const { error } = await supabase
    .from("commission_tables")
    .update(updatePayload)
    .eq("id", tableId)
    .eq("tenant_id", auth.tenantId);
  if (error) {
    throw error;
  }
  const { data: row, error: reloadError } = await supabase
    .from("commission_tables")
    .select("*")
    .eq("id", tableId)
    .eq("tenant_id", auth.tenantId)
    .maybeSingle<Record<string, unknown>>();
  if (reloadError) {
    throw reloadError;
  }
  if (!row) {
    throw new Error("Tabela não encontrada.");
  }
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    productId: String(row.product_id),
    bank: String(row.bank),
    name: String(row.name),
    deadline: String(row.deadline),
    commissionPercent: Number(row.commission_percent),
    observation: row.observation ? String(row.observation) : undefined,
    createdBy: String(row.created_by),
    createdAt: String(row.created_at),
  };
}

export async function deleteCommissionTable(auth: AuthContext, tableId: string): Promise<void> {
  assertCanEditCommissionTables(auth);
  const { error } = await supabase
    .from("commission_tables")
    .delete()
    .eq("id", tableId)
    .eq("tenant_id", auth.tenantId);
  if (error) {
    throw error;
  }
}

export async function deleteCommissionTablesByProduct(auth: AuthContext, productId: string): Promise<number> {
  assertCanEditCommissionTables(auth);
  const { data: rows, error: listError } = await supabase
    .from("commission_tables")
    .select("id")
    .eq("tenant_id", auth.tenantId)
    .eq("product_id", productId);
  if (listError) {
    throw listError;
  }
  const total = (rows ?? []).length;
  if (total === 0) {
    return 0;
  }
  const { error } = await supabase
    .from("commission_tables")
    .delete()
    .eq("tenant_id", auth.tenantId)
    .eq("product_id", productId);
  if (error) {
    throw error;
  }
  return total;
}

export async function updateProductName(auth: AuthContext, productId: string, name: string): Promise<Product> {
  assertCanEditCommissionTables(auth);
  const normalized = name.trim();
  if (!normalized) {
    throw new Error("Nome do produto é obrigatório.");
  }
  const { error } = await supabase
    .from("products")
    .update({ name: normalized })
    .eq("id", productId)
    .eq("tenant_id", auth.tenantId);
  if (error) {
    throw error;
  }
  const { data: row, error: reloadError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("tenant_id", auth.tenantId)
    .maybeSingle<Record<string, unknown>>();
  if (reloadError) {
    throw reloadError;
  }
  if (!row) {
    throw new Error("Produto não encontrado.");
  }
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    name: String(row.name),
    createdBy: String(row.created_by),
    createdAt: String(row.created_at),
  };
}

export async function createContent(
  auth: AuthContext,
  payload: { title: string; type: ContentItem["type"]; filePath: string; productId?: string; displayName?: string },
): Promise<ContentItem> {
  assertCanEditContents(auth);
  const content: ContentItem = {
    id: uuid(),
    tenantId: auth.tenantId,
    title: payload.title,
    displayName: payload.displayName?.trim() || undefined,
    type: payload.type,
    filePath: payload.filePath,
    productId: payload.productId,
    createdBy: auth.userId,
    createdAt: nowIso(),
  };
  const rowToInsert: Record<string, unknown> = {
    id: content.id,
    tenant_id: content.tenantId,
    title: content.title,
    type: content.type,
    product_id: content.productId ?? null,
    file_path: content.filePath,
    created_by: content.createdBy,
    created_at: content.createdAt,
  };
  if (await hasContentDisplayNameColumn()) {
    rowToInsert.display_name = content.displayName ?? null;
  }
  const { error } = await supabase.from("contents").insert(rowToInsert);
  if (error) {
    throw error;
  }
  return content;
}

export async function createContentFolder(auth: AuthContext, folderPath: string): Promise<{ path: string }> {
  assertCanEditContents(auth);
  const normalized = folderPath
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
  if (!normalized) {
    throw new Error("Nome da pasta é obrigatório.");
  }
  const markerPath = `${CONTENT_FOLDER_MARKER_PREFIX}${normalized}`;
  const { data: existing, error: listError } = await supabase
    .from("contents")
    .select("id")
    .eq("tenant_id", auth.tenantId)
    .eq("type", "FOLDER")
    .eq("file_path", markerPath)
    .limit(1);
  if (listError) {
    throw listError;
  }
  if ((existing ?? []).length > 0) {
    return { path: normalized };
  }
  const { error } = await supabase.from("contents").insert({
    id: uuid(),
    tenant_id: auth.tenantId,
    title: normalized,
    type: "FOLDER",
    product_id: null,
    file_path: markerPath,
    created_by: auth.userId,
    created_at: nowIso(),
  });
  if (error) {
    throw error;
  }
  return { path: normalized };
}

export async function listContents(auth: AuthContext, type?: string): Promise<ContentItem[]> {
  assertCanViewContents(auth);
  let query = supabase.from("contents").select("*").eq("tenant_id", auth.tenantId);
  if (type) {
    query = query.eq("type", type);
  }
  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => ({
    id: String(row.id),
    tenantId: String(row.tenant_id),
    title: String(row.title),
    displayName: row.display_name ? String(row.display_name) : undefined,
    type: row.type as ContentItem["type"],
    productId: row.product_id ? String(row.product_id) : undefined,
    filePath: String(row.file_path),
    createdBy: String(row.created_by),
    createdAt: String(row.created_at),
  }));
}

export async function getContentFileForDownload(
  auth: AuthContext,
  contentId: string,
): Promise<{ absolutePath: string; mimeType: string }> {
  assertCanViewContents(auth);
  const { data: row, error } = await supabase
    .from("contents")
    .select("file_path,type")
    .eq("id", contentId)
    .eq("tenant_id", auth.tenantId)
    .maybeSingle<{ file_path: string; type: string }>();
  if (error) {
    throw new Error(errorMessageFromUnknown(error));
  }
  if (!row) {
    throw new Error("Conteúdo não encontrado.");
  }
  const baseName = path.basename(String(row.file_path));
  const absolutePath = path.resolve(uploadsRoot, baseName);
  assertResolvedFileInsideUploads(absolutePath);
  const mimeType = mimeTypeForContentType(row.type as ContentType);
  return { absolutePath, mimeType };
}

export async function deleteContentById(auth: AuthContext, contentId: string): Promise<void> {
  assertCanEditContents(auth);
  const { data: row, error } = await supabase
    .from("contents")
    .select("id,file_path")
    .eq("id", contentId)
    .eq("tenant_id", auth.tenantId)
    .maybeSingle<{ id: string; file_path: string }>();
  if (error) {
    throw new Error(errorMessageFromUnknown(error));
  }
  if (!row) {
    throw new Error("Conteúdo não encontrado.");
  }
  const baseName = path.basename(String(row.file_path));
  const absolutePath = path.resolve(uploadsRoot, baseName);
  assertResolvedFileInsideUploads(absolutePath);
  const { error: deleteError } = await supabase.from("contents").delete().eq("id", contentId).eq("tenant_id", auth.tenantId);
  if (deleteError) {
    throw new Error(errorMessageFromUnknown(deleteError));
  }
  try {
    await fs.unlink(absolutePath);
  } catch {
    /* arquivo já removido do disco */
  }
}

export async function deleteContentsByFolder(auth: AuthContext, folderPath: string): Promise<number> {
  assertCanEditContents(auth);
  const normalized = folderPath
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
  if (!normalized) {
    throw new Error("Pasta inválida para exclusão.");
  }
  const { data, error } = await supabase
    .from("contents")
    .select("id,title")
    .eq("tenant_id", auth.tenantId);
  if (error) {
    throw error;
  }
  const idsToDelete = (data ?? [])
    .filter((row) => {
      const title = String(row.title ?? "")
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean)
        .join("/");
      return title === normalized || title.startsWith(`${normalized}/`);
    })
    .map((row) => String(row.id));
  if (idsToDelete.length === 0) {
    return 0;
  }
  const { error: deleteError } = await supabase.from("contents").delete().in("id", idsToDelete).eq("tenant_id", auth.tenantId);
  if (deleteError) {
    throw deleteError;
  }
  return idsToDelete.length;
}

function mapUser(row: Record<string, unknown>): TenantUser {
  const firstAccessVerifiedAt = row.first_access_verified_at ? String(row.first_access_verified_at) : undefined;
  const hasProfileBase = Boolean(row.cpf || row.rg || row.birth_date || row.address);
  const hasProfileExt = Boolean(
    row.father_name ||
      row.mother_name ||
      row.zip_code ||
      row.street ||
      row.neighborhood ||
      row.city ||
      row.state ||
      row.address_number ||
      row.address_complement,
  );
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    systemCode: row.system_code ? String(row.system_code) : undefined,
    fullName: String(row.full_name),
    email: String(row.email),
    role: row.role as UserRole,
    status: String(row.status) as UserStatus,
    canManageUsers: Boolean(row.can_manage_users),
    permViewContents: Boolean(row.perm_view_contents),
    permCreateManagers: Boolean(row.perm_create_managers),
    permCreateSellers: Boolean(row.perm_create_sellers),
    permCommissionTables: Boolean(row.perm_commission_tables),
    permContents: Boolean(row.perm_contents),
    passwordHash: row.password_hash ? String(row.password_hash) : undefined,
    profile:
      hasProfileBase || hasProfileExt
        ? {
            cpf: String(row.cpf ?? ""),
            rg: String(row.rg ?? ""),
            birthDate: String(row.birth_date ?? ""),
            address: String(row.address ?? ""),
            fatherName: row.father_name ? String(row.father_name) : undefined,
            motherName: row.mother_name ? String(row.mother_name) : undefined,
            zipCode: row.zip_code ? String(row.zip_code) : undefined,
            street: row.street ? String(row.street) : undefined,
            neighborhood: row.neighborhood ? String(row.neighborhood) : undefined,
            city: row.city ? String(row.city) : undefined,
            state: row.state ? String(row.state) : undefined,
            addressNumber: row.address_number ? String(row.address_number) : undefined,
            addressComplement: row.address_complement ? String(row.address_complement) : undefined,
          }
        : undefined,
    documents:
      row.identity_document_path || row.identity_document_back_path || row.address_proof_path
        ? {
            identityPath: String(row.identity_document_path ?? ""),
            identityBackPath: row.identity_document_back_path ? String(row.identity_document_back_path) : undefined,
            addressProofPath: String(row.address_proof_path ?? ""),
          }
        : undefined,
    verificationCode: row.verification_code ? String(row.verification_code) : undefined,
    firstAccessVerifiedAt,
    resetCode: row.reset_code ? String(row.reset_code) : undefined,
    statusReason: row.status_reason ? String(row.status_reason) : undefined,
    createdAt: String(row.created_at ?? nowIso()),
    updatedAt: String(row.updated_at ?? nowIso()),
  };
}

function toUserInsert(user: TenantUser): Record<string, unknown> {
  return {
    id: user.id,
    tenant_id: user.tenantId,
    system_code: user.systemCode ?? null,
    full_name: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    can_manage_users: user.canManageUsers,
    perm_view_contents: user.permViewContents,
    perm_create_managers: user.permCreateManagers,
    perm_create_sellers: user.permCreateSellers,
    perm_commission_tables: user.permCommissionTables,
    perm_contents: user.permContents,
    password_hash: user.passwordHash ?? null,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

