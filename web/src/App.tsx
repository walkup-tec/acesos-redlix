import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  FileImage,
  FileText,
  Info,
  LogOut,
  Menu,
  PanelLeftClose,
  Pencil,
  Percent,
  Plus,
  RefreshCw,
  RotateCcw,
  SunMoon,
  Trash2,
  Users,
  XCircle,
  X,
} from "lucide-react";
import {
  AtivarFlow,
  ConviteFlow,
  ConviteMissingView,
  readPublicRoute,
} from "./onboarding-ui";

type ModuleKey = "users" | "products" | "contents" | "bankLogins";

const MODULE_TITLE: Record<ModuleKey, string> = {
  users: "Usuários",
  products: "Tabela de Comissão",
  contents: "Conteúdos",
  bankLogins: "Login Banco",
};

type Branding = {
  name: string;
  logoUrl: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    foreground: string;
    background: string;
  };
};

/** Perfil retornado por `GET /api/auth/me` e login (mesmo formato público). */
type SessionUser = {
  id: string;
  tenantId: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  canManageUsers: boolean;
  permViewContents: boolean;
  permCreateManagers: boolean;
  permCreateSellers: boolean;
  permCommissionTables: boolean;
  permContents: boolean;
  profile?: {
    cpf?: string;
  };
};

const SESSION_STORAGE_KEY = "credilix_session";
const THEME_STORAGE_KEY = "credilix_theme";
const CONTENT_FOLDERS_STORAGE_KEY = "credilix_content_folders";
const CONTENT_FILE_NAMES_STORAGE_KEY = "credilix_content_file_names";
const LIGHT_LOGO_URL = "/branding-assets/logo-credilix-dark.png";
const DARK_LOGO_URL = "/branding-assets/logo-credilix-light.png";
const FALLBACK_LOGO_URL = "/favicon.svg";

function readStoredToken(): string {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return "";
    }
    const data = JSON.parse(raw) as { token?: string };
    return typeof data.token === "string" ? data.token : "";
  } catch {
    return "";
  }
}

function readStoredTheme(): "light" | "dark" {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function readStoredContentFolders(): string[] {
  try {
    const raw = localStorage.getItem(CONTENT_FOLDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function readStoredContentFileNames(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CONTENT_FILE_NAMES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

type User = {
  id: string;
  systemCode?: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  firstAccessVerifiedAt?: string;
  profile?: {
    cpf?: string;
    rg?: string;
    birthDate?: string;
    address?: string;
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
  documents?: {
    identityPath?: string;
    identityBackPath?: string;
    addressProofPath?: string;
  };
  statusReason?: string;
  canManageUsers?: boolean;
  permViewContents?: boolean;
  permCreateManagers?: boolean;
  permCreateSellers?: boolean;
  permCommissionTables?: boolean;
  permContents?: boolean;
};

function formatUserLifecycleStatus(u: User): "Ativo" | "Pendente" | "Inativo" | "Aguardando Ativação" {
  const status = (u.status ?? "").toUpperCase();
  if (status === "INACTIVE" || status === "BLOCKED") return "Inativo";
  if (status === "ACTIVE") return "Ativo";
  if (status === "AWAITING_REVIEW" || status === "PENDING_APPROVAL") return "Aguardando Ativação";
  return "Pendente";
}

function userStatusClassName(u: User): "status--active" | "status--inactive" | "status--pending" | "status--review" {
  const status = formatUserLifecycleStatus(u);
  if (status === "Ativo") return "status--active";
  if (status === "Inativo") return "status--inactive";
  if (status === "Aguardando Ativação") return "status--review";
  return "status--pending";
}

const INVITED_PENDING_LIST_NAME = "(Aguardando Validação)";

function displayNameInUserList(user: User): string {
  if ((user.status ?? "").toUpperCase() === "INVITED") {
    return INVITED_PENDING_LIST_NAME;
  }
  return user.fullName;
}

type InviteRolePreset = "VENDEDOR" | "SUPORTE" | "LIDER";

type InvitePermissionState = {
  canManageUsers: boolean;
  permViewContents: boolean;
  permCreateManagers: boolean;
  permCreateSellers: boolean;
  permCommissionTables: boolean;
  permContents: boolean;
};

const ROLE_PRESETS: Record<InviteRolePreset, InvitePermissionState> = {
  VENDEDOR: {
    canManageUsers: false,
    permViewContents: true,
    permCreateManagers: false,
    permCreateSellers: false,
    permCommissionTables: false,
    permContents: false,
  },
  SUPORTE: {
    canManageUsers: true,
    permViewContents: true,
    permCreateManagers: false,
    permCreateSellers: false,
    permCommissionTables: false,
    permContents: false,
  },
  LIDER: {
    canManageUsers: true,
    permViewContents: true,
    permCreateManagers: true,
    permCreateSellers: true,
    permCommissionTables: true,
    permContents: true,
  },
};

const RAIL_ICON_PROPS = { size: 20, strokeWidth: 1.75 } as const;

function RailModuleIcon({ module }: { module: ModuleKey }) {
  switch (module) {
    case "users":
      return <Users {...RAIL_ICON_PROPS} aria-hidden />;
    case "products":
      return <Percent {...RAIL_ICON_PROPS} aria-hidden />;
    case "contents":
      return <FileText {...RAIL_ICON_PROPS} aria-hidden />;
    case "bankLogins":
      return (
        <i className="bi bi-bell-fill rail-bell-icon" aria-hidden />
      );
  }
}

type Product = {
  id: string;
  name: string;
};

const NEW_PRODUCT_OPTION = "__new__";
const NEW_BANK_OPTION = "__new_bank__";

type Bank = {
  id: string;
  name: string;
};

type CommissionTable = {
  id: string;
  bank: string;
  name: string;
  deadline: string;
  commissionPercent: number;
  baseCommissionPercent?: number;
  leaderRepassePercent?: number;
  leaderRepasseDefined?: boolean;
  leaderRepasseActive?: boolean;
  observation?: string;
  productId: string;
};

type CommissionTableEditDraft = {
  id: string;
  bank: string;
  name: string;
  deadline: string;
  commissionPercent: string;
  observation: string;
};

type BankLoginRequest = {
  id: string;
  requesterUserId: string;
  supervisorUserId?: string;
  targetUserId?: string;
  productId: string;
  bankName: string;
  status: "PENDING" | "RESOLVED";
  loginUser?: string;
  loginPassword?: string;
  resolvedByUserId?: string;
  resolvedAt?: string;
  requesterViewedAt?: string;
  createdAt: string;
  updatedAt?: string;
};

type Content = {
  id: string;
  title: string;
  displayName?: string;
  type: string;
  filePath: string;
};

type UploadContentType = "PDF" | "PNG" | "JPEG";

function normalizeFolderPath(input: string): string {
  return input
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
}

function isContentFolderMarker(item: Content): boolean {
  return item.type === "FOLDER" && item.filePath.startsWith("__folder__/");
}

function fileBaseName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

function formatCpfForDisplay(cpf?: string): string {
  if (!cpf) return "—";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function detectMimeTypeFromBytes(bytes: Uint8Array): string | null {
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  return null;
}

function formatBirthDateToBr(value: string): string {
  const raw = value.trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, yyyy, mm, dd] = iso;
    return `${dd}/${mm}/${yyyy}`;
  }
  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) {
    return raw;
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 8) {
    // Legado sem separador: prioriza YYYYMMDD quando começa por século.
    if (digits.startsWith("19") || digits.startsWith("20")) {
      return `${digits.slice(6, 8)}/${digits.slice(4, 6)}/${digits.slice(0, 4)}`;
    }
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }
  return raw;
}

function normalizeBirthDateForApi(input: string): string {
  const raw = input.trim();
  if (!raw) {
    throw new Error("Data de nascimento é obrigatória.");
  }

  // Aceita qualquer entrada com 8 dígitos úteis (com ou sem separadores)
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 8) {
    // Se vier como YYYYMMDD, converte corretamente para DD/MM/AAAA.
    if (digits.startsWith("19") || digits.startsWith("20")) {
      return `${digits.slice(6, 8)}/${digits.slice(4, 6)}/${digits.slice(0, 4)}`;
    }
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }

  // Aceita já no formato esperado
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    return raw;
  }

  // Compatibilidade com ISO digitado manualmente
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, yyyy, mm, dd] = iso;
    return `${dd}/${mm}/${yyyy}`;
  }

  throw new Error("Data de nascimento deve estar no formato DD/MM/AAAA.");
}

