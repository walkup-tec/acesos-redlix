import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AtivarFlow,
  ConviteFlow,
  ConviteMissingView,
  readPublicRoute,
} from "./onboarding-ui";

type ModuleKey = "users" | "products" | "contents";

const MODULE_TITLE: Record<ModuleKey, string> = {
  users: "Usuários",
  products: "Tabela de Comissão",
  contents: "Conteúdos",
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
};

const SESSION_STORAGE_KEY = "credilix_session";
const THEME_STORAGE_KEY = "credilix_theme";
const DARK_LOGO_URL = "file:///D:/Site%20Credilix/dist/logo-credilix-light.png";

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

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  canManageUsers?: boolean;
  permViewContents?: boolean;
  permCreateManagers?: boolean;
  permCreateSellers?: boolean;
  permCommissionTables?: boolean;
  permContents?: boolean;
};

function formatUserPermissionLabels(u: User): string {
  const parts: string[] = [];
  if (u.canManageUsers) parts.push("Autorizar/Ativar");
  if (u.permViewContents) parts.push("Acessar conteúdo");
  if (u.permCreateManagers) parts.push("Gestores");
  if (u.permCreateSellers) parts.push("Vendedores");
  if (u.permCommissionTables) parts.push("Tabelas");
  if (u.permContents) parts.push("Conteúdos");
  return parts.length > 0 ? parts.join(", ") : "—";
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

function NavCollapseIcon({ pointsLeft }: { pointsLeft: boolean }) {
  return (
    <svg className="shell-nav__chevron" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        d={pointsLeft ? "M14 7l-5 5 5 5" : "M10 7l5 5-5 5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

type Product = {
  id: string;
  name: string;
};

const NEW_PRODUCT_OPTION = "__new__";

type CommissionTable = {
  id: string;
  bank: string;
  name: string;
  deadline: string;
  commissionPercent: number;
  observation?: string;
  productId: string;
};

type Content = {
  id: string;
  title: string;
  type: string;
  filePath: string;
};

type BankApiItem = {
  code: number | null;
  fullName?: string;
  name?: string;
};

const FALLBACK_BANKS = [
  "001 - Banco do Brasil S.A.",
  "033 - Banco Santander (Brasil) S.A.",
  "041 - Banco do Estado do Rio Grande do Sul S.A.",
  "104 - Caixa Economica Federal",
  "212 - Banco Original S.A.",
  "237 - Banco Bradesco S.A.",
  "260 - Nu Pagamentos S.A.",
  "290 - PagSeguro Internet Instituicao de Pagamento S.A.",
  "341 - Itau Unibanco S.A.",
  "756 - Banco Cooperativo Sicoob S.A.",
];

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
  const [tables, setTables] = useState<CommissionTable[]>([]);
  const [contents, setContents] = useState<Content[]>([]);

  const [loginEmail, setLoginEmail] = useState("master@credilix.local");
  const [loginPassword, setLoginPassword] = useState("Master@123");

  const [publicRoute] = useState(() => readPublicRoute());
  const [panelNotice, setPanelNotice] = useState<string>("");
  const [inviteRole, setInviteRole] = useState<InviteRolePreset>("VENDEDOR");
  const [inviteEmail, setInviteEmail] = useState("");
  const [canManageUsersPermission, setCanManageUsersPermission] = useState(false);
  const [permViewContents, setPermViewContents] = useState(true);
  const [permCreateManagers, setPermCreateManagers] = useState(false);
  const [permCreateSellers, setPermCreateSellers] = useState(false);
  const [permCommissionTables, setPermCommissionTables] = useState(false);
  const [permContents, setPermContents] = useState(false);

  const [productName, setProductName] = useState("");
  const [selectedProductValue, setSelectedProductValue] = useState(NEW_PRODUCT_OPTION);
  const [isTypingNewProduct, setIsTypingNewProduct] = useState(false);

  const [tableName, setTableName] = useState("");
  const [tableDeadline, setTableDeadline] = useState("");
  const [tableCommission, setTableCommission] = useState("1");
  const [tableBank, setTableBank] = useState("");
  const [tableObservation, setTableObservation] = useState("");
  const [bankOptions, setBankOptions] = useState<string[]>(FALLBACK_BANKS);
  const [bankSearch, setBankSearch] = useState("");

  const [contentTitle, setContentTitle] = useState("");
  const [contentType, setContentType] = useState("PDF");
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => readStoredTheme());

  useEffect(() => {
    void loadBranding();
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
    const controller = new AbortController();
    const loadBanks = async () => {
      try {
        const response = await fetch("https://brasilapi.com.br/api/banks/v1", { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Falha ao carregar bancos.");
        }
        const data = (await response.json()) as BankApiItem[];
        const normalized = data
          .filter((item) => item.code !== null && (item.fullName || item.name))
          .map((item) => {
            const code = String(item.code).padStart(3, "0");
            const name = (item.fullName ?? item.name ?? "").trim();
            return `${code} - ${name}`;
          })
          .sort((a, b) => a.localeCompare(b, "pt-BR"));
        if (normalized.length > 0) {
          setBankOptions(normalized);
        }
      } catch {
        setBankOptions((prev) => (prev.length > 0 ? prev : FALLBACK_BANKS));
      }
    };
    void loadBanks();
    return () => controller.abort();
  }, []);

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

  const refreshAll = useCallback(async () => {
    const authToken = token;
    if (!authToken) {
      return;
    }
    setError("");
    const headers = { Authorization: `Bearer ${authToken}` };
    const loadJson = async <T,>(path: string, label: string): Promise<T> => {
      const response = await fetch(apiUrl(path), { headers });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message ?? `Falha ao carregar ${label}.`);
      }
      return body as T;
    };

    const [u, p, t, c] = await Promise.allSettled([
      loadJson<User[]>("/users", "usuários"),
      loadJson<Product[]>("/products", "produtos"),
      loadJson<CommissionTable[]>("/commission-tables", "tabelas"),
      loadJson<Content[]>("/contents", "conteúdos"),
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

    if (failures.length > 0) {
      setError(failures.join(" · "));
    }
  }, [token]);

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

  const isMaster = Boolean(session && session.role.toUpperCase() === "MASTER");
  const canCreateUsers = Boolean(session && (isMaster || session.canManageUsers));
  const canEditCommissionTables = Boolean(session && (isMaster || session.permCommissionTables));
  const canViewContents = Boolean(session && (isMaster || session.permViewContents || session.permContents));
  const canEditContents = Boolean(session && (isMaster || session.permContents));
  const filteredBankOptions = useMemo(() => {
    const term = bankSearch.trim().toLocaleLowerCase("pt-BR");
    if (!term) {
      return bankOptions;
    }
    const startsWithCode = bankOptions.filter((item) =>
      item.toLocaleLowerCase("pt-BR").startsWith(term),
    );
    const includesTerm = bankOptions.filter((item) => {
      const value = item.toLocaleLowerCase("pt-BR");
      return !value.startsWith(term) && value.includes(term);
    });
    return [...startsWithCode, ...includesTerm];
  }, [bankOptions, bankSearch]);
  const activeLogoUrl = theme === "dark" ? DARK_LOGO_URL : branding?.logoUrl;

  const applyRolePreset = useCallback((role: InviteRolePreset) => {
    const preset = ROLE_PRESETS[role];
    setCanManageUsersPermission(preset.canManageUsers);
    setPermViewContents(preset.permViewContents);
    setPermCreateManagers(preset.permCreateManagers);
    setPermCreateSellers(preset.permCreateSellers);
    setPermCommissionTables(preset.permCommissionTables);
    setPermContents(preset.permContents);
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }
    if (activeModule === "contents" && !canViewContents) {
      setActiveModule("users");
    }
  }, [session, activeModule, canViewContents]);

  const navItems = useMemo(() => {
    const all: { key: ModuleKey; label: string; short: string }[] = [
      { key: "users", label: "Usuários", short: "Usu." },
      { key: "products", label: "Tabela de Comissão", short: "Tab." },
      { key: "contents", label: "Conteúdos", short: "Cont." },
    ];
    return all.filter((item) => {
      if (isMaster) {
        return true;
      }
      if (item.key === "contents") {
        return canViewContents;
      }
      return true;
    });
  }, [isMaster, canViewContents]);

  function goToModule(module: ModuleKey): void {
    setActiveModule(module);
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
    setError("");
    if (!canCreateUsers) {
      setError("Sem permissão para criar usuários.");
      return;
    }
    if (!token) {
      return;
    }
    try {
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
        emailSent?: boolean;
        emailError?: string;
      };
      if (!response.ok) {
        throw new Error(body.message ?? "Não foi possível criar usuário.");
      }
      if (body.emailSent === false && body.emailError) {
        setPanelNotice(`Usuário criado, mas o e-mail não foi enviado: ${body.emailError}`);
      } else {
        setPanelNotice("Usuário criado e convite enviado por e-mail.");
      }
      setInviteEmail("");
      setInviteRole("VENDEDOR");
      applyRolePreset("VENDEDOR");
      await refreshAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível criar usuário.");
    }
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    try {
      let productId = "";
      if (isTypingNewProduct) {
        const normalizedName = productName.trim();
        if (!normalizedName) {
          const msg = "Nome do produto é obrigatório.";
          window.alert(msg);
          setError(msg);
          return;
        }
        const createdProduct = await apiPost<Product>("/products", { name: normalizedName });
        productId = createdProduct.id;
      } else {
        if (!selectedProductValue) {
          const msg = "Nome do produto é obrigatório.";
          window.alert(msg);
          setError(msg);
          return;
        }
        productId = selectedProductValue;
      }

      if (canEditCommissionTables) {
        const normalizedTableName = tableName.trim();
        if (!normalizedTableName) {
          const msg = "Nome da tabela é obrigatório.";
          window.alert(msg);
          setError(msg);
          return;
        }
        const normalizedBank = tableBank.trim();
        if (!normalizedBank) {
          const msg = "Banco é obrigatório.";
          window.alert(msg);
          setError(msg);
          return;
        }
        const commissionValue = Number(tableCommission);
        if (!Number.isFinite(commissionValue) || commissionValue <= 0) {
          const msg = "Comissão é obrigatória.";
          window.alert(msg);
          setError(msg);
          return;
        }
        await apiPost("/commission-tables", {
          productId,
          bank: normalizedBank,
          name: normalizedTableName,
          deadline: tableDeadline,
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
      setTableBank("");
      setBankSearch("");
      setTableObservation("");
      await refreshAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível criar produto/tabela.");
    }
  }

  async function handleUploadContent(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    if (!contentFile) {
      setError("Selecione um arquivo.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("title", contentTitle);
      formData.append("type", contentType);
      formData.append("file", contentFile);
      const response = await fetch(apiUrl("/contents"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? "Falha no upload.");
      }
      setContentTitle("");
      setContentFile(null);
      await refreshAll();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao enviar conteúdo.");
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
          {activeLogoUrl ? (
            <img className="logo logo--auth" src={activeLogoUrl} alt="" width={220} height={64} />
          ) : null}
          <p className="muted">Painel de conteúdos, produtos e comissões.</p>
          <form onSubmit={handleLogin} className="form-grid">
            <label>
              E-mail
              <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
            </label>
            <label>
              Senha
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={loginLoading}>
              {loginLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
          {error ? <p className="error">{error}</p> : null}
          <p className="auth-footer-links">
            <a href="/ativar">Primeiro acesso, recuperar senha ou novo código</a>
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
          {activeLogoUrl ? (
            <img className="logo logo--nav" src={activeLogoUrl} alt="" width={160} height={48} />
          ) : null}
          <button
            type="button"
            className="shell-nav__pin"
            aria-expanded={!navCollapsed}
            aria-label={navCollapsed ? "Expandir menu" : "Recolher menu"}
            onClick={() => setNavCollapsed((c) => !c)}
          >
            <NavCollapseIcon pointsLeft={!navCollapsed} />
          </button>
          <button type="button" className="shell-nav__close" aria-label="Fechar" onClick={() => setNavOpen(false)}>
            ×
          </button>
        </div>

        <nav className="shell-menu" aria-label="Seções">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={activeModule === item.key ? "is-active" : ""}
              onClick={() => goToModule(item.key)}
            >
              <span className="shell-menu__full">{item.label}</span>
              <span className="shell-menu__short" aria-hidden>
                {item.short}
              </span>
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="shell-logout"
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
          Sair
        </button>
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
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "Modo claro" : "Modo escuro"}
          </button>
          <button type="button" className="shell-refresh" onClick={() => void refreshAll()}>
            Atualizar
          </button>
        </header>

        <main className="shell-body">
          {panelNotice ? <p className="notice-banner">{panelNotice}</p> : null}
          {error ? <p className="error error--banner">{error}</p> : null}

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
                      <span>Acessar conteúdo</span>
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
                  <button type="submit">Criar usuário</button>
                </form>
              ) : null}

              <article className="card table-wrap">
                <div className="card-toolbar">
                  <h3 className="card-toolbar__title">Usuários</h3>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Perfil</th>
                      <th>Permissões</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.fullName}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td className="cell-muted">{formatUserPermissionLabels(user)}</td>
                        <td>{user.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            </div>
          ) : null}

        {activeModule === "products" ? (
          <div className="module-grid">
            <form className="card form-grid form-grid--table-create" onSubmit={handleCreateProduct}>
              <h3>Criação de Tabela</h3>
              <div className="table-create-row">
                <label>
                  Produto
                  {isTypingNewProduct ? (
                    <>
                      <input
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Digite o novo produto"
                        required
                      />
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => {
                          setIsTypingNewProduct(false);
                          setProductName("");
                        }}
                      >
                        Usar produto existente
                      </button>
                    </>
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
                {canEditCommissionTables ? (
                  <>
                    <label>
                      Banco
                      <div className="bank-select">
                        <input
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          placeholder="Buscar banco..."
                        />
                        <select value={tableBank} onChange={(e) => setTableBank(e.target.value)} required>
                          <option value="">Selecione um banco</option>
                          {filteredBankOptions.map((bankName) => (
                            <option key={bankName} value={bankName}>
                              {bankName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </label>
                    <label>
                      Tabela
                      <input value={tableName} onChange={(e) => setTableName(e.target.value)} required />
                    </label>
                    <label>
                      Prazo
                      <input value={tableDeadline} onChange={(e) => setTableDeadline(e.target.value)} required />
                    </label>
                    <label>
                      Observação
                      <input
                        value={tableObservation}
                        onChange={(e) => setTableObservation(e.target.value)}
                        placeholder="Opcional"
                      />
                    </label>
                  </>
                ) : null}
              </div>
              {canEditCommissionTables ? (
                <label>
                  Comissão %
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={tableCommission}
                    onChange={(e) => setTableCommission(e.target.value)}
                    required
                  />
                </label>
              ) : null}
              <button type="submit">
                {canEditCommissionTables
                  ? isTypingNewProduct
                    ? "Criar produto e tabela"
                    : "Adicionar tabela ao produto"
                  : "Adicionar produto"}
              </button>
            </form>
            <article className="card table-wrap">
              <h3>Produtos e tabelas</h3>
              <ul className="simple-list">
                {products.map((product) => (
                  <li key={product.id}>{product.name}</li>
                ))}
              </ul>
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Banco</th>
                    <th>Tabela</th>
                    <th>Prazo</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((table) => (
                    <tr key={table.id}>
                      <td>{products.find((p) => p.id === table.productId)?.name ?? "—"}</td>
                      <td>{table.bank}</td>
                      <td>{table.name}</td>
                      <td>{table.deadline}</td>
                      <td className="cell-muted">{table.observation || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </div>
        ) : null}

        {activeModule === "contents" ? (
          <div className="module-grid">
            {canEditContents ? (
            <form className="card form-grid" onSubmit={handleUploadContent}>
              <h3>Novo conteúdo</h3>
              <label>
                Título
                <input value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} required />
              </label>
              <label>
                Tipo
                <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
                  <option>IMAGE</option>
                  <option>PDF</option>
                  <option>COMMISSION_TABLE</option>
                  <option>OTHER</option>
                </select>
              </label>
              <label>
                Arquivo
                <input type="file" onChange={(e) => setContentFile(e.target.files?.[0] ?? null)} required />
              </label>
              <button type="submit">Enviar conteúdo</button>
            </form>
            ) : null}
            <article className="card table-wrap">
              <h3>Conteúdos enviados</h3>
              <table>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Arquivo</th>
                  </tr>
                </thead>
                <tbody>
                  {contents.map((content) => (
                    <tr key={content.id}>
                      <td>{content.title}</td>
                      <td>{content.type}</td>
                      <td>{content.filePath}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </div>
        ) : null}
        </main>
      </div>
    </div>
  );
}

export default App;
