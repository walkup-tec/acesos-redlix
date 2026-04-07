import { useEffect, useState } from "react";
import type { FormEvent } from "react";

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

export type PublicRouteState =
  | { kind: "login" }
  | { kind: "convite_missing" }
  | { kind: "convite"; token: string }
  | { kind: "ativar" };

export function readPublicRoute(): PublicRouteState {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (path.endsWith("/convite")) {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    if (!token) {
      return { kind: "convite_missing" };
    }
    return { kind: "convite", token };
  }
  if (path.endsWith("/ativar")) {
    return { kind: "ativar" };
  }
  return { kind: "login" };
}

function apiUrl(path: string): string {
  const base = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").replace(/\/$/, "");
  const segment = path.startsWith("/") ? path : `/${path}`;
  return `${base}/api${segment}`;
}

export function ConviteMissingView({ branding }: { branding: Branding | null }) {
  return (
    <main className="auth-layout">
      <section className="auth-card">
        {branding?.logoUrl ? (
          <img className="logo logo--auth" src={branding.logoUrl} alt="" width={220} height={64} />
        ) : null}
        <p className="muted">Link de convite inválido ou incompleto.</p>
        <p className="muted">Peça um novo convite ao administrador ou abra o link completo enviado por e-mail.</p>
        <a className="link-home" href="/">
          Ir para o login
        </a>
      </section>
    </main>
  );
}

export function ConviteFlow({ token }: { token: string }) {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [ctx, setCtx] = useState<{ userId: string; email: string; fullName: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch(apiUrl(`/auth/invite-context?token=${encodeURIComponent(token)}`));
        const body = (await r.json()) as { message?: string; userId?: string; email?: string; fullName?: string };
        if (!r.ok) {
          throw new Error(body.message ?? "Convite inválido.");
        }
        if (!body.userId || !body.email) {
          throw new Error("Resposta inválida do servidor.");
        }
        setCtx({ userId: body.userId, email: body.email, fullName: body.fullName ?? "" });
        setFullName(body.fullName ?? "");
        const b = await fetch(apiUrl("/branding"));
        if (b.ok) {
          setBranding((await b.json()) as Branding);
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Não foi possível carregar o convite.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitError("");
    if (!ctx || !identityFile || !addressFile) {
      setSubmitError("Envie os dois documentos obrigatórios.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("fullName", fullName.trim());
      fd.append("cpf", cpf.replace(/\D/g, ""));
      fd.append("rg", rg.trim());
      fd.append("birthDate", birthDate);
      fd.append("address", address.trim());
      fd.append("password", password);
      fd.append("identityDocument", identityFile);
      fd.append("addressProof", addressFile);
      const r = await fetch(apiUrl(`/users/${ctx.userId}/complete-registration`), {
        method: "POST",
        body: fd,
      });
      const body = (await r.json()) as { message?: string };
      if (!r.ok) {
        throw new Error(body.message ?? "Falha ao enviar cadastro.");
      }
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <p className="muted">Carregando convite…</p>
        </section>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          {branding?.logoUrl ? (
            <img className="logo logo--auth" src={branding.logoUrl} alt="" width={220} height={64} />
          ) : null}
          <p className="error">{loadError}</p>
          <a className="link-home" href="/">
            Ir para o login
          </a>
        </section>
      </main>
    );
  }

  if (done) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          {branding?.logoUrl ? (
            <img className="logo logo--auth" src={branding.logoUrl} alt="" width={220} height={64} />
          ) : null}
          <p className="muted">Cadastro enviado com sucesso. Aguarde a aprovação de um gestor.</p>
          <p className="muted">Você receberá um e-mail quando a conta for aprovada.</p>
          <a className="link-home" href="/">
            Ir para o login
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-layout">
      <section className="auth-card auth-card--wide">
        {branding?.logoUrl ? (
          <img className="logo logo--auth" src={branding.logoUrl} alt="" width={220} height={64} />
        ) : null}
        <h1 className="onboarding-title">Complete seu cadastro</h1>
        <p className="muted">
          E-mail: <strong>{ctx?.email}</strong>
        </p>
        <form className="form-grid form-grid--left" onSubmit={handleSubmit}>
          <label>
            Nome completo
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={3} />
          </label>
          <label>
            CPF (somente números)
            <input value={cpf} onChange={(e) => setCpf(e.target.value)} required minLength={11} inputMode="numeric" />
          </label>
          <label>
            RG
            <input value={rg} onChange={(e) => setRg(e.target.value)} required minLength={5} />
          </label>
          <label>
            Data de nascimento
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
          </label>
          <label>
            Endereço completo
            <input value={address} onChange={(e) => setAddress(e.target.value)} required minLength={8} />
          </label>
          <label>
            Senha (mín. 6 caracteres)
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <label>
            Documento de identificação (arquivo)
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setIdentityFile(e.target.files?.[0] ?? null)}
              required
            />
          </label>
          <label>
            Comprovante de endereço (arquivo)
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setAddressFile(e.target.files?.[0] ?? null)}
              required
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? "Enviando…" : "Enviar cadastro"}
          </button>
        </form>
        {submitError ? <p className="error">{submitError}</p> : null}
      </section>
    </main>
  );
}