function maskBirthDateInput(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function maskCpfInput(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function maskCepInput(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Base do servidor (vazio = mesma origem). Rotas REST ficam em `/api/*`. */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

function apiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  const segment = path.startsWith("/") ? path : `/${path}`;
  return `${base}/api${segment}`;
}

function App() {
  const [token, setToken] = useState(() => readStoredToken());
  const [session, setSession] = useState<SessionUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(() => readStoredToken() !== "");
  const [activeModule, setActiveModule] = useState<ModuleKey>("users");
  const [navOpen, setNavOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [error, setError] = useState<string>("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [tables, setTables] = useState<CommissionTable[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [bankLoginRequests, setBankLoginRequests] = useState<BankLoginRequest[]>([]);
  const [pendingBankLoginCount, setPendingBankLoginCount] = useState(0);
  const [bellPulse, setBellPulse] = useState(false);
  const [moduleAlertCounts, setModuleAlertCounts] = useState<{ users: number; products: number; contents: number }>({
    users: 0,
    products: 0,
    contents: 0,
  });
  const [bankLoginSubmitLoading, setBankLoginSubmitLoading] = useState(false);
  const [bankLoginProductId, setBankLoginProductId] = useState("");
  const [bankLoginBankName, setBankLoginBankName] = useState("");
  const [bankLoginTargetUserId, setBankLoginTargetUserId] = useState("");
  const [bankLoginUserInput, setBankLoginUserInput] = useState("");
  const [respondBankLoginDraft, setRespondBankLoginDraft] = useState<BankLoginRequest | null>(null);
  const [respondLoginUser, setRespondLoginUser] = useState("");
  const [respondLoginPassword, setRespondLoginPassword] = useState("");
  const [respondBankLoginLoading, setRespondBankLoginLoading] = useState(false);
  const [viewBankLoginDraft, setViewBankLoginDraft] = useState<BankLoginRequest | null>(null);
  const [copiedBankLoginField, setCopiedBankLoginField] = useState<"" | "user" | "password">("");
  const [usersRefreshLoading, setUsersRefreshLoading] = useState(false);
  const [usersStatusFilter, setUsersStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "PENDING" | "REVIEW">("ALL");
  const [usersSearchQuery, setUsersSearchQuery] = useState("");

  const [loginEmail, setLoginEmail] = useState("master@credilix.local");
  const [loginPassword, setLoginPassword] = useState("Master@123");
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);

  const [publicRoute] = useState(() => readPublicRoute());
  const [panelNotice, setPanelNotice] = useState<string>("");
  const [inviteRole, setInviteRole] = useState<InviteRolePreset>("VENDEDOR");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [productFormLoading, setProductFormLoading] = useState(false);
  const [commissionEditLoading, setCommissionEditLoading] = useState(false);
  const [commissionDeleteLoading, setCommissionDeleteLoading] = useState(false);
  const [repasseSaveLoading, setRepasseSaveLoading] = useState(false);
  const [repasseDeactivateTableId, setRepasseDeactivateTableId] = useState("");
  const [productEditLoading, setProductEditLoading] = useState(false);
  const [productDeleteTablesLoading, setProductDeleteTablesLoading] = useState(false);
  const [folderCreateLoading, setFolderCreateLoading] = useState(false);
  const [fileUploadLoading, setFileUploadLoading] = useState(false);
  const [contentDeleteLoading, setContentDeleteLoading] = useState(false);
  const [folderDeleteLoading, setFolderDeleteLoading] = useState(false);
  const [canManageUsersPermission, setCanManageUsersPermission] = useState(false);
  const [permViewContents, setPermViewContents] = useState(true);
  const [permCreateManagers, setPermCreateManagers] = useState(false);
  const [permCreateSellers, setPermCreateSellers] = useState(false);
  const [permCommissionTables, setPermCommissionTables] = useState(false);
  const [permContents, setPermContents] = useState(false);
  const [pendingUserAction, setPendingUserAction] = useState<"APPROVE" | "ACTIVE" | "INACTIVE" | "BLOCKED" | "RESET" | "EDIT" | "">(
    "",
  );
  const [pendingUserActionTarget, setPendingUserActionTarget] = useState<User | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<User | null>(null);
  const [pendingUserActionReason, setPendingUserActionReason] = useState("");
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [editUserDraft, setEditUserDraft] = useState({
    fullName: "",
    email: "",
    role: "VENDEDOR",
    cpf: "",
    rg: "",
    birthDate: "",
    address: "",
    fatherName: "",
    motherName: "",
    zipCode: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    addressNumber: "",
    addressComplement: "",
  });

  const [productName, setProductName] = useState("");
  const [selectedProductValue, setSelectedProductValue] = useState(NEW_PRODUCT_OPTION);
  const [isTypingNewProduct, setIsTypingNewProduct] = useState(false);

  const [tableName, setTableName] = useState("");
  const [tableDeadline, setTableDeadline] = useState("");
  const [tableCommission, setTableCommission] = useState("1");
  const [bankName, setBankName] = useState("");
  const [selectedBankValue, setSelectedBankValue] = useState(NEW_BANK_OPTION);
  const [isTypingNewBank, setIsTypingNewBank] = useState(false);
  const [tableObservation, setTableObservation] = useState("");
  const [filterProductId, setFilterProductId] = useState("");
  const [filterBankName, setFilterBankName] = useState("");

  const [manualFolders, setManualFolders] = useState<string[]>(() => readStoredContentFolders());
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [pendingDeleteFolderPath, setPendingDeleteFolderPath] = useState("");
  const [pendingDeleteContentId, setPendingDeleteContentId] = useState("");
  const [pendingDeleteContentLabel, setPendingDeleteContentLabel] = useState("");
  const [pendingDeleteCommissionTableId, setPendingDeleteCommissionTableId] = useState("");
  const [pendingDeleteCommissionTableLabel, setPendingDeleteCommissionTableLabel] = useState("");
  const [pendingDeleteProductTablesId, setPendingDeleteProductTablesId] = useState("");
  const [pendingDeleteProductTablesLabel, setPendingDeleteProductTablesLabel] = useState("");
  const [editingCommissionTable, setEditingCommissionTable] = useState<CommissionTableEditDraft | null>(null);
  const [utilizeTableDraft, setUtilizeTableDraft] = useState<{
    id: string;
    bank: string;
    name: string;
    deadline: string;
    baseCommissionPercent: number;
    commissionPercent: string;
  } | null>(null);
  const [editingProduct, setEditingProduct] = useState<{ id: string; name: string } | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadDisplayName, setUploadDisplayName] = useState("");
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [pendingUploadType, setPendingUploadType] = useState<UploadContentType | null>(null);
  const [currentFolderPath, setCurrentFolderPath] = useState("");
  const [contentFileNames, setContentFileNames] = useState<Record<string, string>>(() => readStoredContentFileNames());
  const [theme, setTheme] = useState<"light" | "dark">(() => readStoredTheme());
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [observationHoverTableId, setObservationHoverTableId] = useState<string | null>(null);
  const [observationPinnedTableId, setObservationPinnedTableId] = useState<string | null>(null);
  const [userReasonHoverUserId, setUserReasonHoverUserId] = useState<string | null>(null);
  const [userReasonPinnedUserId, setUserReasonPinnedUserId] = useState<string | null>(null);
  const [isLoggedUserInfoOpen, setIsLoggedUserInfoOpen] = useState(false);
  const [loggedUserEmailCopied, setLoggedUserEmailCopied] = useState(false);

  useEffect(() => {
    void loadBranding();
  }, []);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const el = e.target;
      if (
        el instanceof Element &&
        (el.closest(".table-observation-wrap") ||
          el.closest(".user-status-reason-wrap") ||
          el.closest(".logged-user-info-wrap"))
      ) {
        return;
      }
      setObservationPinnedTableId(null);
      setUserReasonPinnedUserId(null);
      setIsLoggedUserInfoOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setObservationPinnedTableId(null);
        setObservationHoverTableId(null);
        setUserReasonPinnedUserId(null);
        setUserReasonHoverUserId(null);
        setIsLoggedUserInfoOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(CONTENT_FOLDERS_STORAGE_KEY, JSON.stringify(manualFolders));
    } catch {
      /* ignore */
    }
  }, [manualFolders]);

  useEffect(() => {
    try {
      localStorage.setItem(CONTENT_FILE_NAMES_STORAGE_KEY, JSON.stringify(contentFileNames));
    } catch {
      /* ignore */
    }
  }, [contentFileNames]);

  useEffect(() => {
    if (!panelNotice) return;
    const timer = window.setTimeout(() => setPanelNotice(""), 7_000);
    return () => window.clearTimeout(timer);
  }, [panelNotice]);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(""), 7_000);
    return () => window.clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!token) {
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token, session }));
    } catch {
      /* ignore quota / private mode */
    }
  }, [token, session]);

  const loadJson = useCallback(
    async <T,>(path: string, label: string): Promise<T> => {
      if (!token) {
        throw new Error("Sessão expirada.");
      }
      const response = await fetch(apiUrl(path), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message ?? `Falha ao carregar ${label}.`);
      }
      return body as T;
    },
    [token],
  );

  const refreshUsersOnly = useCallback(async () => {
    try {
      const nextUsers = await loadJson<User[]>("/users", "usuários");
      setUsers(Array.isArray(nextUsers) ? nextUsers : []);
    } catch {
      // silencioso para não poluir UX em sync realtime
    }
  }, [loadJson]);

  const refreshCommissionOnly = useCallback(async () => {
    try {
      const [nextProducts, nextBanks, nextTables] = await Promise.all([
        loadJson<Product[]>("/products", "produtos"),
        loadJson<Bank[]>("/banks", "bancos"),
        loadJson<CommissionTable[]>("/commission-tables", "tabelas"),
      ]);
      setProducts(Array.isArray(nextProducts) ? nextProducts : []);
      setBanks(Array.isArray(nextBanks) ? nextBanks : []);
      setTables(Array.isArray(nextTables) ? nextTables : []);
    } catch {
      // silencioso para não poluir UX em sync realtime
    }
  }, [loadJson]);

  const refreshCommissionOnlyWithDelta = useCallback(async (): Promise<number> => {
    try {
      const [nextProducts, nextBanks, nextTablesRaw] = await Promise.all([
        loadJson<Product[]>("/products", "produtos"),
        loadJson<Bank[]>("/banks", "bancos"),
        loadJson<CommissionTable[]>("/commission-tables", "tabelas"),
      ]);
      const nextTables = Array.isArray(nextTablesRaw) ? nextTablesRaw : [];
      const before = new Set(tables.map((item) => item.id));
      const added = nextTables.reduce((acc, item) => (before.has(item.id) ? acc : acc + 1), 0);
      setProducts(Array.isArray(nextProducts) ? nextProducts : []);
      setBanks(Array.isArray(nextBanks) ? nextBanks : []);
      setTables(nextTables);
      return added;
    } catch {
      return 0;
    }
  }, [loadJson, tables]);

  const refreshContentsOnly = useCallback(async () => {
    try {
      const nextContents = await loadJson<Content[]>("/contents", "conteúdos");
      setContents(Array.isArray(nextContents) ? nextContents : []);
    } catch {
      // silencioso para não poluir UX em sync realtime
    }
  }, [loadJson]);

  const refreshBankLoginOnly = useCallback(async () => {
    try {
      const [nextRequests, nextCount] = await Promise.all([
        loadJson<BankLoginRequest[]>("/bank-login-requests", "solicitações"),
        loadJson<{ count: number }>("/bank-login-requests/pending-count", "pendências"),
      ]);
      setBankLoginRequests(Array.isArray(nextRequests) ? nextRequests : []);
      setPendingBankLoginCount(Number(nextCount?.count ?? 0));
    } catch {
      // silencioso para não poluir UX em sync realtime
    }
  }, [loadJson]);

  const refreshAll = useCallback(async () => {
    const authToken = token;
    if (!authToken) {
      return;
    }
    setError("");

    const [u, p, b, t, c, r, rc] = await Promise.allSettled([
      loadJson<User[]>("/users", "usuários"),
      loadJson<Product[]>("/products", "produtos"),
      loadJson<Bank[]>("/banks", "bancos"),
      loadJson<CommissionTable[]>("/commission-tables", "tabelas"),
      loadJson<Content[]>("/contents", "conteúdos"),
      loadJson<BankLoginRequest[]>("/bank-login-requests", "solicitações"),
      loadJson<{ count: number }>("/bank-login-requests/pending-count", "pendências"),
    ]);

    const failures: string[] = [];
    if (u.status === "fulfilled") {
      setUsers(Array.isArray(u.value) ? u.value : []);
    } else {
      failures.push(u.reason instanceof Error ? u.reason.message : "usuários");
    }
    if (p.status === "fulfilled") {
      const list = Array.isArray(p.value) ? p.value : [];
      setProducts(list);
    } else {
      failures.push(p.reason instanceof Error ? p.reason.message : "produtos");
    }
    if (b.status === "fulfilled") {
      setBanks(Array.isArray(b.value) ? b.value : []);
    } else {
      failures.push(b.reason instanceof Error ? b.reason.message : "bancos");
    }
    if (t.status === "fulfilled") {
      setTables(Array.isArray(t.value) ? t.value : []);
    } else {
      failures.push(t.reason instanceof Error ? t.reason.message : "tabelas");
    }
    if (c.status === "fulfilled") {
      setContents(Array.isArray(c.value) ? c.value : []);
    } else {
      failures.push(c.reason instanceof Error ? c.reason.message : "conteúdos");
    }
    if (r.status === "fulfilled") {
      setBankLoginRequests(Array.isArray(r.value) ? r.value : []);
    } else {
      failures.push(r.reason instanceof Error ? r.reason.message : "solicitações");
    }
    if (rc.status === "fulfilled") {
      setPendingBankLoginCount(Number(rc.value?.count ?? 0));
    } else {
      failures.push(rc.reason instanceof Error ? rc.reason.message : "pendências");
    }

    if (failures.length > 0) {
      setError(failures.join(" · "));
    }
  }, [token, loadJson]);

  useEffect(() => {
    if (!token) return;
    const streamUrl = `${apiUrl("/events")}?token=${encodeURIComponent(token)}`;
    const source = new EventSource(streamUrl);
    source.onmessage = (event) => {
      let eventType = "";
      try {
        const parsed = JSON.parse(event.data) as { type?: string };
        eventType = String(parsed.type ?? "");
      } catch {
        eventType = "";
      }
      setBellPulse(true);
      window.setTimeout(() => setBellPulse(false), 900);
      if (eventType === "users-updated") {
        if (activeModule !== "users") {
          setModuleAlertCounts((prev) => ({ ...prev, users: prev.users + 1 }));
        }
        void refreshUsersOnly();
        return;
      }
      if (eventType === "commission-tables-updated") {
        if (session?.role?.toUpperCase() === "VENDEDOR") {
          void (async () => {
            const added = await refreshCommissionOnlyWithDelta();
            if (activeModule !== "products" && added > 0) {
              setModuleAlertCounts((prev) => ({ ...prev, products: prev.products + 1 }));
            }
          })();
          return;
        }
        if (activeModule !== "products") {
          setModuleAlertCounts((prev) => ({ ...prev, products: prev.products + 1 }));
        }
        void refreshCommissionOnly();
        return;
      }
      if (eventType === "commission-repasse-defined") {
        if (session?.role?.toUpperCase() === "VENDEDOR" && activeModule !== "products") {
          setModuleAlertCounts((prev) => ({ ...prev, products: prev.products + 1 }));
        }
        void refreshCommissionOnly();
        return;
      }
      if (eventType === "contents-updated") {
        if (activeModule !== "contents") {
          setModuleAlertCounts((prev) => ({ ...prev, contents: prev.contents + 1 }));
        }
        void refreshContentsOnly();
        return;
      }
      if (eventType === "bank-login-updated") {
        void refreshBankLoginOnly();
        return;
      }
      void refreshAll();
    };
    source.onerror = () => {
      // browser auto-reconnects
    };
    return () => {
      source.close();
    };
  }, [
    token,
    refreshAll,
    refreshUsersOnly,
    refreshCommissionOnly,
    refreshCommissionOnlyWithDelta,
    refreshContentsOnly,
    refreshBankLoginOnly,
    activeModule,
    session,
  ]);

  // Fallback de ressincronização para não depender apenas de SSE.
  // Evita necessidade de refresh manual quando algum evento é perdido.
  useEffect(() => {
    if (!token) return;
    const timer = window.setInterval(() => {
      if (activeModule === "products") {
        void refreshCommissionOnly();
      } else if (activeModule === "users") {
        void refreshUsersOnly();
      } else if (activeModule === "contents") {
        void refreshContentsOnly();
      } else if (activeModule === "bankLogins") {
        void refreshBankLoginOnly();
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [token, activeModule, refreshCommissionOnly, refreshUsersOnly, refreshContentsOnly, refreshBankLoginOnly]);

  useEffect(() => {
    if (!token) return;
    if (session?.role?.toUpperCase() !== "VENDEDOR") return;
    if (activeModule === "products") return;
    const timer = window.setInterval(() => {
      void (async () => {
        const added = await refreshCommissionOnlyWithDelta();
        if (added > 0) {
          setModuleAlertCounts((prev) => ({ ...prev, products: prev.products + 1 }));
        }
      })();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [token, session, activeModule, refreshCommissionOnlyWithDelta]);

  const handleRefreshUsers = useCallback(async () => {
    if (!token) return;
    setUsersRefreshLoading(true);
    setError("");
    try {
      const response = await fetch(apiUrl("/users"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string } | User[];
      if (!response.ok) {
        const msg = typeof body === "object" && body && "message" in body ? body.message : undefined;
        throw new Error(msg ?? "Não foi possível atualizar usuários.");
      }
      setUsers(Array.isArray(body) ? body : []);
      setPanelNotice("Lista de usuários atualizada.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao atualizar usuários.");
    } finally {
      setUsersRefreshLoading(false);
    }
  }, [token]);

  const filteredUsers = useMemo(() => {
    const searchRaw = usersSearchQuery.trim();
    const queryLower = searchRaw.toLowerCase();
    const queryDigitsOnly = searchRaw.replace(/\D/g, "");

    return users.filter((user) => {
      const lifecycle = formatUserLifecycleStatus(user);
      if (usersStatusFilter === "ACTIVE" && lifecycle !== "Ativo") return false;
      if (usersStatusFilter === "INACTIVE" && lifecycle !== "Inativo") return false;
      if (usersStatusFilter === "PENDING" && lifecycle !== "Pendente") return false;
      if (usersStatusFilter === "REVIEW" && lifecycle !== "Aguardando Ativação") return false;
      if (!searchRaw) return true;

      const name = displayNameInUserList(user).toLowerCase();
      const email = (user.email ?? "").toLowerCase();
      const systemCode = (user.systemCode ?? "").toLowerCase();
      const id = (user.id ?? "").toLowerCase();
      const cpfRaw = user.profile?.cpf ?? "";
      const cpfDigitsOnly = cpfRaw.replace(/\D/g, "");

      if (name.includes(queryLower)) return true;
      if (email.includes(queryLower)) return true;
      if (systemCode.includes(queryLower)) return true;
      if (id.includes(queryLower)) return true;
      if (cpfRaw.toLowerCase().includes(queryLower)) return true;
      if (queryDigitsOnly.length > 0 && cpfDigitsOnly.length > 0) {
        if (cpfDigitsOnly.includes(queryDigitsOnly) || queryDigitsOnly.includes(cpfDigitsOnly)) {
          return true;
        }
      }
      return false;
    });
  }, [users, usersSearchQuery, usersStatusFilter]);

  useEffect(() => {
    if (!token) {
      setSession(null);
      setBootstrapping(false);
      return;
    }

    let cancelled = false;
    setBootstrapping(true);
    setError("");

    void (async () => {
      let profileOk = false;
      try {
        const r = await fetch(apiUrl("/auth/me"), { headers: { Authorization: `Bearer ${token}` } });
        if (r.status === 401) {
          if (!cancelled) {
            setToken("");
            setSession(null);
            try {
              localStorage.removeItem(SESSION_STORAGE_KEY);
            } catch {
              /* ignore */
            }
          }
          return;
        }
        const body = (await r.json().catch(() => ({}))) as { message?: string };
        if (!r.ok) {
          throw new Error(body.message ?? "Não foi possível validar a sessão.");
        }
        if (!cancelled) {
          setSession(body as SessionUser);
          profileOk = true;
        }
      } catch (e) {
        if (!cancelled) {
          setSession(null);
          setError(e instanceof Error ? e.message : "Erro ao carregar sessão.");
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }

      if (cancelled || !profileOk) {
        return;
      }
      await refreshAll();
    })();

    return () => {
      cancelled = true;
    };
  }, [token, refreshAll]);

  useEffect(() => {
    if (isTypingNewProduct) {
      return;
    }
    if (!selectedProductValue) return;
    const exists = products.some((product) => product.id === selectedProductValue);
    if (!exists) {
      setSelectedProductValue("");
    }
  }, [isTypingNewProduct, selectedProductValue, products]);

  useEffect(() => {
    if (isTypingNewBank) {
      return;
    }
    if (!selectedBankValue) return;
    const exists = banks.some((bank) => bank.id === selectedBankValue);
    if (!exists) {
      setSelectedBankValue("");
    }
  }, [isTypingNewBank, selectedBankValue, banks]);

  const isMaster = Boolean(session && session.role.toUpperCase() === "MASTER");
  const isLeader = Boolean(session && session.role.toUpperCase() === "LIDER");
  const canCreateUsers = Boolean(session && (isMaster || session.canManageUsers));
  const canEditCommissionTables = Boolean(session && isMaster);
  const canViewCommissionTables = Boolean(session);
  const canViewContents = Boolean(session && (isMaster || session.permViewContents || session.permContents));
  const canEditContents = Boolean(session && (isMaster || session.permContents));
  const preferredLogoUrl = theme === "dark" ? DARK_LOGO_URL : branding?.logoUrl || LIGHT_LOGO_URL;
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const [logoUnavailable, setLogoUnavailable] = useState(false);
  const visibleLogoUrl = logoLoadFailed ? FALLBACK_LOGO_URL : preferredLogoUrl || FALLBACK_LOGO_URL;

  useEffect(() => {
    setLogoLoadFailed(false);
    setLogoUnavailable(false);
  }, [preferredLogoUrl]);

  const applyRolePreset = useCallback((role: InviteRolePreset) => {
    const preset = ROLE_PRESETS[role];
    setCanManageUsersPermission(preset.canManageUsers);
    setPermViewContents(preset.permViewContents);
    setPermCreateManagers(preset.permCreateManagers);
    setPermCreateSellers(preset.permCreateSellers);
    setPermCommissionTables(preset.permCommissionTables);
    setPermContents(preset.permContents);
  }, []);

  const navItems = useMemo(() => {
    const all: { key: ModuleKey; label: string; short: string }[] = [
      { key: "users", label: "Usuários", short: "Usu." },
      { key: "products", label: "Tabela de Comissão", short: "Tab." },
      { key: "contents", label: "Conteúdos", short: "Cont." },
      { key: "bankLogins", label: "Login Banco", short: "Login" },
    ];
    return all.filter((item) => {
      if (isMaster) {
        return true;
      }
      if (item.key === "users") {
        return canCreateUsers;
      }
      if (item.key === "products") {
        return canViewCommissionTables;
      }
      if (item.key === "contents") {
        return canViewContents;
      }
      return true;
    });
  }, [isMaster, canCreateUsers, canViewCommissionTables, canViewContents]);

  useEffect(() => {
    if (activeModule === "users" || activeModule === "products" || activeModule === "contents") {
      setModuleAlertCounts((prev) => ({ ...prev, [activeModule]: 0 }));
    }
  }, [activeModule]);

  useEffect(() => {
    if (!token) return;
    if (activeModule === "products") {
      void refreshCommissionOnly();
      return;
    }
    if (activeModule === "users") {
      void refreshUsersOnly();
      return;
    }
    if (activeModule === "contents") {
      void refreshContentsOnly();
      return;
    }
    if (activeModule === "bankLogins") {
      void refreshBankLoginOnly();
    }
  }, [token, activeModule, refreshCommissionOnly, refreshUsersOnly, refreshContentsOnly, refreshBankLoginOnly]);

  useEffect(() => {
    if (!session) {
      return;
    }
    if (navItems.length === 0) {
      return;
    }
    const isCurrentAllowed = navItems.some((item) => item.key === activeModule);
    if (!isCurrentAllowed) {
      setActiveModule(navItems[0].key);
    }
  }, [session, activeModule, navItems]);

  const filterBankOptions = useMemo(() => {
    const values = new Set<string>();
    for (const table of tables) {
      const name = table.bank.trim();
      if (name) {
        values.add(name);
      }
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [tables]);

  const bankLoginProductOptions = useMemo(() => {
    return products
      .map((product) => ({
        id: product.id,
        name: product.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [products]);

  const bankLoginUserOptions = useMemo(
    () =>
      users.map((item) => ({
        id: item.id,
        label: `${displayNameInUserList(item)} - ${item.email}`,
      })),
    [users],
  );

  const bankLoginRequestedItems = useMemo(
    () => bankLoginRequests.filter((item) => item.status !== "RESOLVED"),
    [bankLoginRequests],
  );

  const bankLoginCreatedItems = useMemo(
    () => bankLoginRequests.filter((item) => item.status === "RESOLVED"),
    [bankLoginRequests],
  );

  const filteredTables = useMemo(
    () =>
      tables.filter((table) => {
        if (filterProductId && table.productId !== filterProductId) {
          return false;
        }
        if (filterBankName && table.bank !== filterBankName) {
          return false;
        }
        return true;
      }),
    [tables, filterProductId, filterBankName],
  );

  const groupedTablesByProduct = useMemo(() => {
    const rowsByProduct = new Map<string, CommissionTable[]>();
    for (const table of filteredTables) {
      const list = rowsByProduct.get(table.productId);
      if (list) {
        list.push(table);
      } else {
        rowsByProduct.set(table.productId, [table]);
      }
    }
    return products
      .map((product) => ({ product, tables: rowsByProduct.get(product.id) ?? [] }))
      .filter((entry) => entry.tables.length > 0);
  }, [products, filteredTables]);

  const folderPaths = useMemo(() => {
    const paths = new Set<string>();
    for (const item of contents) {
      const normalized = normalizeFolderPath(item.title);
      if (!normalized) continue;
      const parts = normalized.split("/");
      let acc = "";
      for (const part of parts) {
        acc = acc ? `${acc}/${part}` : part;
        paths.add(acc);
      }
    }
    for (const path of manualFolders) {
      const normalized = normalizeFolderPath(path);
      if (!normalized) continue;
      const parts = normalized.split("/");
      let acc = "";
      for (const part of parts) {
        acc = acc ? `${acc}/${part}` : part;
        paths.add(acc);
      }
    }
    return Array.from(paths).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [contents, manualFolders]);

  const folderChildren = useMemo(() => {
    const byParent = new Map<string, string[]>();
    for (const path of folderPaths) {
      const idx = path.lastIndexOf("/");
      const parent = idx >= 0 ? path.slice(0, idx) : "";
      const list = byParent.get(parent) ?? [];
      list.push(path);
      byParent.set(parent, list);
    }
    for (const [parent, list] of byParent.entries()) {
      byParent.set(parent, list.sort((a, b) => a.localeCompare(b, "pt-BR")));
    }
    return byParent;
  }, [folderPaths]);

  /** Arquivos gravados exatamente nesta pasta (para lista e contagem nas telas). */
  const folderDirectFileCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const realContents = contents.filter((item) => !isContentFolderMarker(item));
    for (const folder of folderPaths) {
      const count = realContents.filter((item) => normalizeFolderPath(item.title) === folder).length;
      counts.set(folder, count);
    }
    return counts;
  }, [contents, folderPaths]);

  const currentFolderChildren = useMemo(
    () => folderChildren.get(currentFolderPath) ?? [],
    [folderChildren, currentFolderPath],
  );

  const currentFolderFiles = useMemo(
    () => contents.filter((item) => normalizeFolderPath(item.title) === currentFolderPath && !isContentFolderMarker(item)),
    [contents, currentFolderPath],
  );

  useEffect(() => {
    if (currentFolderPath && !folderPaths.includes(currentFolderPath)) {
      setCurrentFolderPath("");
    }
  }, [currentFolderPath, folderPaths]);

  const isEmptyRootContents = !currentFolderPath && folderPaths.length === 0;
  const canGoBackFolder = currentFolderPath.length > 0;

  function goBackFolder(): void {
    if (!currentFolderPath) return;
    const idx = currentFolderPath.lastIndexOf("/");
    setCurrentFolderPath(idx >= 0 ? currentFolderPath.slice(0, idx) : "");
  }

  function openFolderModal(): void {
    setNewFolderName("");
    setIsFolderModalOpen(true);
  }

  function goToModule(module: ModuleKey): void {
    setActiveModule(module);
    if (module === "contents") {
      // Sempre volta para a raiz ao abrir/reclicar no módulo Conteúdos.
      setCurrentFolderPath("");
    }
    setNavOpen(false);
  }

  async function apiPost<T>(path: string, payload: unknown): Promise<T> {
    const response = await fetch(apiUrl(path), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message ?? "Falha na requisição.");
    }
    return (await response.json()) as T;
  }

  async function loadBranding(): Promise<void> {
    const response = await fetch(apiUrl("/branding"));
    if (!response.ok) return;
    const data = (await response.json()) as Branding;
    setBranding(data);
    document.documentElement.style.setProperty("--brand-primary", data.colors.primary);
    document.documentElement.style.setProperty("--brand-secondary", data.colors.secondary);
    document.documentElement.style.setProperty("--brand-accent", data.colors.accent);
    document.documentElement.style.setProperty("--brand-bg", data.colors.background);
    document.documentElement.style.setProperty("--brand-fg", data.colors.foreground);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setLoginLoading(true);
    try {
      const response = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const body = (await response.json()) as { token?: string; user?: SessionUser; message?: string };
      if (!response.ok || !body.token || !body.user) {
        throw new Error(body.message ?? "Credenciais inválidas.");
      }
      setSession(null);
      setToken(body.token);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro de autenticação.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (inviteLoading) {
      return;
    }
    setError("");
    if (!canCreateUsers) {
      setError("Sem permissão para criar usuários.");
      return;
    }
    if (!token) {
      return;
    }
    try {
      setInviteLoading(true);
      setPanelNotice("");
      const response = await fetch(apiUrl("/users/invite"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          permissions: {
            role: inviteRole,
            canManageUsers: canManageUsersPermission,
            permViewContents,
            permCreateManagers,
            permCreateSellers,
            permCommissionTables,
            permContents,
          },
        }),
      });
      const body = (await response.json()) as {
        message?: string;
      };
      if (!response.ok) {
        throw new Error(body.message ?? "Não foi possível criar usuário.");
      }
      setPanelNotice("Usuário criado e convite enviado por e-mail.");
      setInviteEmail("");
      setInviteRole("VENDEDOR");
      applyRolePreset("VENDEDOR");
      await refreshAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível criar usuário.");
    } finally {
      setInviteLoading(false);
    }
  }

  function openUserAction(action: "APPROVE" | "ACTIVE" | "INACTIVE" | "BLOCKED" | "RESET" | "EDIT", user: User): void {
    setPendingUserAction(action);
    setPendingUserActionTarget(user);
    setPendingUserActionReason("");
    if (action === "EDIT") {
      setEditUserDraft({
        fullName: (user.status ?? "").toUpperCase() === "INVITED" ? "" : user.fullName ?? "",
        email: user.email ?? "",
        role: user.role ?? "VENDEDOR",
        cpf: user.profile?.cpf ?? "",
        rg: user.profile?.rg ?? "",
        birthDate: formatBirthDateToBr(user.profile?.birthDate ?? ""),
        address: user.profile?.address ?? "",
        fatherName: user.profile?.fatherName ?? "",
        motherName: user.profile?.motherName ?? "",
        zipCode: user.profile?.zipCode ?? "",
        street: user.profile?.street ?? "",
        neighborhood: user.profile?.neighborhood ?? "",
        city: user.profile?.city ?? "",
        state: user.profile?.state ?? "",
        addressNumber: user.profile?.addressNumber ?? "",
        addressComplement: user.profile?.addressComplement ?? "",
      });
    }
  }

  async function openUserUploadedFile(storedPath: string | undefined, label: string): Promise<void> {
    if (!storedPath?.trim() || !token) {
      return;
    }
    const name = storedPath.split(/[\\/]/).pop();
    if (!name) {
      return;
    }
    try {
      const r = await fetch(apiUrl(`/files/${encodeURIComponent(name)}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        throw new Error("fetch failed");
      }
      const blob = await r.blob();
      const data = await blob.arrayBuffer();
      const bytes = new Uint8Array(data);
      const detectedMime = detectMimeTypeFromBytes(bytes);
      const safeBlob =
        detectedMime && (blob.type === "application/octet-stream" || blob.type === "")
          ? new Blob([data], { type: detectedMime })
          : blob;
      const url = URL.createObjectURL(safeBlob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    } catch {
      setError(`Não foi possível abrir: ${label}`);
    }
  }

  function closeUserActionModal(): void {
    setPendingUserAction("");
    setPendingUserActionTarget(null);
    setPendingUserActionReason("");
    setUserActionLoading(false);
  }

  function closeUserDetailsModal(): void {
    setSelectedUserDetails(null);
  }

  async function handleConfirmUserStatusAction(): Promise<void> {
    if (!pendingUserActionTarget || !pendingUserAction) return;
    if (pendingUserAction !== "ACTIVE" && pendingUserAction !== "INACTIVE" && pendingUserAction !== "BLOCKED") return;
    const reason = pendingUserActionReason.trim();
    if ((pendingUserAction === "INACTIVE" || pendingUserAction === "BLOCKED") && !reason) {
      setError("Informe o motivo da ação.");
      return;
    }
    setUserActionLoading(true);
    setError("");
    try {
      const response = await fetch(apiUrl(`/users/${encodeURIComponent(pendingUserActionTarget.id)}/status`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: pendingUserAction,
          reason: reason || undefined,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message ?? "Não foi possível atualizar o status.");
      }
      await refreshAll();
      closeUserActionModal();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao atualizar status.");
      setUserActionLoading(false);
    }
  }

  async function handleResetUserAccess(): Promise<void> {
    if (!pendingUserActionTarget) return;
    setUserActionLoading(true);
    setError("");
    try {
      const response = await fetch(apiUrl(`/users/${encodeURIComponent(pendingUserActionTarget.id)}/reset-access`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message ?? "Não foi possível resetar o acesso.");
      }
      setPanelNotice(body.message ?? "Reset de acesso executado e e-mail enviado.");
      await refreshAll();
      closeUserActionModal();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao resetar acesso.");
      setUserActionLoading(false);
    }
  }

  async function handleApproveUser(): Promise<void> {
    if (!pendingUserActionTarget) return;
    setUserActionLoading(true);
    setError("");
    try {
      const response = await fetch(apiUrl(`/users/${encodeURIComponent(pendingUserActionTarget.id)}/approve`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message ?? "Não foi possível aprovar o usuário.");
      }
      setPanelNotice(body.message ?? "Usuário aprovado com sucesso.");
      await refreshAll();
      closeUserActionModal();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao aprovar usuário.");
      setUserActionLoading(false);
    }
  }

  async function handleSaveUserEdit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!pendingUserActionTarget) return;
    const reason = pendingUserActionReason.trim();
    if (!reason) {
      setError("Informe o motivo da edição.");
      return;
    }
    let normalizedBirthDate = "";
    try {
      normalizedBirthDate = normalizeBirthDateForApi(editUserDraft.birthDate);
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : "Data de nascimento inválida.");
      return;
    }
    setUserActionLoading(true);
    setError("");
    try {
      const response = await fetch(apiUrl(`/users/${encodeURIComponent(pendingUserActionTarget.id)}`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: editUserDraft.fullName,
          email: editUserDraft.email,
          role: editUserDraft.role,
          cpf: editUserDraft.cpf,
          rg: editUserDraft.rg,
          birthDate: normalizedBirthDate,
          address: editUserDraft.address,
          fatherName: editUserDraft.fatherName,
          motherName: editUserDraft.motherName,
          zipCode: editUserDraft.zipCode,
          street: editUserDraft.street,
          neighborhood: editUserDraft.neighborhood,
          city: editUserDraft.city,
          state: editUserDraft.state,
          addressNumber: editUserDraft.addressNumber,
          addressComplement: editUserDraft.addressComplement,
          reason,
        }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(body?.message ?? "Não foi possível salvar as alterações do usuário.");
      }
      setPanelNotice("Usuário atualizado com sucesso.");
      await refreshAll();
      closeUserActionModal();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao editar usuário.");
      setUserActionLoading(false);
    }
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (productFormLoading) return;
    setError("");
    try {
      setProductFormLoading(true);
      let productId = "";
      if (isTypingNewProduct) {
        const normalizedName = productName.trim();
        if (!normalizedName) {
          const msg = "Nome do produto é obrigatório.";
          setError(msg);
          return;
        }
        const createdProduct = await apiPost<Product>("/products", { name: normalizedName });
        productId = createdProduct.id;
      } else {
        if (!selectedProductValue) {
          const msg = "Nome do produto é obrigatório.";
          setError(msg);
          return;
        }
        productId = selectedProductValue;
      }

      if (canEditCommissionTables) {
        let bankValue = "";
        if (isTypingNewBank) {
          const normalizedBankName = bankName.trim();
          if (!normalizedBankName) {
            const msg = "Banco é obrigatório.";
            setError(msg);
            return;
          }
          const existingBank = banks.find((bank) => bank.name.trim().toLowerCase() === normalizedBankName.toLowerCase());
          if (existingBank) {
            bankValue = existingBank.name;
          } else {
            const createdBank = await apiPost<Bank>("/banks", { name: normalizedBankName });
            bankValue = createdBank.name;
          }
        } else {
          if (!selectedBankValue) {
            const msg = "Banco é obrigatório.";
            setError(msg);
            return;
          }
          const selectedBank = banks.find((bank) => bank.id === selectedBankValue);
          if (!selectedBank) {
            const msg = "Banco selecionado não encontrado.";
            setError(msg);
            return;
          }
          bankValue = selectedBank.name;
        }
        const normalizedTableName = tableName.trim();
        const normalizedDeadline = tableDeadline.trim();
        if (!normalizedTableName) {
          const msg = "Nome da tabela é obrigatório.";
          setError(msg);
          return;
        }
        if (!normalizedDeadline) {
          const msg = "Prazo é obrigatório.";
          setError(msg);
          return;
        }
        const normalizedCommission = tableCommission.replace(",", ".").trim();
        const commissionValue = Number(normalizedCommission);
        if (!Number.isFinite(commissionValue) || commissionValue <= 0) {
          const msg = "Comissão é obrigatória.";
          setError(msg);
          return;
        }
        await apiPost("/commission-tables", {
          productId,
          bank: bankValue.trim(),
          name: normalizedTableName,
          deadline: normalizedDeadline,
          commissionPercent: commissionValue,
          observation: tableObservation.trim() || undefined,
        });
      }
      setProductName("");
      setIsTypingNewProduct(false);
      setSelectedProductValue("");
      setTableName("");
      setTableDeadline("");
      setTableCommission("1");
      setBankName("");
      setSelectedBankValue("");
      setIsTypingNewBank(false);
      setTableObservation("");
      await refreshAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível criar produto/tabela.");
    } finally {
      setProductFormLoading(false);
    }
  }

  async function handleEditCommissionTable(target: CommissionTable): Promise<void> {
    if (!canEditCommissionTables) return;
    setEditingCommissionTable({
      id: target.id,
      bank: target.bank,
      name: target.name,
      deadline: target.deadline,
      commissionPercent: String(target.commissionPercent),
      observation: target.observation ?? "",
    });
  }

  async function handleSaveCommissionTableEdit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (commissionEditLoading) return;
    if (!canEditCommissionTables || !editingCommissionTable) return;
    const bank = editingCommissionTable.bank.trim();
    const name = editingCommissionTable.name.trim();
    const deadline = editingCommissionTable.deadline.trim();
    const commissionPercent = Number(editingCommissionTable.commissionPercent.replace(",", ".").trim());
    if (!bank || !name || !deadline) {
      setError("Preencha banco, nome da tabela e prazo.");
      return;
    }
    if (!Number.isFinite(commissionPercent) || commissionPercent <= 0) {
      setError("Comissão inválida.");
      return;
    }
    setError("");
    try {
      setCommissionEditLoading(true);
      const response = await fetch(apiUrl(`/commission-tables/${encodeURIComponent(editingCommissionTable.id)}`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bank,
          name,
          deadline,
          commissionPercent,
          observation: editingCommissionTable.observation.trim(),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message ?? "Não foi possível editar a tabela.");
      }
      setEditingCommissionTable(null);
      await refreshAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao editar tabela.");
    } finally {
      setCommissionEditLoading(false);
    }
  }

  function requestDeleteCommissionTable(target: CommissionTable): void {
    if (!canEditCommissionTables) return;
    setPendingDeleteCommissionTableId(target.id);
    setPendingDeleteCommissionTableLabel(target.name);
  }

  async function handleDeleteCommissionTable(): Promise<void> {
    if (commissionDeleteLoading) return;
    if (!canEditCommissionTables) return;
    const tableId = pendingDeleteCommissionTableId;
    if (!tableId) return;
    setError("");
    try {
      setCommissionDeleteLoading(true);
      const response = await fetch(apiUrl(`/commission-tables/${encodeURIComponent(tableId)}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message ?? "Não foi possível excluir a tabela.");
      }
      setPendingDeleteCommissionTableId("");
      setPendingDeleteCommissionTableLabel("");
      await refreshAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao excluir tabela.");
    } finally {
      setCommissionDeleteLoading(false);
    }
  }

  function openUtilizeCommissionTable(target: CommissionTable): void {
    if (!isLeader) return;
    const baseCommission = target.baseCommissionPercent ?? target.commissionPercent;
    setUtilizeTableDraft({
      id: target.id,
      bank: target.bank,
      name: target.name,
      deadline: target.deadline,
      baseCommissionPercent: baseCommission,
      commissionPercent: target.leaderRepassePercent ? String(target.leaderRepassePercent) : "",
    });
  }

  async function handleApplyCommissionRepasse(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (repasseSaveLoading) return;
    if (!isLeader || !utilizeTableDraft) return;
    const repasse = Number(utilizeTableDraft.commissionPercent.replace(",", ".").trim());
    if (!Number.isFinite(repasse) || repasse <= 0) {
      setError("Repasse inválido.");
      return;
    }
    if (repasse >= utilizeTableDraft.baseCommissionPercent) {
      setError(`Repasse deve ser menor que ${utilizeTableDraft.baseCommissionPercent}%.`);
      return;
    }
    setError("");
    try {
      setRepasseSaveLoading(true);
      const response = await fetch(apiUrl(`/commission-tables/${encodeURIComponent(utilizeTableDraft.id)}/use`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commissionPercent: repasse }),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message ?? "Não foi possível aplicar o repasse.");
      }
      setPanelNotice("Repasse aplicado com sucesso.");
      setUtilizeTableDraft(null);
      await refreshAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao aplicar repasse.");
    } finally {
      setRepasseSaveLoading(false);
    }
  }

  async function handleDeactivateCommissionRepasse(table: CommissionTable): Promise<void> {
    if (repasseDeactivateTableId) return;
    if (!isLeader) return;
    setError("");
    try {
      setRepasseDeactivateTableId(table.id);
      const response = await fetch(apiUrl(`/commission-tables/${encodeURIComponent(table.id)}/deactivate`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message ?? "Não foi possível desativar a tabela.");
      }
      setPanelNotice("Tabela desativada para sua equipe.");
      await refreshAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao desativar tabela.");
    } finally {
      setRepasseDeactivateTableId("");
    }
  }

  async function handleEditProductCardTitle(product: Product): Promise<void> {
    if (!canEditCommissionTables) return;
    setEditingProduct({ id: product.id, name: product.name });
  }

  async function handleSaveProductName(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (productEditLoading) return;
    if (!canEditCommissionTables || !editingProduct) return;
    const next = editingProduct.name.trim();
    if (!next) {
      setError("Nome do produto é obrigatório.");
      return;
    }
    setError("");
    try {
      setProductEditLoading(true);
      const response = await fetch(apiUrl(`/products/${encodeURIComponent(editingProduct.id)}`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: next }),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message ?? "Não foi possível editar o produto.");
      }
      setEditingProduct(null);
      await refreshAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao editar produto.");
    } finally {
      setProductEditLoading(false);
    }
  }

  function requestDeleteProductTables(product: Product): void {
    if (!canEditCommissionTables) return;
    setPendingDeleteProductTablesId(product.id);
    setPendingDeleteProductTablesLabel(product.name);
  }

  async function handleDeleteProductTables(): Promise<void> {
    if (productDeleteTablesLoading) return;
    if (!canEditCommissionTables) return;
    const productId = pendingDeleteProductTablesId;
    if (!productId) return;
    setError("");
    try {
      setProductDeleteTablesLoading(true);
      const response = await fetch(apiUrl(`/commission-tables/by-product/${encodeURIComponent(productId)}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message ?? "Não foi possível excluir as tabelas do produto.");
      }
      setPendingDeleteProductTablesId("");
      setPendingDeleteProductTablesLabel("");
      await refreshAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao excluir tabelas do produto.");
    } finally {
      setProductDeleteTablesLoading(false);
    }
  }

  async function handleCreateBankLoginRequest(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (bankLoginSubmitLoading) return;
    setError("");
    const productId = bankLoginProductId.trim();
    const bankName = bankLoginBankName.trim();
    const targetUserId = bankLoginTargetUserId.trim();
    if (!productId || !bankName) {
      setError("Selecione produto e banco para solicitar.");
      return;
    }
    if ((isMaster || isLeader) && !targetUserId) {
      setError("Selecione o usuário da solicitação.");
      return;
    }
    try {
      setBankLoginSubmitLoading(true);
      await apiPost("/bank-login-requests", { productId, bankName, targetUserId: targetUserId || undefined });
      setPanelNotice("Solicitação enviada com sucesso.");
      await refreshAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível solicitar login em banco.");
    } finally {
      setBankLoginSubmitLoading(false);
    }
  }

  function handleBankLoginUserInputChange(value: string): void {
    setBankLoginUserInput(value);
    const exactMatch = bankLoginUserOptions.find((item) => item.label === value);
    setBankLoginTargetUserId(exactMatch?.id ?? "");
  }

  function getModuleAlertCount(module: ModuleKey): number {
    if (module === "bankLogins") {
      return pendingBankLoginCount;
    }
    if (module === "users" || module === "products" || module === "contents") {
      return moduleAlertCounts[module];
    }
    return 0;
  }

  function canRespondBankLoginRequest(request: BankLoginRequest): boolean {
    if (!session) return false;
    if (request.status === "RESOLVED") return false;
    const role = session.role.toUpperCase();
    if (role === "MASTER") return true;
    if (role === "LIDER" && request.supervisorUserId === session.id) return true;
    return false;
  }

  function openRespondBankLoginModal(request: BankLoginRequest): void {
    if (!canRespondBankLoginRequest(request)) return;
    setRespondBankLoginDraft(request);
    setRespondLoginUser("");
    setRespondLoginPassword("");
  }

  async function handleRespondBankLoginRequest(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!respondBankLoginDraft || respondBankLoginLoading) return;
    const loginUser = respondLoginUser.trim();
    const loginPassword = respondLoginPassword.trim();
    if (!loginUser || !loginPassword) {
      setError("Usuário e senha são obrigatórios para responder.");
      return;
    }
    try {
      setRespondBankLoginLoading(true);
      await apiPost(`/bank-login-requests/${encodeURIComponent(respondBankLoginDraft.id)}/respond`, { loginUser, loginPassword });
      setRespondBankLoginDraft(null);
      setPanelNotice("Solicitação respondida com sucesso.");
      await refreshAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível responder a solicitação.");
    } finally {
      setRespondBankLoginLoading(false);
    }
  }

  async function openViewBankLoginModal(request: BankLoginRequest): Promise<void> {
    setViewBankLoginDraft(request);
    const isViewerEligible =
      Boolean(session) &&
      (request.requesterUserId === session!.id || (request.targetUserId ? request.targetUserId === session!.id : false));
    if (request.status === "RESOLVED" && isViewerEligible && !request.requesterViewedAt) {
      try {
        await apiPost(`/bank-login-requests/${encodeURIComponent(request.id)}/viewed`, {});
        await refreshAll();
      } catch {
        // sem bloqueio de visualização
      }
    }
  }

  async function copyBankLoginValue(kind: "user" | "password", value: string): Promise<void> {
    const normalized = value.trim();
    if (!normalized) return;
    try {
      await navigator.clipboard.writeText(normalized);
      setCopiedBankLoginField(kind);
      window.setTimeout(() => setCopiedBankLoginField(""), 1400);
    } catch {
      setError("Não foi possível copiar o valor.");
    }
  }

  async function copyLoggedUserEmail(): Promise<void> {
    const email = (session?.email ?? "").trim();
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setLoggedUserEmailCopied(true);
      window.setTimeout(() => setLoggedUserEmailCopied(false), 1200);
    } catch {
      setError("Não foi possível copiar o e-mail.");
    }
  }

  async function uploadContentFile(file: File, type: UploadContentType, displayName: string): Promise<void> {
    setError("");
    if (!currentFolderPath) {
      const msg = "Entre em uma pasta para adicionar arquivos.";
      setError(msg);
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isValidByType =
      (type === "PDF" && extension === "pdf") ||
      (type === "PNG" && extension === "png") ||
      (type === "JPEG" && (extension === "jpg" || extension === "jpeg"));
    if (!isValidByType) {
      const msg =
        type === "PDF"
          ? "Formato inválido: selecione um arquivo .pdf."
          : type === "PNG"
            ? "Formato inválido: selecione um arquivo .png."
            : "Formato inválido: selecione um arquivo .jpg ou .jpeg.";
      setError(msg);
      return;
    }
    const targetFolder = currentFolderPath;
    try {
      const formData = new FormData();
      formData.append("title", targetFolder);
      formData.append("type", type);
      formData.append("displayName", displayName.trim() || file.name);
      formData.append("file", file);
      const response = await fetch(apiUrl("/contents"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? "Falha no upload.");
      }
      const created = (await response.json().catch(() => null)) as { id?: unknown } | null;
      const createdId = typeof created?.id === "string" ? created.id : "";
      if (createdId && displayName.trim()) {
        setContentFileNames((prev) => ({ ...prev, [createdId]: displayName.trim() }));
      }
      if (pdfInputRef.current) pdfInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
      await refreshAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao enviar conteúdo.");
    }
  }

  async function handleCreateFolder(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (folderCreateLoading) return;
    setError("");
    if (!canEditContents) {
      setError("Sem permissão para criar pastas.");
      return;
    }
    const normalizedName = newFolderName.trim();
    if (!normalizedName) {
      const msg = "Nome da pasta é obrigatório.";
      setError(msg);
      return;
    }
    const nextPath = normalizeFolderPath(currentFolderPath ? `${currentFolderPath}/${normalizedName}` : normalizedName);
    if (!nextPath) {
      const msg = "Pasta inválida.";
      setError(msg);
      return;
    }
    setFolderCreateLoading(true);
    try {
      await apiPost("/contents/folder", { path: nextPath });
    } catch (requestError) {
      // Fallback legado: mantém pasta local só quando endpoint não existe.
      if (requestError instanceof Error && /404|Cannot POST/i.test(requestError.message)) {
        if (!manualFolders.includes(nextPath) && !folderPaths.includes(nextPath)) {
          setManualFolders((prev) => [...prev, nextPath]);
        }
        setCurrentFolderPath(currentFolderPath);
        setNewFolderName("");
        setIsFolderModalOpen(false);
        setFolderCreateLoading(false);
        return;
      }
      setError(requestError instanceof Error ? requestError.message : "Não foi possível criar a pasta.");
      setFolderCreateLoading(false);
      return;
    }
    try {
      await refreshAll();
      // Na criação pela tela raiz, manter na listagem de pastas.
      // Dentro de uma pasta, permanece no contexto atual.
      setCurrentFolderPath(currentFolderPath);
      setNewFolderName("");
      setIsFolderModalOpen(false);
    } finally {
      setFolderCreateLoading(false);
    }
  }

  async function openContentFileInNewTab(content: Content): Promise<void> {
    try {
      setError("");
      const response = await fetch(apiUrl(`/contents/${encodeURIComponent(content.id)}/file`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Não foi possível abrir o arquivo.");
      }
      const mime = response.headers.get("Content-Type") ?? "application/octet-stream";
      const blob = await response.blob();
      const typedBlob = blob.type ? blob : new Blob([await blob.arrayBuffer()], { type: mime });
      const objectUrl = URL.createObjectURL(typedBlob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (requestError) {
      const msg = requestError instanceof Error ? requestError.message : "Não foi possível abrir o arquivo.";
      setError(msg);
    }
  }

  function openFileModal(file: File, type: UploadContentType): void {
    setPendingUploadFile(file);
    setPendingUploadType(type);
    setUploadDisplayName(fileBaseName(file.name));
    setIsFileModalOpen(true);
  }

  async function handleConfirmFileUpload(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (fileUploadLoading) return;
    if (!pendingUploadFile || !pendingUploadType) return;
    const safeName = uploadDisplayName.trim();
    if (!safeName) {
      const msg = "Nome do arquivo é obrigatório.";
      setError(msg);
      return;
    }
    setFileUploadLoading(true);
    try {
      await uploadContentFile(pendingUploadFile, pendingUploadType, safeName);
      setIsFileModalOpen(false);
      setPendingUploadFile(null);
      setPendingUploadType(null);
      setUploadDisplayName("");
    } finally {
      setFileUploadLoading(false);
    }
  }

  function requestDeleteFolder(folderPath: string): void {
    if (!canEditContents) return;
    setPendingDeleteFolderPath(folderPath);
  }

  function requestDeleteContent(content: Content, displayLabel: string): void {
    if (!canEditContents) return;
    setPendingDeleteContentId(content.id);
    setPendingDeleteContentLabel(displayLabel);
  }

  async function handleConfirmDeleteContent(): Promise<void> {
    if (contentDeleteLoading) return;
    const id = pendingDeleteContentId;
    if (!id) return;
    if (!canEditContents) return;
    try {
      setContentDeleteLoading(true);
      setError("");
      const response = await fetch(apiUrl(`/contents/${encodeURIComponent(id)}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const raw = await response.text();
      let apiMessage = "";
      try {
        const parsed = JSON.parse(raw) as { message?: unknown };
        if (typeof parsed.message === "string" && parsed.message.trim()) {
          apiMessage = parsed.message.trim();
        }
      } catch {
        if (raw.trim()) {
          apiMessage = raw.trim().slice(0, 240);
        }
      }
      if (!response.ok) {
        throw new Error(
          apiMessage ||
            `Não foi possível excluir o arquivo (HTTP ${response.status}). Reinicie o servidor (npm start) para carregar a rota DELETE /api/contents/:id.`,
        );
      }
      setContentFileNames((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setPendingDeleteContentId("");
      setPendingDeleteContentLabel("");
      await refreshAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao excluir arquivo.");
    } finally {
      setContentDeleteLoading(false);
    }
  }

  async function handleConfirmDeleteFolder(): Promise<void> {
    if (folderDeleteLoading) return;
    const folderPath = pendingDeleteFolderPath;
    if (!folderPath) return;
    if (!canEditContents) return;
    try {
      setFolderDeleteLoading(true);
      setError("");
      const response = await fetch(`${apiUrl("/contents/folder")}?path=${encodeURIComponent(folderPath)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message ?? "Não foi possível excluir a pasta.");
      }
      setManualFolders((prev) =>
        prev.filter((item) => {
          const normalized = normalizeFolderPath(item);
          return normalized !== folderPath && !normalized.startsWith(`${folderPath}/`);
        }),
      );
      if (currentFolderPath === folderPath || currentFolderPath.startsWith(`${folderPath}/`)) {
        setCurrentFolderPath("");
      }
      setPendingDeleteFolderPath("");
      await refreshAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao excluir pasta.");
    } finally {
      setFolderDeleteLoading(false);
    }
  }

  if (!token) {
    if (publicRoute.kind === "convite_missing") {
      return <ConviteMissingView branding={branding} />;
    }
    if (publicRoute.kind === "convite") {
      return <ConviteFlow token={publicRoute.token} />;
    }
    if (publicRoute.kind === "ativar") {
      return <AtivarFlow />;
    }

    return (
      <main className="auth-layout">
        <section className="auth-card">
          {logoUnavailable ? (
            <strong className="logo logo--auth">Credilix</strong>
          ) : (
            <img
              className="logo logo--auth"
              src={visibleLogoUrl}
              alt="Credilix"
              width={220}
              height={64}
              onError={(event) => {
                if (event.currentTarget.src.includes(FALLBACK_LOGO_URL)) {
                  setLogoUnavailable(true);
                  return;
                }
                setLogoLoadFailed(true);
              }}
            />
          )}
          <p className="muted">Painel de conteúdos, produtos e comissões.</p>
          <form onSubmit={handleLogin} className="form-grid">
            <label>
              E-mail
              <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
            </label>
            <label>
              Senha
              <div className="password-input-wrap">
                <input
                  type={loginPasswordVisible ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-visibility-btn"
                  aria-label={loginPasswordVisible ? "Ocultar senha" : "Exibir senha"}
                  onClick={() => setLoginPasswordVisible((current) => !current)}
                >
                  {loginPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <button type="submit" disabled={loginLoading}>
              {loginLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
          {error ? <p className="error">{error}</p> : null}
          <p className="auth-footer-links">
            <a href="/ativar">Esqueci minha senha</a>
          </p>
        </section>
      </main>
    );
  }

  if (token && bootstrapping) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <p className="muted">Carregando sessão…</p>
        </section>
      </main>
    );
  }

  if (token && !session) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <p className="error">
            {error || "Não foi possível restaurar o painel. Verifique se a API está atualizada (rota /api/auth/me) e o Supabase."}
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setToken("");
              setSession(null);
              setError("");
              try {
                localStorage.removeItem(SESSION_STORAGE_KEY);
              } catch {
                /* ignore */
              }
            }}
          >
            Voltar ao login
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className={`app-shell ${navCollapsed ? "app-shell--nav-collapsed" : ""}`}>
      <button
        type="button"
        className={`nav-backdrop${navOpen ? " is-visible" : ""}`}
        aria-label="Fechar menu"
        onClick={() => setNavOpen(false)}
      />

      <aside className={`shell-nav${navOpen ? " is-open" : ""}${navCollapsed ? " is-collapsed" : ""}`}>
        <div className="shell-nav__top">
          <button
            type="button"
            className="shell-rail__menu-toggle"
            aria-expanded={!navCollapsed}
            aria-label={navCollapsed ? "Expandir menu" : "Recolher menu"}
            onClick={() => setNavCollapsed((c) => !c)}
          >
            {navCollapsed ? (
              <Menu {...RAIL_ICON_PROPS} aria-hidden />
            ) : (
              <PanelLeftClose {...RAIL_ICON_PROPS} aria-hidden />
            )}
          </button>
          {logoUnavailable ? (
            <strong className="logo logo--nav">Credilix</strong>
          ) : (
            <img
              className="logo logo--nav"
              src={visibleLogoUrl}
              alt="Credilix"
              width={160}
              height={48}
              onError={(event) => {
                if (event.currentTarget.src.includes(FALLBACK_LOGO_URL)) {
                  setLogoUnavailable(true);
                  return;
                }
                setLogoLoadFailed(true);
              }}
            />
          )}
          <button type="button" className="shell-nav__close" aria-label="Fechar" onClick={() => setNavOpen(false)}>
            ×
          </button>
        </div>

        <nav className="shell-menu shell-menu--rail" aria-label="Seções">
          <div className="shell-rail__group">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`shell-rail-item${activeModule === item.key ? " is-active" : ""}`}
                aria-current={activeModule === item.key ? "page" : undefined}
                onClick={() => goToModule(item.key)}
              >
                <span className="shell-rail-item__icon">
                  <RailModuleIcon module={item.key} />
                </span>
                <span className="shell-rail-item__label">{item.label}</span>
                {getModuleAlertCount(item.key) > 0 ? (
                  <span className="shell-rail-item__badge">{getModuleAlertCount(item.key)}</span>
                ) : null}
              </button>
            ))}
          </div>
          <div className="shell-rail__group shell-rail__group--footer">
            <div className="logged-user-info-wrap">
              <button
                type="button"
                className="shell-rail-profile-trigger"
                aria-label="Exibir dados do usuário logado"
                aria-expanded={isLoggedUserInfoOpen}
                onClick={() => setIsLoggedUserInfoOpen((cur) => !cur)}
              >
                <Users size={16} aria-hidden />
              </button>
              {isLoggedUserInfoOpen ? (
                <div className="logged-user-info-popover" role="dialog" aria-label="Dados do usuário logado">
                  <p>
                    <strong>Nome:</strong> {session?.fullName || "—"}
                  </p>
                  <p>
                    <strong>E-mail:</strong>{" "}
                    <button
                      type="button"
                      className="logged-user-email-copy"
                      onClick={() => void copyLoggedUserEmail()}
                      title="Clique para copiar e-mail"
                    >
                      <span className="logged-user-email-copy__text">{session?.email || "—"}</span>
                    </button>
                    {loggedUserEmailCopied ? <small className="logged-user-email-copy__feedback">copiado</small> : null}
                  </p>
                  <p>
                    <strong>CPF:</strong> {formatCpfForDisplay(session?.profile?.cpf)}
                  </p>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="shell-rail-item shell-rail-item--utility"
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            >
              <span className="shell-rail-item__icon">
                <SunMoon {...RAIL_ICON_PROPS} aria-hidden />
              </span>
              <span className="shell-rail-item__label">{theme === "dark" ? "Claro" : "Escuro"}</span>
            </button>
            <button
              type="button"
              className="shell-rail-item shell-rail-item--logout"
              onClick={() => {
                setToken("");
                setSession(null);
                setError("");
                setNavOpen(false);
                try {
                  localStorage.removeItem(SESSION_STORAGE_KEY);
                } catch {
                  /* ignore */
                }
              }}
            >
              <span className="shell-rail-item__icon">
                <LogOut {...RAIL_ICON_PROPS} aria-hidden />
              </span>
              <span className="shell-rail-item__label">Sair</span>
            </button>
          </div>
        </nav>
      </aside>

      <div className="shell-main">
        <header className="shell-header">
          <button
            type="button"
            className="shell-burger"
            aria-label="Abrir menu"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
          <h1 className="shell-header__title">{MODULE_TITLE[activeModule]}</h1>
          <div className="shell-header__alerts" aria-label="Alertas dos módulos">
            {navItems.map((item) => (
              (() => {
                const alertCount = getModuleAlertCount(item.key);
                const shouldPulse = bellPulse && alertCount > 0;
                return (
              <button
                key={`header-alert-${item.key}`}
                type="button"
                className={`shell-header__bell${shouldPulse ? " is-pulsing" : ""}`}
                aria-label={`${item.label}: ${alertCount} alerta(s)`}
                onClick={() => setActiveModule(item.key)}
              >
                <RailModuleIcon module={item.key} />
                {alertCount > 0 ? (
                  <span className="shell-header__bell-badge">{alertCount}</span>
                ) : null}
              </button>
                );
              })()
            ))}
          </div>
        </header>

        <main className="shell-body">
          {panelNotice || error ? (
            <div className="system-alerts-overlay" role="status" aria-live="polite">
              {panelNotice ? <p className="notice-banner system-alert system-alert--notice">{panelNotice}</p> : null}
              {error ? <p className="error error--banner system-alert system-alert--error">{error}</p> : null}
            </div>
          ) : null}

          {activeModule === "users" ? (
            <div className="module-grid">
              {canCreateUsers ? (
                <form className="card form-grid" onSubmit={handleCreateUser}>
                  <h3>Criar usuário</h3>
                  <label>
                    E-mail
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </label>
                  <label>
                    Tipo de usuário
                    <select
                      value={inviteRole}
                      onChange={(e) => {
                        const role = e.target.value as InviteRolePreset;
                        setInviteRole(role);
                        applyRolePreset(role);
                      }}
                    >
                      <option value="VENDEDOR">Vendedor</option>
                      <option value="SUPORTE">Suporte</option>
                      <option value="LIDER">Líder</option>
                    </select>
                  </label>
                  <fieldset className="perm-fieldset">
                    <legend className="perm-fieldset__legend">Permissões</legend>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={canManageUsersPermission}
                        disabled={!isMaster && !session!.canManageUsers}
                        onChange={(e) => setCanManageUsersPermission(e.target.checked)}
                      />
                      <span>Autorizar/Ativar usuários</span>
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={permViewContents}
                        disabled={!isMaster && !session!.permViewContents && !session!.permContents}
                        onChange={(e) => setPermViewContents(e.target.checked)}
                      />
                      <span>Acessar conteúdo e tabela</span>
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={permCreateManagers}
                        disabled={!isMaster && !session!.permCreateManagers}
                        onChange={(e) => setPermCreateManagers(e.target.checked)}
                      />
                      <span>Criar usuários gestores</span>
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={permCreateSellers}
                        disabled={!isMaster && !session!.permCreateSellers}
                        onChange={(e) => setPermCreateSellers(e.target.checked)}
                      />
                      <span>Criar usuários vendedores</span>
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={permCommissionTables}
                        disabled={!isMaster && !session!.permCommissionTables}
                        onChange={(e) => setPermCommissionTables(e.target.checked)}
                      />
                      <span>Editar/Criar tabela de comissão</span>
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={permContents}
                        disabled={!isMaster && !session!.permContents}
                        onChange={(e) => setPermContents(e.target.checked)}
                      />
                      <span>Editar/Criar conteúdos</span>
                    </label>
                  </fieldset>
                  <button type="submit" disabled={inviteLoading} className={inviteLoading ? "is-loading" : undefined}>
                    {inviteLoading ? (
                      <span className="submit-loading-content">
                        <span className="submit-spinner" aria-hidden="true" />
                        Enviando convite...
                      </span>
                    ) : (
                      "Criar usuário"
                    )}
                  </button>
                  {inviteLoading ? (
                    <p className="invite-submit-status" role="status" aria-live="polite">
                      Processando cadastro e envio do convite...
                    </p>
                  ) : null}
                </form>
              ) : null}

              <article className="card table-wrap">
                <div className="users-toolbar">
                  <div className="users-toolbar__top">
                    <h3 className="users-toolbar__title card-toolbar__title">Usuários</h3>
                    <div className="users-toolbar__actions">
                      <select
                        id="users-status-filter"
                        className="users-toolbar__filter-select"
                        value={usersStatusFilter}
                        onChange={(e) =>
                          setUsersStatusFilter(
                            e.target.value as "ALL" | "ACTIVE" | "INACTIVE" | "PENDING" | "REVIEW",
                          )
                        }
                      >
                        <option value="ALL">Todos</option>
                        <option value="ACTIVE">Ativo</option>
                        <option value="INACTIVE">Inativo</option>
                        <option value="PENDING">Pendente</option>
                        <option value="REVIEW">Aguardando ativação</option>
                      </select>
                      <button
                        type="button"
                        className="btn-secondary card-toolbar__action-btn"
                        onClick={() => void handleRefreshUsers()}
                        disabled={usersRefreshLoading}
                      >
                        <RefreshCw size={16} aria-hidden />
                        {usersRefreshLoading ? "Atualizando..." : "Atualizar"}
                      </button>
                    </div>
                  </div>
                  <div className="users-toolbar__search-row">
                    <input
                      type="search"
                      className="users-toolbar__search-input"
                      placeholder="Pesquisar por ID, CPF, nome ou e-mail"
                      value={usersSearchQuery}
                      onChange={(e) => setUsersSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th className="users-col-id">ID</th>
                      <th className="users-col-cpf">CPF</th>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Perfil</th>
                      <th>Status</th>
                      <th className="users-col-action-title">
                        <span>Ação</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="users-row-clickable" onClick={() => setSelectedUserDetails(user)}>
                        <td className="users-col-id">{user.systemCode ?? "—"}</td>
                        <td className="users-col-cpf">{user.profile?.cpf || "—"}</td>
                        <td>{displayNameInUserList(user)}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                          <div className="user-status-with-reason">
                            <span className={`user-status ${userStatusClassName(user)}`}>
                              <span className="user-status__dot" aria-hidden />
                              {formatUserLifecycleStatus(user)}
                            </span>
                            {user.statusReason ? (
                              <div
                                className="user-status-reason-wrap"
                                onMouseEnter={() => setUserReasonHoverUserId(user.id)}
                                onMouseLeave={() =>
                                  setUserReasonHoverUserId((cur) =>
                                    cur === user.id ? null : cur
                                  )
                                }
                              >
                                <button
                                  type="button"
                                  className="table-observation-icon user-status-reason-icon"
                                  aria-expanded={userReasonPinnedUserId === user.id || userReasonHoverUserId === user.id}
                                  aria-controls={`user-status-reason-${user.id}`}
                                  aria-label={`Motivo do status: ${user.statusReason}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUserReasonPinnedUserId((p) => (p === user.id ? null : user.id));
                                  }}
                                >
                                  <Info size={18} strokeWidth={2.25} aria-hidden />
                                </button>
                                {userReasonPinnedUserId === user.id || userReasonHoverUserId === user.id ? (
                                  <div id={`user-status-reason-${user.id}`} className="table-observation-flag" role="tooltip">
                                    {user.statusReason}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="user-actions-cell" onClick={(e) => e.stopPropagation()}>
                          {canCreateUsers ? (
                            <div className="user-actions-inline">
                              <button
                                type="button"
                                className="btn-secondary user-inline-btn user-inline-btn--edit"
                                onClick={() => openUserAction("EDIT", user)}
                                title="Editar"
                                aria-label={`Editar usuário ${displayNameInUserList(user)}`}
                              >
                                <Pencil size={14} aria-hidden />
                              </button>
                              <button
                                type="button"
                                className="btn-secondary user-inline-btn user-inline-btn--reset"
                                onClick={() => openUserAction("RESET", user)}
                                title="Resetar"
                                aria-label={`Resetar acesso de ${displayNameInUserList(user)}`}
                              >
                                <RotateCcw size={14} aria-hidden />
                              </button>
                              {(user.status ?? "").toUpperCase() === "PENDING_APPROVAL" ||
                              (user.status ?? "").toUpperCase() === "AWAITING_REVIEW" ? (
                                <button
                                  type="button"
                                  className="btn-secondary user-inline-btn user-inline-btn--approve"
                                  onClick={() => openUserAction("APPROVE", user)}
                                  title="Aprovar e ativar"
                                  aria-label={`Aprovar e ativar usuário ${displayNameInUserList(user)}`}
                                >
                                  <CheckCircle2 size={14} aria-hidden />
                                </button>
                              ) : (user.status ?? "").toUpperCase() === "INACTIVE" || (user.status ?? "").toUpperCase() === "BLOCKED" ? (
                                <button
                                  type="button"
                                  className="btn-secondary user-inline-btn user-inline-btn--activate"
                                  onClick={() => openUserAction("ACTIVE", user)}
                                  title="Ativar"
                                  aria-label={`Ativar usuário ${displayNameInUserList(user)}`}
                                >
                                  <CheckCircle2 size={14} aria-hidden />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-secondary user-inline-btn user-inline-btn--block"
                                  onClick={() => openUserAction("BLOCKED", user)}
                                  title="Bloquear"
                                  aria-label={`Bloquear usuário ${displayNameInUserList(user)}`}
                                >
                                  <XCircle size={14} aria-hidden />
                                </button>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="cell-muted">
                          Nenhum usuário encontrado com os filtros atuais.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </article>
            </div>
          ) : null}

          {selectedUserDetails ? (
            <div className="modal-backdrop" role="presentation" onClick={closeUserDetailsModal}>
              <div className="card modal-dialog" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
                <div className="modal-dialog__head">
                  <h3 className="modal-dialog__title">Detalhes do usuário</h3>
                  <button type="button" className="modal-dialog__close" onClick={closeUserDetailsModal} aria-label="Fechar">
                    <X size={16} aria-hidden />
                  </button>
                </div>
                <div className="form-grid form-grid--left">
                  <label>
                    ID
                    <input value={selectedUserDetails.systemCode ?? "—"} readOnly />
                  </label>
                  <label>
                    Nome
                    <input value={displayNameInUserList(selectedUserDetails)} readOnly />
                  </label>
                  <label>
                    E-mail
                    <input value={selectedUserDetails.email ?? "—"} readOnly />
                  </label>
                  <label>
                    Perfil
                    <input value={selectedUserDetails.role ?? "—"} readOnly />
                  </label>
                  <label>
                    Status
                    <input value={formatUserLifecycleStatus(selectedUserDetails)} readOnly />
                  </label>
                  <label>
                    CPF
                    <input value={selectedUserDetails.profile?.cpf ?? "—"} readOnly />
                  </label>
                  <label>
                    RG
                    <input value={selectedUserDetails.profile?.rg ?? "—"} readOnly />
                  </label>
                  <label>
                    Data de nascimento
                    <input value={formatBirthDateToBr(selectedUserDetails.profile?.birthDate ?? "") || "—"} readOnly />
                  </label>
                  <label>
                    Endereço
                    <input value={selectedUserDetails.profile?.address ?? "—"} readOnly />
                  </label>
                  <label>
                    CEP
                    <input value={selectedUserDetails.profile?.zipCode ?? "—"} readOnly />
                  </label>
                  <label>
                    Rua
                    <input value={selectedUserDetails.profile?.street ?? "—"} readOnly />
                  </label>
                  <label>
                    Bairro
                    <input value={selectedUserDetails.profile?.neighborhood ?? "—"} readOnly />
                  </label>
                  <label>
                    Cidade
                    <input value={selectedUserDetails.profile?.city ?? "—"} readOnly />
                  </label>
                  <label>
                    Estado
                    <input value={selectedUserDetails.profile?.state ?? "—"} readOnly />
                  </label>
                  <label>
                    Número
                    <input value={selectedUserDetails.profile?.addressNumber ?? "—"} readOnly />
                  </label>
                  <label>
                    Complemento
                    <input value={selectedUserDetails.profile?.addressComplement ?? "—"} readOnly />
                  </label>
                  <label>
                    Nome do pai
                    <input value={selectedUserDetails.profile?.fatherName ?? "—"} readOnly />
                  </label>
                  <label>
                    Nome da mãe
                    <input value={selectedUserDetails.profile?.motherName ?? "—"} readOnly />
                  </label>
                </div>
                <div className="user-edit-docs" style={{ marginTop: "1rem" }}>
                  <h4 className="onboarding-subtitle" style={{ marginTop: 0 }}>
                    Documentos enviados
                  </h4>
                  <div className="user-edit-docs__actions">
                    {selectedUserDetails.documents?.identityPath ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => void openUserUploadedFile(selectedUserDetails.documents?.identityPath, "Documento (frente)")}
                      >
                        Ver documento (frente)
                      </button>
                    ) : null}
                    {selectedUserDetails.documents?.identityBackPath ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => void openUserUploadedFile(selectedUserDetails.documents?.identityBackPath, "Documento (verso)")}
                      >
                        Ver documento (verso)
                      </button>
                    ) : null}
                    {selectedUserDetails.documents?.addressProofPath ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                          void openUserUploadedFile(selectedUserDetails.documents?.addressProofPath, "Comprovante de residência")
                        }
                      >
                        Ver comprovante de residência
                      </button>
                    ) : null}
                    {!selectedUserDetails.documents?.identityPath &&
                    !selectedUserDetails.documents?.identityBackPath &&
                    !selectedUserDetails.documents?.addressProofPath ? (
                      <p className="muted">Nenhum documento anexado para este usuário.</p>
                    ) : null}
                  </div>
                </div>
                <div className="modal-dialog__actions">
                  <button type="button" className="btn-ghost" onClick={closeUserDetailsModal}>
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {pendingUserActionTarget &&
          (pendingUserAction === "ACTIVE" || pendingUserAction === "INACTIVE" || pendingUserAction === "BLOCKED") ? (
            <div className="modal-backdrop" role="presentation">
              <div className="card modal-dialog" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
                <div className="modal-dialog__head">
                  <h3 className="modal-dialog__title">
                    {pendingUserAction === "ACTIVE"
                      ? "Ativar usuário"
                      : pendingUserAction === "INACTIVE"
                        ? "Inativar usuário"
                        : "Bloquear usuário"}
                  </h3>
                  <button type="button" className="modal-dialog__close" onClick={closeUserActionModal} aria-label="Fechar">
                    <X size={16} aria-hidden />
                  </button>
                </div>
                <p className="muted">{`Usuário: ${displayNameInUserList(pendingUserActionTarget)}`}</p>
                {pendingUserAction === "ACTIVE" ? (
                  <p className="muted">Confirma reativar este usuário para permitir novo login?</p>
                ) : (
                  <label>
                    Motivo
                    <input
                      value={pendingUserActionReason}
                      onChange={(e) => setPendingUserActionReason(e.target.value)}
                      placeholder="Descreva o motivo da ação"
                      required
                      autoFocus
                    />
                  </label>
                )}
                <div className="modal-dialog__actions">
                  <button type="button" className="btn-ghost" onClick={closeUserActionModal}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-confirm"
                    onClick={() => void handleConfirmUserStatusAction()}
                    disabled={userActionLoading}
                  >
                    {userActionLoading ? "Salvando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {pendingUserActionTarget && pendingUserAction === "RESET" ? (
            <div className="modal-backdrop" role="presentation">
              <div className="card modal-dialog" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
                <div className="modal-dialog__head">
                  <h3 className="modal-dialog__title">Resetar acesso</h3>
                  <button type="button" className="modal-dialog__close" onClick={closeUserActionModal} aria-label="Fechar">
                    <X size={16} aria-hidden />
                  </button>
                </div>
                <p className="muted">
                  {`Confirma resetar o acesso de "${displayNameInUserList(pendingUserActionTarget)}"? Será enviada uma senha temporária por e-mail.`}
                </p>
                <div className="modal-dialog__actions">
                  <button type="button" className="btn-ghost" onClick={closeUserActionModal}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-confirm"
                    onClick={() => void handleResetUserAccess()}
                    disabled={userActionLoading}
                  >
                    {userActionLoading ? "Enviando..." : "Confirmar reset"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {pendingUserActionTarget && pendingUserAction === "APPROVE" ? (
            <div className="modal-backdrop" role="presentation">
              <div className="card modal-dialog" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
                <div className="modal-dialog__head">
                  <h3 className="modal-dialog__title">Aprovar e ativar usuário</h3>
                  <button type="button" className="modal-dialog__close" onClick={closeUserActionModal} aria-label="Fechar">
                    <X size={16} aria-hidden />
                  </button>
                </div>
                <p className="muted">
                  {`Confirma aprovar "${displayNameInUserList(pendingUserActionTarget)}"? O usuário ficará ativo e poderá fazer login.`}
                </p>
                <div className="modal-dialog__actions">
                  <button type="button" className="btn-ghost" onClick={closeUserActionModal}>
                    Cancelar
                  </button>
                  <button type="button" className="btn-confirm" onClick={() => void handleApproveUser()} disabled={userActionLoading}>
                    {userActionLoading ? "Salvando..." : "Confirmar aprovação"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {pendingUserActionTarget && pendingUserAction === "EDIT" ? (
            <div className="modal-backdrop" role="presentation">
              <div className="card modal-dialog" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
                <div className="modal-dialog__head">
                  <h3 className="modal-dialog__title">Editar usuário</h3>
                  <button type="button" className="modal-dialog__close" onClick={closeUserActionModal} aria-label="Fechar">
                    <X size={16} aria-hidden />
                  </button>
                </div>
                <form className="modal-dialog__form form-grid form-grid--left" onSubmit={(e) => void handleSaveUserEdit(e)}>
                  {pendingUserActionTarget.documents &&
                  (pendingUserActionTarget.documents.identityPath ||
                    pendingUserActionTarget.documents.identityBackPath ||
                    pendingUserActionTarget.documents.addressProofPath) ? (
                    <div className="user-edit-docs">
                      <h4 className="onboarding-subtitle" style={{ marginTop: 0 }}>
                        Documentos do cadastro
                      </h4>
                      <div className="user-edit-docs__actions">
                        {pendingUserActionTarget.documents.identityPath ? (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() =>
                              void openUserUploadedFile(
                                pendingUserActionTarget.documents?.identityPath,
                                "Documento (frente)",
                              )
                            }
                          >
                            Ver documento (frente)
                          </button>
                        ) : null}
                        {pendingUserActionTarget.documents.identityBackPath ? (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() =>
                              void openUserUploadedFile(
                                pendingUserActionTarget.documents?.identityBackPath,
                                "Documento (verso)",
                              )
                            }
                          >
                            Ver documento (verso)
                          </button>
                        ) : null}
                        {pendingUserActionTarget.documents.addressProofPath ? (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() =>
                              void openUserUploadedFile(
                                pendingUserActionTarget.documents?.addressProofPath,
                                "Comprovante de residência",
                              )
                            }
                          >
                            Ver comprovante de residência
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  <label>
                    Nome completo
                    <input
                      value={editUserDraft.fullName}
                      onChange={(e) => setEditUserDraft((prev) => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    E-mail
                    <input
                      type="email"
                      value={editUserDraft.email}
                      onChange={(e) => setEditUserDraft((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Perfil
                    <select
                      value={editUserDraft.role}
                      onChange={(e) => setEditUserDraft((prev) => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="MASTER">Master</option>
                      <option value="LIDER">Líder</option>
                      <option value="SUPORTE">Suporte</option>
                      <option value="VENDEDOR">Vendedor</option>
                    </select>
                  </label>
                  <label>
                    CPF
                    <input
                      value={editUserDraft.cpf}
                      onChange={(e) => setEditUserDraft((prev) => ({ ...prev, cpf: maskCpfInput(e.target.value) }))}
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      required
                    />
                  </label>
                  <label>
                    RG
                    <input
                      value={editUserDraft.rg}
                      onChange={(e) => setEditUserDraft((prev) => ({ ...prev, rg: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Data de nascimento
                    <input
                      value={editUserDraft.birthDate}
                      onChange={(e) =>
                        setEditUserDraft((prev) => ({ ...prev, birthDate: maskBirthDateInput(e.target.value) }))
                      }
                      placeholder="DD/MM/AAAA"
                      inputMode="numeric"
                      required
                    />
                  </label>
                  <label>
                    Endereço (texto completo)
                    <input
                      value={editUserDraft.address}
                      onChange={(e) => setEditUserDraft((prev) => ({ ...prev, address: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Nome do pai
                    <input
                      value={editUserDraft.fatherName}
                      onChange={(e) => setEditUserDraft((prev) => ({ ...prev, fatherName: e.target.value }))}
                    />
                  </label>
                  <label>
                    Nome da mãe
                    <input
                      value={editUserDraft.motherName}
                      onChange={(e) => setEditUserDraft((prev) => ({ ...prev, motherName: e.target.value }))}
                    />
                  </label>
                  <label>
                    CEP
                    <input
                      value={editUserDraft.zipCode}
                      onChange={(e) => setEditUserDraft((prev) => ({ ...prev, zipCode: maskCepInput(e.target.value) }))}
                      placeholder="00000-000"
                      inputMode="numeric"
                    />
                  </label>
                  <label>
                    Logradouro
                    <input
                      value={editUserDraft.street}
                      onChange={(e) => setEditUserDraft((prev) => ({ ...prev, street: e.target.value }))}
                    />
                  </label>
                  <label>
                    Bairro
                    <input
                      value={editUserDraft.neighborhood}
                      onChange={(e) => setEditUserDraft((prev) => ({ ...prev, neighborhood: e.target.value }))}
                    />
                  </label>
                  <label>
                    Cidade
                    <input
                      value={editUserDraft.city}
                      onChange={(e) => setEditUserDraft((prev) => ({ ...prev, city: e.target.value }))}
                    />
                  </label>
                  <label>
                    UF
                    <input
                      value={editUserDraft.state}
                      onChange={(e) =>
                        setEditUserDraft((prev) => ({
                          ...prev,
                          state: e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2),
                        }))
                      }
                      maxLength={2}
                      placeholder="SP"
                    />
                  </label>
                  <label>
                    Número
                    <input
                      value={editUserDraft.addressNumber}
                      onChange={(e) => setEditUserDraft((prev) => ({ ...prev, addressNumber: e.target.value }))}
                    />
                  </label>
                  <label>
                    Complemento
                    <input
                      value={editUserDraft.addressComplement}
                      onChange={(e) => setEditUserDraft((prev) => ({ ...prev, addressComplement: e.target.value }))}
                    />
                  </label>
                  <label>
                    Motivo da edição
                    <input
                      value={pendingUserActionReason}
                      onChange={(e) => setPendingUserActionReason(e.target.value)}
                      required
                    />
                  </label>
                  <div className="modal-dialog__actions">
                    <button type="button" className="btn-ghost" onClick={closeUserActionModal}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={userActionLoading}>
                      {userActionLoading ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}

        {activeModule === "products" ? (
          <div className="row g-3 module-grid--products">
            {canEditCommissionTables ? (
              <form
                className="card form-grid form-grid--table-create commission-table-create-form col-12 col-lg-3"
                onSubmit={handleCreateProduct}
              >
                <div className="row gx-2 gy-1 table-create-row">
                  <label className="col-12">
                    <span className="field-head">
                      <span>Produto</span>
                      {isTypingNewProduct ? (
                        <button
                          type="button"
                          className="field-toggle"
                          onClick={() => {
                            setIsTypingNewProduct(false);
                            setProductName("");
                          }}
                        >
                          Usar existente
                        </button>
                      ) : null}
                    </span>
                    {isTypingNewProduct ? (
                      <input
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Digite o novo produto"
                        required
                      />
                    ) : (
                      <select
                        value={selectedProductValue}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === NEW_PRODUCT_OPTION) {
                            setIsTypingNewProduct(true);
                            setProductName("");
                            return;
                          }
                          setSelectedProductValue(value);
                        }}
                        required
                      >
                        <option value="">Selecione o produto</option>
                        <option value={NEW_PRODUCT_OPTION}>+ Adicionar Produto</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </label>
                  <label className="col-12">
                    <span className="field-head">
                      <span>Banco</span>
                      {isTypingNewBank ? (
                        <button
                          type="button"
                          className="field-toggle"
                          onClick={() => {
                            setIsTypingNewBank(false);
                            setBankName("");
                          }}
                        >
                          Usar existente
                        </button>
                      ) : null}
                    </span>
                    {isTypingNewBank ? (
                      <input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Digite o novo banco"
                        required
                      />
                    ) : (
                      <select
                        value={selectedBankValue}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === NEW_BANK_OPTION) {
                            setIsTypingNewBank(true);
                            setBankName("");
                            return;
                          }
                          setSelectedBankValue(value);
                        }}
                        required
                      >
                        <option value="">Selecione o banco</option>
                        <option value={NEW_BANK_OPTION}>+ Adicionar Banco</option>
                        {banks.map((bank) => (
                          <option key={bank.id} value={bank.id}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </label>
                  <label className="col-12">
                    Tabela
                    <input value={tableName} onChange={(e) => setTableName(e.target.value)} required />
                  </label>
                  <label className="col-12 col-sm-6">
                    Prazo
                    <input value={tableDeadline} onChange={(e) => setTableDeadline(e.target.value)} required />
                  </label>
                  <label className="col-12 col-sm-6">
                    Comissão %
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex.: 1.5"
                      value={tableCommission}
                      onChange={(e) => setTableCommission(e.target.value)}
                      required
                    />
                  </label>
                  <label className="col-12">
                    Observação
                    <input
                      value={tableObservation}
                      onChange={(e) => setTableObservation(e.target.value)}
                      placeholder="Opcional"
                    />
                  </label>
                </div>
                <button type="submit" disabled={productFormLoading} className={productFormLoading ? "is-loading" : undefined}>
                  {productFormLoading ? (
                    <span className="submit-loading-content">
                      <span className="submit-spinner" aria-hidden="true" />
                      Processando...
                    </span>
                  ) : (
                    "Incluir"
                  )}
                </button>
              </form>
            ) : null}
            <article className={canEditCommissionTables ? "col-12 col-lg-9" : "col-12"}>
              <div className="products-filters">
                <label>
                  Produto
                  <select value={filterProductId} onChange={(e) => setFilterProductId(e.target.value)}>
                    <option value="">Todos</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Banco
                  <select value={filterBankName} onChange={(e) => setFilterBankName(e.target.value)}>
                    <option value="">Todos</option>
                    {filterBankOptions.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {groupedTablesByProduct.length === 0 ? (
                <article className="card table-wrap">
                  <p className="muted">Nenhuma tabela encontrada para os filtros selecionados.</p>
                </article>
              ) : (
                groupedTablesByProduct.map(({ product, tables: productTables }) => (
                  <article key={product.id} className="card table-wrap product-table-card">
                    <div className="product-table-card__head">
                      <h3>{product.name}</h3>
                      {canEditCommissionTables ? (
                        <div className="table-actions-inline">
                          <button
                            type="button"
                            className="table-action-btn table-action-btn--edit"
                            title="Editar nome do produto"
                            aria-label={`Editar produto ${product.name}`}
                            onClick={() => void handleEditProductCardTitle(product)}
                          >
                            <Pencil size={14} aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="table-action-btn table-action-btn--delete"
                            title="Excluir todas as tabelas do produto"
                            aria-label={`Excluir tabelas de ${product.name}`}
                            onClick={() => requestDeleteProductTables(product)}
                          >
                            <Trash2 size={14} aria-hidden />
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>Banco</th>
                          <th>Nome da Tabela</th>
                          <th>Prazo</th>
                          <th>% Comissão</th>
                          <th>Obs.</th>
                          {canEditCommissionTables || isLeader ? <th>Ações</th> : null}
                        </tr>
                      </thead>
                      <tbody>
                        {productTables.map((table) => (
                          <tr key={table.id}>
                            <td>{table.bank}</td>
                            <td>{table.name}</td>
                            <td>{table.deadline}</td>
                            <td>{table.commissionPercent}</td>
                            <td className="cell-muted cell-observation">
                              {table.observation ? (
                                <div
                                  className="table-observation-wrap"
                                  onMouseEnter={() => setObservationHoverTableId(table.id)}
                                  onMouseLeave={() =>
                                    setObservationHoverTableId((cur) =>
                                      cur === table.id ? null : cur
                                    )
                                  }
                                >
                                  <button
                                    type="button"
                                    className="table-observation-icon"
                                    aria-expanded={
                                      observationPinnedTableId === table.id ||
                                      observationHoverTableId === table.id
                                    }
                                    aria-controls={`observation-flag-${table.id}`}
                                    aria-label={`Observação: ${table.observation}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setObservationPinnedTableId((p) =>
                                        p === table.id ? null : table.id
                                      );
                                    }}
                                  >
                                    <Info size={22} strokeWidth={2.25} aria-hidden />
                                  </button>
                                  {observationPinnedTableId === table.id ||
                                  observationHoverTableId === table.id ? (
                                    <div
                                      id={`observation-flag-${table.id}`}
                                      className="table-observation-flag"
                                      role="tooltip"
                                    >
                                      {table.observation}
                                    </div>
                                  ) : null}
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                            {canEditCommissionTables || isLeader ? (
                              <td>
                                <div className="table-actions-inline">
                                  {canEditCommissionTables ? (
                                    <>
                                      <button
                                        type="button"
                                        className="table-action-btn table-action-btn--edit"
                                        title="Editar tabela"
                                        aria-label={`Editar tabela ${table.name}`}
                                        onClick={() => void handleEditCommissionTable(table)}
                                      >
                                        <Pencil size={14} aria-hidden />
                                      </button>
                                      <button
                                        type="button"
                                        className="table-action-btn table-action-btn--delete"
                                        title="Excluir tabela"
                                        aria-label={`Excluir tabela ${table.name}`}
                                        disabled={commissionDeleteLoading}
                                        onClick={() => requestDeleteCommissionTable(table)}
                                      >
                                        <Trash2 size={14} aria-hidden />
                                      </button>
                                    </>
                                  ) : null}
                                  {isLeader ? (
                                    table.leaderRepasseActive ? (
                                      <button
                                        type="button"
                                        className="table-action-btn table-action-btn--deactivate"
                                        title="Desativar tabela para sua equipe"
                                        aria-label={`Desativar tabela ${table.name}`}
                                        disabled={repasseDeactivateTableId === table.id}
                                        onClick={() => void handleDeactivateCommissionRepasse(table)}
                                      >
                                        {repasseDeactivateTableId === table.id ? "Processando..." : "Desativar"}
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        className="table-action-btn table-action-btn--utilize"
                                        title="Utilizar tabela"
                                        aria-label={`Utilizar tabela ${table.name}`}
                                        disabled={Boolean(repasseDeactivateTableId)}
                                        onClick={() => openUtilizeCommissionTable(table)}
                                      >
                                        Utilizar
                                      </button>
                                    )
                                  ) : null}
                                </div>
                              </td>
                            ) : null}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </article>
                ))
              )}
            </article>
          </div>
        ) : null}

        {activeModule === "bankLogins" ? (
          <div className="module-grid">
            <form className="card form-grid" onSubmit={handleCreateBankLoginRequest}>
              <h3>Solicitar Login Banco</h3>
              {isMaster || isLeader ? (
                <>
                  <label>
                    Usuário da solicitação
                    <input
                      type="text"
                      value={bankLoginUserInput}
                      onChange={(e) => handleBankLoginUserInputChange(e.target.value)}
                      placeholder="Nome ou e-mail"
                      list="bank-login-users"
                      required
                    />
                  </label>
                  <datalist id="bank-login-users">
                    {bankLoginUserOptions.map((item) => (
                      <option key={item.id} value={item.label} />
                    ))}
                  </datalist>
                </>
              ) : null}
              <label>
                Produto
                <select value={bankLoginProductId} onChange={(e) => setBankLoginProductId(e.target.value)} required>
                  <option value="">Selecione</option>
                  {bankLoginProductOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Banco
                <select value={bankLoginBankName} onChange={(e) => setBankLoginBankName(e.target.value)} required>
                  <option value="">Selecione</option>
                  {filterBankOptions.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className={`btn-primary ${bankLoginSubmitLoading ? "is-loading" : ""}`} disabled={bankLoginSubmitLoading}>
                {bankLoginSubmitLoading ? (
                  <span className="submit-loading-content">
                    <span className="submit-spinner" aria-hidden />
                    Processando...
                  </span>
                ) : (
                  "Solicitar"
                )}
              </button>
            </form>

            <article className="card">
              <h3>Solicitações</h3>
              {bankLoginRequests.length === 0 ? (
                <p className="muted">Nenhuma solicitação registrada.</p>
              ) : (
                <>
                  <h4>Usuários Solicitados</h4>
                  {bankLoginRequestedItems.length === 0 ? (
                    <p className="muted">Nenhuma solicitação pendente.</p>
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Usuário</th>
                            <th>Produto</th>
                            <th>Banco</th>
                            <th>Status</th>
                            <th>Data</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bankLoginRequestedItems.map((request) => (
                            <tr key={request.id}>
                              <td>{users.find((item) => item.id === (request.targetUserId || request.requesterUserId))?.fullName || "—"}</td>
                              <td>{products.find((item) => item.id === request.productId)?.name || "—"}</td>
                              <td>{request.bankName}</td>
                              <td>Pendente</td>
                              <td>{new Date(request.createdAt).toLocaleString("pt-BR")}</td>
                              <td>
                                {canRespondBankLoginRequest(request) ? (
                                  <button
                                    type="button"
                                    className="table-action-btn table-action-btn--utilize"
                                    onClick={() => openRespondBankLoginModal(request)}
                                  >
                                    Responder
                                  </button>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <h4>Usuários Criados</h4>
                  {bankLoginCreatedItems.length === 0 ? (
                    <p className="muted">Nenhum login respondido.</p>
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Usuário</th>
                            <th>Produto</th>
                            <th>Banco</th>
                            <th>Respondido em</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bankLoginCreatedItems.map((request) => (
                            <tr key={request.id}>
                              <td>{users.find((item) => item.id === (request.targetUserId || request.requesterUserId))?.fullName || "—"}</td>
                              <td>{products.find((item) => item.id === request.productId)?.name || "—"}</td>
                              <td>{request.bankName}</td>
                              <td>{new Date(request.resolvedAt || request.updatedAt || request.createdAt).toLocaleString("pt-BR")}</td>
                              <td>
                                <button
                                  type="button"
                                  className="table-action-btn table-action-btn--deactivate"
                                  onClick={() => void openViewBankLoginModal(request)}
                                >
                                  Ver Login
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </article>
          </div>
        ) : null}

        {activeModule === "contents" ? (
          <div className="module-grid module-grid--contents">
            <section className="contents-page row g-3">
              <div className="col-12 contents-toolbar">
                {canEditContents ? (
                  <button type="button" className="contents-toolbar__add-btn" onClick={openFolderModal}>
                    <Plus size={18} aria-hidden />
                    Adicionar Pasta
                  </button>
                ) : null}
              </div>
              {isEmptyRootContents ? null : (
                <article className={`col-12 col-xl-10 ${currentFolderPath ? "card" : "contents-root-wrap"}`}>
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf"
                className="content-hidden-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  openFileModal(file, "PDF");
                }}
              />
              <input
                ref={imageInputRef}
                type="file"
                accept=".png,.jpg,.jpeg"
                className="content-hidden-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const ext = file.name.split(".").pop()?.toLowerCase();
                  const inferredType: UploadContentType = ext === "png" ? "PNG" : "JPEG";
                  openFileModal(file, inferredType);
                }}
              />
              {currentFolderPath ? (
                <article
                  className={`content-inside-panel${
                    currentFolderFiles.length === 0 ? " content-inside-panel--empty" : " content-inside-panel--has-files"
                  }`}
                >
                  {currentFolderFiles.length === 0 ? (
                    <div className="content-inside-panel__body-empty">
                      <div className="content-inside-panel__intro">
                        <h4>{currentFolderPath.split("/").pop() ?? currentFolderPath}</h4>
                        <p>{`Conteúdos: ${currentFolderFiles.length} itens`}</p>
                      </div>
                      {canGoBackFolder || canEditContents ? (
                        <div className="content-inside-panel__cta-center">
                          {canGoBackFolder ? (
                            <button type="button" className="content-inside-panel__back btn-ghost" onClick={goBackFolder}>
                              Voltar
                            </button>
                          ) : null}
                          {canEditContents ? (
                            <>
                              <button type="button" className="btn-secondary" onClick={openFolderModal}>
                                Adicionar Pasta
                              </button>
                              <button type="button" className="btn-secondary" onClick={() => pdfInputRef.current?.click()}>
                                Adicionar PDF
                              </button>
                              <button type="button" className="btn-secondary" onClick={() => imageInputRef.current?.click()}>
                                Adicionar Imagem
                              </button>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <div className="content-inside-panel__top">
                        <div>
                          <h4>{currentFolderPath.split("/").pop() ?? currentFolderPath}</h4>
                          <p>{`Conteúdos: ${currentFolderFiles.length} itens`}</p>
                        </div>
                        {canGoBackFolder || canEditContents ? (
                          <div className="content-inside-panel__actions">
                            {canGoBackFolder ? (
                              <button type="button" className="content-inside-panel__back btn-ghost" onClick={goBackFolder}>
                                Voltar
                              </button>
                            ) : null}
                            {canEditContents ? (
                              <>
                                <button type="button" className="btn-secondary" onClick={openFolderModal}>
                                  Adicionar Pasta
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => pdfInputRef.current?.click()}>
                                  Adicionar PDF
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => imageInputRef.current?.click()}>
                                  Adicionar Imagem
                                </button>
                              </>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <div className="content-file-list">
                        {currentFolderFiles.map((content) => {
                          const isImage =
                            content.type === "PNG" || content.type === "JPEG" || content.type === "IMAGE";
                          const fileName = content.filePath.split(/[\\/]/).pop() ?? content.filePath;
                          const displayName = content.displayName?.trim() || contentFileNames[content.id] || fileBaseName(fileName);
                          return (
                            <article key={content.id} className="content-file-item">
                              <button
                                type="button"
                                className="content-file-item__icon"
                                onClick={() => void openContentFileInNewTab(content)}
                                title="Abrir em nova aba"
                              >
                                {isImage ? <FileImage size={28} /> : <FileText size={28} />}
                              </button>
                              <div className="content-file-item__meta">
                                <button
                                  type="button"
                                  className="content-file-item__link"
                                  onClick={() => void openContentFileInNewTab(content)}
                                >
                                  {displayName}
                                </button>
                              </div>
                              {canEditContents ? (
                                <button
                                  type="button"
                                  className="content-file-item__delete"
                                  title="Excluir arquivo"
                                  aria-label={`Excluir arquivo ${displayName}`}
                                  onClick={() => requestDeleteContent(content, displayName)}
                                >
                                  <Trash2 size={16} aria-hidden />
                                </button>
                              ) : null}
                            </article>
                          );
                        })}
                      </div>
                    </>
                  )}
                  {currentFolderPath ? (
                    <div className="content-folders content-folders--inside">
                      {currentFolderChildren.map((path) => (
                        <article
                          key={path}
                          className={`content-folder ${
                            (folderDirectFileCounts.get(path) ?? 0) > 0 ? "content-folder--filled" : "content-folder--empty"
                          }`}
                        >
                          <button type="button" className="content-folder__open" onClick={() => setCurrentFolderPath(path)}>
                            <div className="content-folder__icon" aria-hidden />
                            <div className="content-folder__meta">
                              <h4>{path.split("/").pop() ?? path}</h4>
                              <p>{`Conteúdos: ${folderDirectFileCounts.get(path) ?? 0} itens`}</p>
                            </div>
                          </button>
                          {canEditContents ? (
                            <button
                              type="button"
                              className="content-folder__delete"
                              title="Excluir pasta"
                              aria-label={`Excluir pasta ${path.split("/").pop() ?? path}`}
                              onClick={() => requestDeleteFolder(path)}
                            >
                              <Trash2 size={16} aria-hidden />
                            </button>
                          ) : null}
                        </article>
                      ))}
                      {currentFolderChildren.length === 0 ? (
                        <article className="content-folder content-folder--empty">
                          <div className="content-folder__icon" aria-hidden />
                          <div className="content-folder__meta">
                            <h4>Nenhuma subpasta</h4>
                            <p>Conteúdos: 0 itens</p>
                          </div>
                        </article>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ) : null}
              {!currentFolderPath ? (
                <div className="content-folders content-folders--root">
                  {currentFolderChildren.map((path) => (
                    <article
                      key={path}
                      className={`content-folder ${
                        (folderDirectFileCounts.get(path) ?? 0) > 0 ? "content-folder--filled" : "content-folder--empty"
                      }`}
                    >
                      <button type="button" className="content-folder__open" onClick={() => setCurrentFolderPath(path)}>
                        <div className="content-folder__icon" aria-hidden />
                        <div className="content-folder__meta">
                          <h4>{path.split("/").pop() ?? path}</h4>
                          <p>{`Conteúdos: ${folderDirectFileCounts.get(path) ?? 0} itens`}</p>
                        </div>
                      </button>
                      {canEditContents ? (
                        <button
                          type="button"
                          className="content-folder__delete"
                          title="Excluir pasta"
                          aria-label={`Excluir pasta ${path.split("/").pop() ?? path}`}
                          onClick={() => requestDeleteFolder(path)}
                        >
                          <Trash2 size={16} aria-hidden />
                        </button>
                      ) : null}
                    </article>
                  ))}
                  {folderPaths.length === 0 ? null : currentFolderChildren.length === 0 ? (
                    <article className="content-folder content-folder--empty">
                      <div className="content-folder__icon" aria-hidden />
                      <div className="content-folder__meta">
                        <h4>Nenhuma subpasta</h4>
                        <p>Conteúdos: 0 itens</p>
                      </div>
                    </article>
                  ) : null}
                </div>
              ) : null}
                </article>
              )}
            {isFolderModalOpen ? (
              <div className="content-modal-backdrop" role="presentation" onClick={() => setIsFolderModalOpen(false)}>
                <div className="content-modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="content-modal__close"
                    aria-label="Fechar modal"
                    onClick={() => setIsFolderModalOpen(false)}
                  >
                    <X size={16} aria-hidden />
                  </button>
                  <h3>Nome da pasta</h3>
                  <form className="form-grid" onSubmit={handleCreateFolder}>
                    <label>
                      <input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder=""
                        required
                        autoFocus
                      />
                    </label>
                    <div className="contents-actions">
                      <button type="submit" disabled={folderCreateLoading} className={folderCreateLoading ? "is-loading" : undefined}>
                        {folderCreateLoading ? (
                          <span className="submit-loading-content">
                            <span className="submit-spinner" aria-hidden="true" />
                            Salvando...
                          </span>
                        ) : (
                          "Salvar"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}
            {isFileModalOpen ? (
              <div className="content-modal-backdrop" role="presentation" onClick={() => setIsFileModalOpen(false)}>
                <div className="content-modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
                  <h3>Nome do arquivo</h3>
                  <form className="form-grid" onSubmit={(e) => void handleConfirmFileUpload(e)}>
                    <label>
                      <input
                        value={uploadDisplayName}
                        onChange={(e) => setUploadDisplayName(e.target.value)}
                        placeholder=""
                        required
                        autoFocus
                      />
                    </label>
                    <div className="contents-actions">
                      <button type="button" className="btn-ghost" onClick={() => setIsFileModalOpen(false)}>
                        Cancelar
                      </button>
                      <button type="submit" className="content-modal__confirm" disabled={fileUploadLoading}>
                        {fileUploadLoading ? "Processando..." : "Confirmar"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}
            {pendingDeleteFolderPath ? (
              <div className="content-modal-backdrop" role="presentation" onClick={() => setPendingDeleteFolderPath("")}>
                <div
                  className="content-modal content-modal--confirm-delete"
                  role="dialog"
                  aria-modal
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="content-modal__close"
                    aria-label="Fechar confirmação"
                    onClick={() => setPendingDeleteFolderPath("")}
                  >
                    <X size={16} aria-hidden />
                  </button>
                  <h3>Excluir pasta</h3>
                  <p className="content-modal__description">
                    {`Deseja excluir a pasta "${pendingDeleteFolderPath.split("/").pop() ?? pendingDeleteFolderPath}" e todo o conteúdo dela?`}
                  </p>
                  <div className="contents-actions">
                    <button type="button" className="btn-ghost" onClick={() => setPendingDeleteFolderPath("")}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="content-modal__danger"
                      disabled={folderDeleteLoading}
                      onClick={() => void handleConfirmDeleteFolder()}
                    >
                      {folderDeleteLoading ? "Processando..." : "Excluir pasta"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {pendingDeleteContentId ? (
              <div
                className="content-modal-backdrop"
                role="presentation"
                onClick={() => {
                  setPendingDeleteContentId("");
                  setPendingDeleteContentLabel("");
                }}
              >
                <div
                  className="content-modal content-modal--confirm-delete"
                  role="dialog"
                  aria-modal
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="content-modal__close"
                    aria-label="Fechar confirmação"
                    onClick={() => {
                      setPendingDeleteContentId("");
                      setPendingDeleteContentLabel("");
                    }}
                  >
                    <X size={16} aria-hidden />
                  </button>
                  <h3>Excluir arquivo</h3>
                  <p className="content-modal__description">
                    {`Deseja excluir o arquivo "${pendingDeleteContentLabel}"? Esta ação não pode ser desfeita.`}
                  </p>
                  <div className="contents-actions">
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => {
                        setPendingDeleteContentId("");
                        setPendingDeleteContentLabel("");
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="content-modal__danger"
                      disabled={contentDeleteLoading}
                      onClick={() => void handleConfirmDeleteContent()}
                    >
                      {contentDeleteLoading ? "Processando..." : "Excluir arquivo"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            </section>
          </div>
        ) : null}
        {respondBankLoginDraft ? (
          <div className="content-modal-backdrop" role="presentation" onClick={() => setRespondBankLoginDraft(null)}>
            <div className="content-modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="content-modal__close"
                aria-label="Fechar modal"
                onClick={() => setRespondBankLoginDraft(null)}
              >
                ×
              </button>
              <h3>Responder solicitação</h3>
              <form className="form-grid" onSubmit={(e) => void handleRespondBankLoginRequest(e)}>
                <label>
                  Nome do Banco
                  <input value={respondBankLoginDraft.bankName} disabled />
                </label>
                <label>
                  Produto
                  <input value={products.find((item) => item.id === respondBankLoginDraft.productId)?.name || "—"} disabled />
                </label>
                <label>
                  Usuário
                  <input value={respondLoginUser} onChange={(e) => setRespondLoginUser(e.target.value)} required />
                </label>
                <label>
                  Senha
                  <input value={respondLoginPassword} onChange={(e) => setRespondLoginPassword(e.target.value)} required />
                </label>
                <div className="contents-actions">
                  <button type="button" className="btn-ghost" onClick={() => setRespondBankLoginDraft(null)} disabled={respondBankLoginLoading}>
                    Cancelar
                  </button>
                  <button type="submit" className="content-modal__confirm" disabled={respondBankLoginLoading}>
                    {respondBankLoginLoading ? "Processando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {viewBankLoginDraft ? (
          <div className="content-modal-backdrop" role="presentation" onClick={() => setViewBankLoginDraft(null)}>
            <div className="content-modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="content-modal__close"
                aria-label="Fechar modal"
                onClick={() => setViewBankLoginDraft(null)}
              >
                ×
              </button>
              <h3>Visualizar login</h3>
              <form className="form-grid">
                <label>
                  Nome do Usuário
                  <input
                    value={
                      users.find((item) => item.id === (viewBankLoginDraft.targetUserId || viewBankLoginDraft.requesterUserId))
                        ?.fullName || "—"
                    }
                    disabled
                  />
                </label>
                <label>
                  E-mail do Usuário
                  <input
                    value={
                      users.find((item) => item.id === (viewBankLoginDraft.targetUserId || viewBankLoginDraft.requesterUserId))
                        ?.email || "—"
                    }
                    disabled
                  />
                </label>
                <label>
                  Nome do Banco
                  <input value={viewBankLoginDraft.bankName} disabled />
                </label>
                <label>
                  Produto
                  <input value={products.find((item) => item.id === viewBankLoginDraft.productId)?.name || "—"} disabled />
                </label>
                <label>
                  Usuário
                  <div className="readonly-copy-field">
                    <input value={viewBankLoginDraft.loginUser || "—"} disabled />
                    <button
                      type="button"
                      className="readonly-copy-field__btn"
                      aria-label="Copiar usuário"
                      title="Copiar usuário"
                      onClick={() => void copyBankLoginValue("user", viewBankLoginDraft.loginUser || "")}
                    >
                      <i className="bi bi-copy" aria-hidden />
                    </button>
                  </div>
                  {copiedBankLoginField === "user" ? <small className="muted">Usuário copiado.</small> : null}
                </label>
                <label>
                  Senha
                  <div className="readonly-copy-field">
                    <input value={viewBankLoginDraft.loginPassword || "—"} disabled />
                    <button
                      type="button"
                      className="readonly-copy-field__btn"
                      aria-label="Copiar senha"
                      title="Copiar senha"
                      onClick={() => void copyBankLoginValue("password", viewBankLoginDraft.loginPassword || "")}
                    >
                      <i className="bi bi-copy" aria-hidden />
                    </button>
                  </div>
                  {copiedBankLoginField === "password" ? <small className="muted">Senha copiada.</small> : null}
                </label>
                <div className="contents-actions">
                  <button type="button" className="content-modal__confirm" onClick={() => setViewBankLoginDraft(null)}>
                    Fechar
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {editingCommissionTable ? (
          <div className="content-modal-backdrop" role="presentation" onClick={() => setEditingCommissionTable(null)}>
            <div className="content-modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="content-modal__close"
                aria-label="Fechar edição da tabela"
                onClick={() => setEditingCommissionTable(null)}
              >
                <X size={16} aria-hidden />
              </button>
              <h3>Editar tabela</h3>
              <form className="form-grid" onSubmit={(e) => void handleSaveCommissionTableEdit(e)}>
                <label>
                  Banco
                  <input
                    value={editingCommissionTable.bank}
                    onChange={(e) => setEditingCommissionTable((prev) => (prev ? { ...prev, bank: e.target.value } : prev))}
                    required
                    autoFocus
                  />
                </label>
                <label>
                  Nome da Tabela
                  <input
                    value={editingCommissionTable.name}
                    onChange={(e) => setEditingCommissionTable((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                    required
                  />
                </label>
                <label>
                  Prazo
                  <input
                    value={editingCommissionTable.deadline}
                    onChange={(e) => setEditingCommissionTable((prev) => (prev ? { ...prev, deadline: e.target.value } : prev))}
                    required
                  />
                </label>
                <label>
                  Comissão %
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editingCommissionTable.commissionPercent}
                    onChange={(e) =>
                      setEditingCommissionTable((prev) => (prev ? { ...prev, commissionPercent: e.target.value } : prev))
                    }
                    required
                  />
                </label>
                <label>
                  Observação (opcional)
                  <input
                    value={editingCommissionTable.observation}
                    onChange={(e) =>
                      setEditingCommissionTable((prev) => (prev ? { ...prev, observation: e.target.value } : prev))
                    }
                  />
                </label>
                <div className="contents-actions">
                  <button type="button" className="btn-ghost" onClick={() => setEditingCommissionTable(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="content-modal__confirm" disabled={commissionEditLoading}>
                    {commissionEditLoading ? "Processando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
        {utilizeTableDraft ? (
          <div className="content-modal-backdrop" role="presentation" onClick={() => setUtilizeTableDraft(null)}>
            <div className="content-modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="content-modal__close"
                aria-label="Fechar utilização da tabela"
                onClick={() => setUtilizeTableDraft(null)}
              >
                <X size={16} aria-hidden />
              </button>
              <h3>Utilizar tabela</h3>
              <form className="form-grid" onSubmit={(e) => void handleApplyCommissionRepasse(e)}>
                <label>
                  Banco
                  <input value={utilizeTableDraft.bank} disabled />
                </label>
                <label>
                  Nome da Tabela
                  <input value={utilizeTableDraft.name} disabled />
                </label>
                <label>
                  Prazo
                  <input value={utilizeTableDraft.deadline} disabled />
                </label>
                <label>
                  Comissão MASTER %
                  <input value={String(utilizeTableDraft.baseCommissionPercent)} disabled />
                </label>
                <label>
                  Seu repasse %
                  <input
                    type="text"
                    inputMode="decimal"
                    value={utilizeTableDraft.commissionPercent}
                    onChange={(e) =>
                      setUtilizeTableDraft((prev) => (prev ? { ...prev, commissionPercent: e.target.value } : prev))
                    }
                    placeholder="Deve ser menor que a comissão master"
                    required
                    autoFocus
                  />
                </label>
                <div className="contents-actions">
                  <button type="button" className="btn-ghost" onClick={() => setUtilizeTableDraft(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="content-modal__confirm" disabled={repasseSaveLoading}>
                    {repasseSaveLoading ? "Processando..." : "Salvar repasse"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
        {editingProduct ? (
          <div className="content-modal-backdrop" role="presentation" onClick={() => setEditingProduct(null)}>
            <div className="content-modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="content-modal__close"
                aria-label="Fechar edição do produto"
                onClick={() => setEditingProduct(null)}
              >
                <X size={16} aria-hidden />
              </button>
              <h3>Editar nome do produto</h3>
              <form className="form-grid" onSubmit={(e) => void handleSaveProductName(e)}>
                <label>
                  Nome do produto
                  <input
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                    required
                    autoFocus
                  />
                </label>
                <div className="contents-actions">
                  <button type="button" className="btn-ghost" onClick={() => setEditingProduct(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="content-modal__confirm" disabled={productEditLoading}>
                    {productEditLoading ? "Processando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
        {pendingDeleteCommissionTableId ? (
          <div
            className="content-modal-backdrop"
            role="presentation"
            onClick={() => {
              setPendingDeleteCommissionTableId("");
              setPendingDeleteCommissionTableLabel("");
            }}
          >
            <div className="content-modal content-modal--confirm-delete" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="content-modal__close"
                aria-label="Fechar confirmação"
                onClick={() => {
                  setPendingDeleteCommissionTableId("");
                  setPendingDeleteCommissionTableLabel("");
                }}
              >
                <X size={16} aria-hidden />
              </button>
              <h3>Excluir tabela</h3>
              <p className="content-modal__description">
                {`Deseja excluir a tabela "${pendingDeleteCommissionTableLabel}"? Esta ação não pode ser desfeita.`}
              </p>
              <div className="contents-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setPendingDeleteCommissionTableId("");
                    setPendingDeleteCommissionTableLabel("");
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="content-modal__danger"
                  disabled={commissionDeleteLoading}
                  onClick={() => void handleDeleteCommissionTable()}
                >
                  {commissionDeleteLoading ? "Processando..." : "Excluir tabela"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {pendingDeleteProductTablesId ? (
          <div
            className="content-modal-backdrop"
            role="presentation"
            onClick={() => {
              setPendingDeleteProductTablesId("");
              setPendingDeleteProductTablesLabel("");
            }}
          >
            <div className="content-modal content-modal--confirm-delete" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="content-modal__close"
                aria-label="Fechar confirmação"
                onClick={() => {
                  setPendingDeleteProductTablesId("");
                  setPendingDeleteProductTablesLabel("");
                }}
              >
                <X size={16} aria-hidden />
              </button>
              <h3>Excluir tabelas do produto</h3>
              <p className="content-modal__description">
                {`Deseja excluir todas as tabelas do produto "${pendingDeleteProductTablesLabel}"? Esta ação não pode ser desfeita.`}
              </p>
              <div className="contents-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setPendingDeleteProductTablesId("");
                    setPendingDeleteProductTablesLabel("");
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="content-modal__danger"
                  disabled={productDeleteTablesLoading}
                  onClick={() => void handleDeleteProductTables()}
                >
                  {productDeleteTablesLoading ? "Processando..." : "Excluir tabelas"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        </main>
      </div>
    </div>
  );
}

export default App;
