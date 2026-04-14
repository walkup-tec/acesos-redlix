import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { z, ZodError } from "zod";
import { RequestWithAuth, requireAuth } from "./auth";
import { config } from "./config";
import {
  approveUser,
  blockUser,
  completeRegistration,
  createCommissionTable,
  createBank,
  createContent,
  createContentFolder,
  deleteCommissionTable,
  deleteCommissionTablesByProduct,
  createProduct,
  deleteContentById,
  deleteContentsByFolder,
  forgotPassword,
  getCurrentUserProfile,
  getInviteRegistrationContext,
  listCommissionTables,
  listBanks,
  listContents,
  listProducts,
  listUsers,
  login,
  resetPassword,
  validateResetCode,
  verifyFirstAccess,
  inviteUser,
  resetUserAccessByManager,
  setUserLifecycleStatus,
  toPublicTenantUser,
  toPublicTenantUserForViewer,
  updateCommissionTable,
  updateProductName,
  updateUserProfileByManager,
  getContentFileForDownload,
  errorMessageFromUnknown,
} from "./services";

const uploadDir = path.resolve(process.cwd(), "uploads");
const upload = multer({ dest: uploadDir });

function validationErrorMessage(error: ZodError): string {
  const issues = error.issues;
  if (!issues?.length) {
    return "Dados inválidos.";
  }
  return issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

export const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "credilix-acessos",
    /** Se não aparecer, não é este backend (ou está desatualizado). */
    features: { inviteEmailBeforeDb: true },
  });
});

router.get("/branding", (_req, res) => {
  res.json(config.branding);
});

/** Proxy ViaCEP (mesma origem): evita "Failed to fetch" no browser por CORS/rede. */
router.get("/cep/:digits", async (req, res) => {
  try {
    const raw = Array.isArray(req.params.digits) ? req.params.digits[0] : req.params.digits;
    const digits = String(raw ?? "").replace(/\D/g, "");
    if (digits.length !== 8) {
      res.status(400).json({ message: "CEP deve ter 8 dígitos." });
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    let upstream: Response;
    try {
      upstream = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!upstream.ok) {
      res.status(502).json({ message: "Serviço de CEP indisponível." });
      return;
    }
    const data = (await upstream.json()) as unknown;
    res.json(data);
  } catch {
    res.status(502).json({ message: "Não foi possível consultar o CEP. Verifique a conexão do servidor." });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
    const parsed = schema.parse(req.body);
    const result = await login(parsed.email, parsed.password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro de autenticação." });
  }
});

router.get("/auth/me", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const user = await getCurrentUserProfile(req.auth!);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao carregar perfil." });
  }
});

router.get("/auth/invite-context", async (req, res) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token) {
      throw new Error("Token do convite ausente.");
    }
    const ctx = await getInviteRegistrationContext(token);
    res.json(ctx);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Convite inválido." });
  }
});

router.post("/auth/verify-first-access", async (req, res) => {
  try {
    const schema = z.object({ email: z.string().email(), code: z.string().length(6) });
    const parsed = schema.parse(req.body);
    await verifyFirstAccess(parsed.email, parsed.code);
    res.json({ message: "Primeiro acesso validado." });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao validar acesso." });
  }
});

router.post("/auth/forgot-password", async (req, res) => {
  try {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.parse(req.body);
    await forgotPassword(parsed.email);
    const body: Record<string, unknown> = {
      message: "Se o e-mail estiver cadastrado, você receberá um código em instantes.",
    };
    if (config.exposeEmailCodesInApi) {
      body.debugNote = "DEBUG_EXPOSE_EMAIL_CODES ativo: ver resposta de desenvolvimento no servidor ou e-mail.";
    }
    res.json(body);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao gerar recuperação." });
  }
});

router.post("/auth/reset-password", async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      resetCode: z.string().length(6),
      newPassword: z.string().min(6),
    });
    const parsed = schema.parse(req.body);
    await resetPassword(parsed.email, parsed.resetCode, parsed.newPassword);
    res.json({ message: "Senha alterada com sucesso." });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao resetar senha." });
  }
});

