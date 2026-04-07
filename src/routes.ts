import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { z } from "zod";
import { RequestWithAuth, requireAuth } from "./auth";
import { config } from "./config";
import {
  approveUser,
  blockUser,
  completeRegistration,
  createCommissionTable,
  createContent,
  createProduct,
  forgotPassword,
  getCurrentUserProfile,
  getInviteRegistrationContext,
  listCommissionTables,
  listContents,
  listProducts,
  listUsers,
  login,
  resetPassword,
  verifyFirstAccess,
  inviteUser,
  toPublicTenantUser,
} from "./services";

const uploadDir = path.resolve(process.cwd(), "uploads");
const upload = multer({ dest: uploadDir });

export const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "credilix-acessos" });
});

router.get("/branding", (_req, res) => {
  res.json(config.branding);
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

router.post(
  "/users/:id/complete-registration",
  upload.fields([
    { name: "identityDocument", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const schema = z.object({
        fullName: z.string().min(3),
        cpf: z.string().min(11),
        rg: z.string().min(5),
        birthDate: z.string().min(8),
        address: z.string().min(8),
        password: z.string().min(6),
      });
      const parsed = schema.parse(req.body);
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const identityPath = files?.identityDocument?.[0]?.path;
      const addressProofPath = files?.addressProof?.[0]?.path;
      if (!identityPath || !addressProofPath) {
        throw new Error("Envie documento de identificação e comprovante de endereço.");
      }
      const user = await completeRegistration(userId, {
        ...parsed,
        identityPath,
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
    res.json(users.map(toPublicTenantUser));
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
    const parsed = schema.parse(req.body);
    const result = await inviteUser(req.auth!, parsed);
    res.status(201).json({
      user: toPublicTenantUser(result.user),
      inviteLink: result.inviteLink,
      emailSent: result.emailSent,
      emailError: result.emailError,
    });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao criar usuário." });
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

router.post("/commission-tables", requireAuth, async (req: RequestWithAuth, res) => {
  try {
    const schema = z.object({
      productId: z.string().min(1),
      bank: z.string().min(1),
      name: z.string().min(3),
      deadline: z.string().min(2),
      commissionPercent: z.number().positive(),
      observation: z.string().max(1000).optional(),
    });
    const parsed = schema.parse(req.body);
    const item = await createCommissionTable(req.auth!, parsed);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao criar tabela." });
  }
});

router.get("/commission-tables", requireAuth, async (req: RequestWithAuth, res) => {
  const productId = req.query.productId?.toString();
  const items = await listCommissionTables(req.auth!, productId);
  res.json(items);
});

router.post("/contents", requireAuth, upload.single("file"), async (req: RequestWithAuth, res) => {
  try {
    const schema = z.object({
      title: z.string().min(3),
      type: z.enum(["IMAGE", "PDF", "COMMISSION_TABLE", "OTHER"]),
      productId: z.string().optional(),
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
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao enviar conteúdo." });
  }
});

router.get("/contents", requireAuth, async (req: RequestWithAuth, res) => {
  const type = req.query.type?.toString();
  const items = await listContents(req.auth!, type);
  res.json(items);
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