export function AtivarFlow() {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [vEmail, setVEmail] = useState("");
  const [vCode, setVCode] = useState("");
  const [vMsg, setVMsg] = useState("");
  const [vLoading, setVLoading] = useState(false);

  const [rEmail, setREmail] = useState("");
  const [rCode, setRCode] = useState("");
  const [rPass, setRPass] = useState("");
  const [rMsg, setRMsg] = useState("");
  const [rLoading, setRLoading] = useState(false);

  const [fEmail, setFEmail] = useState("");
  const [fMsg, setFMsg] = useState("");
  const [fLoading, setFLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const r = await fetch(apiUrl("/branding"));
      if (r.ok) {
        setBranding((await r.json()) as Branding);
      }
    })();
  }, []);

  async function handleVerify(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setVMsg("");
    setVLoading(true);
    try {
      const r = await fetch(apiUrl("/auth/verify-first-access"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: vEmail.trim(), code: vCode.trim() }),
      });
      const body = (await r.json()) as { message?: string };
      if (!r.ok) {
        throw new Error(body.message ?? "Código inválido.");
      }
      setVMsg("Primeiro acesso validado. Você já pode entrar com seu e-mail e senha.");
    } catch (err) {
      setVMsg(err instanceof Error ? err.message : "Erro ao validar.");
    } finally {
      setVLoading(false);
    }
  }

  async function handleReset(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setRMsg("");
    setRLoading(true);
    try {
      const r = await fetch(apiUrl("/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: rEmail.trim(),
          resetCode: rCode.trim(),
          newPassword: rPass,
        }),
      });
      const body = (await r.json()) as { message?: string };
      if (!r.ok) {
        throw new Error(body.message ?? "Não foi possível alterar a senha.");
      }
      setRMsg("Senha alterada. Faça login com a nova senha.");
      setRPass("");
      setRCode("");
    } catch (err) {
      setRMsg(err instanceof Error ? err.message : "Erro.");
    } finally {
      setRLoading(false);
    }
  }

  async function handleForgot(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setFMsg("");
    setFLoading(true);
    try {
      const r = await fetch(apiUrl("/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fEmail.trim() }),
      });
      const body = (await r.json()) as { message?: string };
      if (!r.ok) {
        throw new Error(body.message ?? "Falha na solicitação.");
      }
      setFMsg(body.message ?? "Se o e-mail estiver cadastrado, você receberá um código.");
    } catch (err) {
      setFMsg(err instanceof Error ? err.message : "Erro.");
    } finally {
      setFLoading(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card auth-card--wide">
        {branding?.logoUrl ? (
          <img className="logo logo--auth" src={branding.logoUrl} alt="" width={220} height={64} />
        ) : null}
        <h1 className="onboarding-title">Ativação e senha</h1>

        <div className="onboarding-block">
          <h2 className="onboarding-subtitle">Validar primeiro acesso</h2>
          <p className="muted small">Use o código de 6 dígitos enviado por e-mail após a aprovação da conta.</p>
          <form className="form-grid form-grid--left" onSubmit={handleVerify}>
            <label>
              E-mail
              <input type="email" value={vEmail} onChange={(e) => setVEmail(e.target.value)} required />
            </label>
            <label>
              Código
              <input value={vCode} onChange={(e) => setVCode(e.target.value)} required minLength={6} maxLength={6} />
            </label>
            <button type="submit" disabled={vLoading}>
              {vLoading ? "Validando…" : "Validar"}
            </button>
          </form>
          {vMsg ? <p className={vMsg.startsWith("Primeiro") ? "muted success-note" : "error"}>{vMsg}</p> : null}
        </div>

        <div className="onboarding-block">
          <h2 className="onboarding-subtitle">Esqueci a senha</h2>
          <p className="muted small">Enviaremos um código de 6 dígitos para o e-mail cadastrado.</p>
          <form className="form-grid form-grid--left" onSubmit={handleForgot}>
            <label>
              E-mail
              <input type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} required />
            </label>
            <button type="submit" disabled={fLoading}>
              {fLoading ? "Enviando…" : "Enviar código"}
            </button>
          </form>
          {fMsg ? <p className="muted success-note">{fMsg}</p> : null}
        </div>

        <div className="onboarding-block">
          <h2 className="onboarding-subtitle">Nova senha (código por e-mail)</h2>
          <form className="form-grid form-grid--left" onSubmit={handleReset}>
            <label>
              E-mail
              <input type="email" value={rEmail} onChange={(e) => setREmail(e.target.value)} required />
            </label>
            <label>
              Código recebido
              <input value={rCode} onChange={(e) => setRCode(e.target.value)} required minLength={6} maxLength={6} />
            </label>
            <label>
              Nova senha
              <input
                type="password"
                value={rPass}
                onChange={(e) => setRPass(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            <button type="submit" disabled={rLoading}>
              {rLoading ? "Salvando…" : "Definir nova senha"}
            </button>
          </form>
          {rMsg ? <p className={rMsg.startsWith("Senha") ? "muted success-note" : "error"}>{rMsg}</p> : null}
        </div>

        <a className="link-home" href="/">
          Voltar ao login
        </a>
      </section>
    </main>
  );
}