router.post("/auth/validate-reset-code", async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      resetCode: z.string().length(6),
    });
    const parsed = schema.parse(req.body);
    await validateResetCode(parsed.email, parsed.resetCode);
    res.json({ message: "Código válido." });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao validar código." });
  }
});

router.post(
  "/users/:id/complete-registration",
  upload.fields([
    { name: "identityDocument", maxCount: 1 },
    { name: "identityDocumentBack", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const digitsCpf = z
        .string()
        .transform((s) => s.replace(/\D/g, ""))
        .refine((s) => s.length === 11, "CPF deve ter 11 dígitos.");
      const digitsCep = z
        .string()
        .transform((s) => s.replace(/\D/g, ""))
        .refine((s) => s.length === 8, "CEP deve ter 8 dígitos.");
      const uf = z
        .string()
        .trim()
        .transform((s) => s.toUpperCase())
        .refine((s) => /^[A-Z]{2}$/.test(s), "UF inválida.");
      const schema = z.object({
        fullName: z.string().trim().min(3),
        cpf: digitsCpf,
        rg: z.string().trim().min(5),
        birthDate: z.string().trim().min(8),
        fatherName: z.string().trim().min(3),
        motherName: z.string().trim().min(3),
        zipCode: digitsCep,
        street: z.string().trim().min(3),
        neighborhood: z.string().trim().min(2),
        city: z.string().trim().min(2),
        state: uf,
        addressNumber: z.string().trim().min(1),
        addressComplement: z.string().trim().optional().default(""),
        password: z.string().min(6),
      });
      const parsed = schema.parse(req.body);
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const identityPath = files?.identityDocument?.[0]?.path;
      const identityBackPath = files?.identityDocumentBack?.[0]?.path;
      const addressProofPath = files?.addressProof?.[0]?.path;
      if (!identityPath || !identityBackPath || !addressProofPath) {
        throw new Error("Envie documento de identificação (frente e verso) e comprovante de residência.");
      }
      const user = await completeRegistration(userId, {
        ...parsed,
        identityPath,
        identityBackPath,
        addressProofPath,
      });
      res.json(toPublicTenantUser(user));
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro no cadastro." });
    }
  },
);

router.get("/users", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const users = await listUsers(req.auth!);
    const auth = req.auth!;
    res.json(users.map((u) => toPublicTenantUserForViewer(u, auth)));
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao listar usuários." });
  }
});

router.post("/users/invite", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const perm = z.boolean();
    const schema = z.object({
      email: z.string().email(),
      permissions: z.object({
        role: z.enum(["LIDER", "VENDEDOR", "SUPORTE"]),
        canManageUsers: perm,
        permViewContents: perm,
        permCreateManagers: perm,
        permCreateSellers: perm,
        permCommissionTables: perm,
        permContents: perm,
      }),
    });
    const parsedResult = schema.safeParse(req.body);
    if (!parsedResult.success) {
      res.status(400).json({ message: validationErrorMessage(parsedResult.error) });
      return;
    }
    const result = await inviteUser(req.auth!, parsedResult.data);
    res.status(201).json({
      user: toPublicTenantUser(result.user),
      inviteLink: result.inviteLink,
      emailSent: result.emailSent,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[POST /api/users/invite]", error);
    res.status(400).json({ message: errorMessageFromUnknown(error) });
  }
});

router.post("/users/:id/approve", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await approveUser(req.auth!, userId);
    const body: Record<string, unknown> = {
      message: "Usuário aprovado. Um e-mail foi enviado com o código de primeiro acesso.",
      user: toPublicTenantUser(result.user),
    };
    if (config.exposeEmailCodesInApi) {
      body.debugVerificationCode = result.verificationCode;
    }
    res.json(body);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro na aprovação." });
  }
});

router.patch("/users/:id/block", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const schema = z.object({ blocked: z.boolean() });
    const parsed = schema.parse(req.body);
    const user = await blockUser(req.auth!, userId, parsed.blocked);
    res.json(toPublicTenantUser(user));
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao alterar bloqueio." });
  }
});

