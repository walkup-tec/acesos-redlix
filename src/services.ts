import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { AuthContext, signInviteToken, signToken, verifyInviteToken } from "./auth";
import { trySendMail } from "./mailer";
import { CommissionTable, ContentItem, Product, Tenant, TenantUser, UserRole } from "./types";
import { supabase } from "./supabase";
import { config } from "./config";

function nowIso(): string {
  return new Date().toISOString();
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

function provisionalFullNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim();
  if (!local) {
    return "Novo usuário";
  }
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
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
  createdAt: string;
  updatedAt: string;
};

export function toPublicTenantUser(user: TenantUser): PublicTenantUser {
  return {
    id: user.id,
    tenantId: user.tenantId,
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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
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
  const { error } = await supabase.from("users").insert({
    id: uuid(),
    tenant_id: tenantId,
    full_name: "Master Credilix",
    email: config.bootstrapMasterEmail.toLowerCase(),
    role: "MASTER",
    status: "ACTIVE",
    can_manage_users: true,
    perm_view_contents: true,
    perm_create_managers: true,
    perm_create_sellers: true,
    perm_commission_tables: true,
    perm_contents: true,
    password_hash: masterPasswordHash,
    first_access_verified_at: nowIso(),
  });

  if (error) {
    throw error;
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
  emailSent: boolean;
  emailError?: string;
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
  return { userId: data.id, email: data.email, fullName: data.full_name };
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

  const email = payload.email.toLowerCase();
  const { data: exists } = await supabase
    .from("users")
    .select("id")
    .eq("tenant_id", auth.tenantId)
    .eq("email", email)
    .maybeSingle<{ id: string }>();
  if (exists?.id) {
    throw new Error("E-mail já cadastrado neste tenant.");
  }

  const p = payload.permissions;
  const user: TenantUser = {
    id: uuid(),
    tenantId: auth.tenantId,
    fullName: provisionalFullNameFromEmail(email),
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
  const { error } = await supabase.from("users").insert(toUserInsert(user));
  if (error) {
    throw error;
  }

  const inviteJwt = signInviteToken(user.id);
  const base = config.appBaseUrl.replace(/\/$/, "");
  const inviteLink = `${base}/convite?token=${encodeURIComponent(inviteJwt)}`;
  const subject = `Convite — ${config.branding.name}`;
  const text = `Olá,\n\nVocê foi convidado para acessar o painel ${config.branding.name}.\n\nComplete seu cadastro pelo link abaixo (válido por 7 dias):\n\n${inviteLink}\n\nSe você não esperava este e-mail, ignore.\n`;

  const mailResult = await trySendMail({ to: user.email, subject, text });
  return {
    user,
    inviteLink,
    emailSent: mailResult.ok,
    emailError: mailResult.ok ? undefined : mailResult.error,
  };
}

export async function completeRegistration(
  userId: string,
  payload: {
    fullName: string;
    cpf: string;
    rg: string;
    birthDate: string;
    address: string;
    password: string;
    identityPath: string;
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

  const { error } = await supabase
    .from("users")
    .update({
      full_name: payload.fullName,
      cpf: payload.cpf,
      rg: payload.rg,
      birth_date: payload.birthDate,
      address: payload.address,
      identity_document_path: payload.identityPath,
      address_proof_path: payload.addressProofPath,
      password_hash: await bcrypt.hash(payload.password, 10),
      status: "PENDING_APPROVAL",
      updated_at: nowIso(),
    })
    .eq("id", userId);
  if (error) {
    throw error;
  }
  user.fullName = payload.fullName;
  user.status = "PENDING_APPROVAL";
  return user;
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
  if (user.status !== "PENDING_APPROVAL") {
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

  const base = config.appBaseUrl.replace(/\/$/, "");
  const ativarUrl = `${base}/ativar`;
  const subject = `Conta aprovada — ${config.branding.name}`;
  const text = `Olá ${user.fullName},\n\nSua conta no painel ${config.branding.name} foi aprovada.\n\nPara validar o primeiro acesso, abra a página abaixo e informe seu e-mail e o código:\n${ativarUrl}\n\nCódigo de 6 dígitos: ${user.verificationCode}\n\nDepois, faça login com seu e-mail e a senha definida no cadastro.\n`;
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
  return toPublicTenantUser(user);
}

export async function listUsers(auth: AuthContext): Promise<TenantUser[]> {
  const { data, error } = await supabase.from("users").select("*").eq("tenant_id", auth.tenantId);
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => mapUser(row as Record<string, unknown>));
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
  const { error } = await supabase.from("commission_tables").insert({
    id: table.id,
    tenant_id: table.tenantId,
    product_id: table.productId,
    bank: table.bank,
    name: table.name,
    deadline: table.deadline,
    commission_percent: table.commissionPercent,
    observation: table.observation ?? null,
    created_by: table.createdBy,
    created_at: table.createdAt,
  });
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

export async function createContent(
  auth: AuthContext,
  payload: { title: string; type: ContentItem["type"]; filePath: string; productId?: string },
): Promise<ContentItem> {
  assertCanEditContents(auth);
  const content: ContentItem = {
    id: uuid(),
    tenantId: auth.tenantId,
    title: payload.title,
    type: payload.type,
    filePath: payload.filePath,
    productId: payload.productId,
    createdBy: auth.userId,
    createdAt: nowIso(),
  };
  const { error } = await supabase.from("contents").insert({
    id: content.id,
    tenant_id: content.tenantId,
    title: content.title,
    type: content.type,
    product_id: content.productId ?? null,
    file_path: content.filePath,
    created_by: content.createdBy,
    created_at: content.createdAt,
  });
  if (error) {
    throw error;
  }
  return content;
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
    type: row.type as ContentItem["type"],
    productId: row.product_id ? String(row.product_id) : undefined,
    filePath: String(row.file_path),
    createdBy: String(row.created_by),
    createdAt: String(row.created_at),
  }));
}

function mapUser(row: Record<string, unknown>): TenantUser {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    fullName: String(row.full_name),
    email: String(row.email),
    role: row.role as UserRole,
    status: String(row.status) as TenantUser["status"],
    canManageUsers: Boolean(row.can_manage_users),
    permViewContents: Boolean(row.perm_view_contents),
    permCreateManagers: Boolean(row.perm_create_managers),
    permCreateSellers: Boolean(row.perm_create_sellers),
    permCommissionTables: Boolean(row.perm_commission_tables),
    permContents: Boolean(row.perm_contents),
    passwordHash: row.password_hash ? String(row.password_hash) : undefined,
    profile:
      row.cpf || row.rg || row.birth_date || row.address
        ? {
            cpf: String(row.cpf ?? ""),
            rg: String(row.rg ?? ""),
            birthDate: String(row.birth_date ?? ""),
            address: String(row.address ?? ""),
          }
        : undefined,
    documents:
      row.identity_document_path || row.address_proof_path
        ? {
            identityPath: String(row.identity_document_path ?? ""),
            addressProofPath: String(row.address_proof_path ?? ""),
          }
        : undefined,
    verificationCode: row.verification_code ? String(row.verification_code) : undefined,
    firstAccessVerifiedAt: row.first_access_verified_at ? String(row.first_access_verified_at) : undefined,
    resetCode: row.reset_code ? String(row.reset_code) : undefined,
    createdAt: String(row.created_at ?? nowIso()),
    updatedAt: String(row.updated_at ?? nowIso()),
  };
}

function toUserInsert(user: TenantUser): Record<string, unknown> {
  return {
    id: user.id,
    tenant_id: user.tenantId,
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