router.patch("/users/:id/status", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const schema = z.object({
      status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]),
      reason: z.string().trim().min(3).optional(),
    });
    const parsed = schema.parse(req.body);
    const user = await setUserLifecycleStatus(req.auth!, userId, parsed.status, parsed.reason);
    res.json(toPublicTenantUser(user));
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao alterar status do usuário." });
  }
});

router.post("/users/:id/reset-access", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await resetUserAccessByManager(req.auth!, userId);
    res.json({
      message: "Reset enviado por e-mail com senha temporária.",
      user: toPublicTenantUser(user),
    });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao resetar acesso do usuário." });
  }
});

router.put("/users/:id", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const schema = z.object({
      fullName: z.string().trim().min(3),
      email: z.string().email(),
      role: z.enum(["MASTER", "LIDER", "VENDEDOR", "SUPORTE"]),
      cpf: z
        .string()
        .trim()
        .transform((s) => s.replace(/\D/g, ""))
        .refine((s) => s.length === 11, "CPF inválido."),
      rg: z.string().trim().min(5),
      birthDate: z.string().trim().min(8),
      address: z.string().trim().min(8),
      reason: z.string().trim().min(3),
      fatherName: z.string().trim().optional(),
      motherName: z.string().trim().optional(),
      zipCode: z.string().trim().optional(),
      street: z.string().trim().optional(),
      neighborhood: z.string().trim().optional(),
      city: z.string().trim().optional(),
      state: z.string().trim().optional(),
      addressNumber: z.string().trim().optional(),
      addressComplement: z.string().trim().optional(),
    });
    const parsed = schema.parse(req.body);
    const user = await updateUserProfileByManager(req.auth!, userId, parsed);
    res.json(toPublicTenantUser(user));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string"
          ? String((error as { message: string }).message)
          : "Erro ao editar usuário.";
    res.status(400).json({ message });
  }
});

router.post("/products", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const schema = z.object({ name: z.string().min(3) });
    const parsed = schema.parse(req.body);
    const product = await createProduct(req.auth!, parsed.name);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao criar produto." });
  }
});

router.get("/products", requireAuth, async (req: RequestWithAuth, res) => {
  const items = await listProducts(req.auth!);
  res.json(items);
});

router.post("/banks", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const schema = z.object({ name: z.string().min(2) });
    const parsed = schema.parse(req.body);
    const bank = await createBank(req.auth!, parsed.name);
    res.status(201).json(bank);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao criar banco." });
  }
});

router.get("/banks", requireAuth, async (req: RequestWithAuth, res) => {
  const items = await listBanks(req.auth!);
  res.json(items);
});

router.post("/commission-tables", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const schema = z.object({
      productId: z.string().trim().min(1),
      bank: z.string().trim().min(1),
      name: z.string().trim().min(1),
      deadline: z.string().trim().min(1),
      commissionPercent: z.coerce.number().positive(),
      observation: z.string().trim().max(1000).optional(),
    });
    const parsed = schema.parse(req.body);
    const item = await createCommissionTable(req.auth!, parsed);
    res.status(201).json(item);
  } catch (error) {
    const unknownError = error as { message?: string; details?: string; hint?: string; code?: string } | null;
    const message =
      error instanceof Error
        ? error.message
        : typeof unknownError?.message === "string"
          ? unknownError.message
          : "Erro ao criar tabela.";
    console.error("[POST /api/commission-tables] erro:", unknownError ?? error);
    res.status(400).json({
      message,
      details: typeof unknownError?.details === "string" ? unknownError.details : undefined,
      hint: typeof unknownError?.hint === "string" ? unknownError.hint : undefined,
      code: typeof unknownError?.code === "string" ? unknownError.code : undefined,
    });
  }
});

router.get("/commission-tables", requireAuth, async (req: RequestWithAuth, res) => {
  const productId = req.query.productId?.toString();
  const items = await listCommissionTables(req.auth!, productId);
  res.json(items);
});

router.patch("/commission-tables/:id", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const tableId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const schema = z.object({
      bank: z.string().trim().min(1),
      name: z.string().trim().min(1),
      deadline: z.string().trim().min(1),
      commissionPercent: z.coerce.number().positive(),
      observation: z.string().trim().max(1000).optional(),
    });
    const parsed = schema.parse(req.body);
    const item = await updateCommissionTable(req.auth!, tableId, parsed);
    res.json(item);
  } catch (error) {
    const unknown = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown } | undefined;
    const message = error instanceof Error ? error.message : typeof unknown?.message === "string" ? unknown.message : "Erro ao editar tabela.";
    console.error("[PATCH /api/commission-tables/:id] erro:", error);
    res.status(400).json({
      message,
      details: typeof unknown?.details === "string" ? unknown.details : undefined,
      hint: typeof unknown?.hint === "string" ? unknown.hint : undefined,
      code: typeof unknown?.code === "string" ? unknown.code : undefined,
    });
  }
});

router.delete("/commission-tables/:id", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const tableId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteCommissionTable(req.auth!, tableId);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao excluir tabela." });
  }
});

router.delete("/commission-tables/by-product/:productId", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
    const removed = await deleteCommissionTablesByProduct(req.auth!, productId);
    res.json({ ok: true, removed });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao excluir tabelas do produto." });
  }
});

router.patch("/products/:id", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const schema = z.object({ name: z.string().trim().min(1) });
    const parsed = schema.parse(req.body);
    const product = await updateProductName(req.auth!, productId, parsed.name);
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao editar produto." });
  }
});

router.post("/contents", requireAuth, upload.single("file"), async (req: RequestWithAuth, res) => {
  try {
    const schema = z.object({
      title: z.string().min(3),
      type: z.enum(["PDF", "PNG", "JPEG", "IMAGE", "COMMISSION_TABLE", "OTHER"]),
      productId: z.string().optional(),
      displayName: z.string().trim().min(1).max(180).optional(),
    });
    const parsed = schema.parse(req.body);
    if (!req.file) {
      throw new Error("Arquivo é obrigatório.");
    }
    const item = await createContent(req.auth!, {
      title: parsed.title,
      type: parsed.type,
      productId: parsed.productId,
      filePath: req.file.path,
      displayName: parsed.displayName || req.file.originalname || undefined,
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao enviar conteúdo." });
  }
});

router.post("/contents/folder", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const schema = z.object({ path: z.string().trim().min(1) });
    const parsed = schema.parse(req.body);
    const folder = await createContentFolder(req.auth!, parsed.path);
    res.status(201).json(folder);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao criar pasta." });
  }
});

router.get("/contents", requireAuth, async (req: RequestWithAuth, res) => {
  const type = req.query.type?.toString();
  const items = await listContents(req.auth!, type);
  res.json(items);
});

router.get("/contents/:id/file", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { absolutePath, mimeType } = await getContentFileForDownload(req.auth!, id);
    await fs.access(absolutePath);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", "inline");
    res.sendFile(absolutePath);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao abrir arquivo.";
    const status = msg === "Conteúdo não encontrado." ? 404 : 400;
    res.status(status).json({ message: msg });
  }
});

router.delete("/contents/folder", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const folderPath = typeof req.query.path === "string" ? req.query.path : "";
    const removed = await deleteContentsByFolder(req.auth!, folderPath);
    res.json({ removed });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao excluir pasta." });
  }
});

router.delete("/contents/:id", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteContentById(req.auth!, id);
    res.json({ ok: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[DELETE /api/contents/:id]", error);
    const msg =
      error instanceof Error
        ? error.message
        : error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string"
          ? String((error as { message: string }).message)
          : "Erro ao excluir conteúdo.";
    res.status(400).json({ message: msg });
  }
});

router.get("/files/:fileName", requireAuth, async (req, res) => {
  const name = Array.isArray(req.params.fileName) ? req.params.fileName[0] : req.params.fileName;
  const filePath = path.resolve(uploadDir, name);
  try {
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch {
    res.status(404).json({ message: "Arquivo não encontrado." });
  }
});
