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

function maskCepInput(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function maskCpfInput(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function maskBirthDateInput(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function normalizeBirthDateForApi(input: string): string {
  const raw = input.trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 8) {
    if (digits.startsWith("19") || digits.startsWith("20")) {
      return `${digits.slice(6, 8)}/${digits.slice(4, 6)}/${digits.slice(0, 4)}`;
    }
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    return raw;
  }
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, yyyy, mm, dd] = iso;
    return `${dd}/${mm}/${yyyy}`;
  }
  throw new Error("Data de nascimento deve estar no formato DD/MM/AAAA.");
}

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

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

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [password, setPassword] = useState("");

  const [cep, setCep] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [cepLocked, setCepLocked] = useState(false);
  const [street, setStreet] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [hasComplement, setHasComplement] = useState(false);
  const [addressComplement, setAddressComplement] = useState("");

  const [identityFrontFile, setIdentityFrontFile] = useState<File | null>(null);
  const [identityBackFile, setIdentityBackFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);

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

  async function fetchCep(): Promise<void> {
    setCepError("");
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setCepError("Informe o CEP com 8 dígitos.");
      setCepLocked(false);
      return;
    }
    setCepLoading(true);
    try {
      const r = await fetch(apiUrl(`/cep/${digits}`));
      const data = (await r.json()) as ViaCepResponse & { message?: string };
      if (!r.ok) {
        throw new Error(data.message ?? "Não foi possível consultar o CEP.");
      }
      if (data.erro) {
        throw new Error("CEP não encontrado.");
      }
      setStreet(data.logradouro ?? "");
      setNeighborhood(data.bairro ?? "");
      setCity(data.localidade ?? "");
      setStateUf((data.uf ?? "").toUpperCase().slice(0, 2));
      setCepLocked(true);
    } catch (e) {
      setCepLocked(false);
      setCepError(e instanceof Error ? e.message : "Erro ao buscar CEP.");
    } finally {
      setCepLoading(false);
    }
  }

  function validateStep1(): string | null {
    if (fullName.trim().length < 3) return "Informe o nome completo.";
    if (cpf.replace(/\D/g, "").length !== 11) return "CPF inválido.";
    if (rg.trim().length < 5) return "RG inválido.";
    try {
      normalizeBirthDateForApi(birthDate);
    } catch (e) {
      return e instanceof Error ? e.message : "Data de nascimento inválida.";
    }
    if (fatherName.trim().length < 3) return "Informe o nome do pai.";
    if (motherName.trim().length < 3) return "Informe o nome da mãe.";
    if (password.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
    return null;
  }

  function validateStep2(): string | null {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return "CEP inválido.";
    if (!cepLocked) return "Busque o CEP para preencher o endereço.";
    if (street.trim().length < 3) return "Logradouro é obrigatório.";
    if (neighborhood.trim().length < 2) return "Bairro é obrigatório.";
    if (city.trim().length < 2) return "Cidade é obrigatória.";
    if (!/^[A-Za-z]{2}$/.test(stateUf.trim())) return "UF inválida.";
    if (addressNumber.trim().length < 1) return "Informe o número do local.";
    if (hasComplement && addressComplement.trim().length < 1) return "Informe o complemento ou desmarque a opção.";
    return null;
  }

  function validateStep3(): string | null {
    if (!identityFrontFile) return "Envie a imagem do documento (frente).";
    if (!identityBackFile) return "Envie a imagem do documento (verso).";
    if (!addressProofFile) return "Envie o comprovante de residência.";
    return null;
  }

  function goNext(): void {
    setSubmitError("");
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setSubmitError(err);
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) {
        setSubmitError(err);
        return;
      }
      setStep(3);
    }
  }

  function goBack(): void {
    setSubmitError("");
    if (step > 1) {
      setStep((s) => s - 1);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitError("");
    const err3 = validateStep3();
    if (err3) {
      setSubmitError(err3);
      return;
    }
    if (!ctx) return;
    let birthForApi = "";
    try {
      birthForApi = normalizeBirthDateForApi(birthDate);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Data inválida.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("fullName", fullName.trim());
      fd.append("cpf", cpf.replace(/\D/g, ""));
      fd.append("rg", rg.trim());
      fd.append("birthDate", birthForApi);
      fd.append("fatherName", fatherName.trim());
      fd.append("motherName", motherName.trim());
      fd.append("zipCode", cep.replace(/\D/g, ""));
      fd.append("street", street.trim());
      fd.append("neighborhood", neighborhood.trim());
      fd.append("city", city.trim());
      fd.append("state", stateUf.trim().toUpperCase());
      fd.append("addressNumber", addressNumber.trim());
      fd.append("addressComplement", hasComplement ? addressComplement.trim() : "");
      fd.append("password", password);
      fd.append("identityDocument", identityFrontFile!);
      fd.append("identityDocumentBack", identityBackFile!);
      fd.append("addressProof", addressProofFile!);
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
          <p className="muted success-note" style={{ fontSize: "1.05rem" }}>
            Cadastro finalizado com sucesso! Aguarde o retorno do seu gerente informando a aprovação do seu cadastro.
          </p>
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
        <h1 className="onboarding-title">Validar cadastro</h1>
        <p className="muted">
          E-mail: <strong>{ctx?.email}</strong>
        </p>
        <p className="muted small" style={{ marginBottom: "1rem" }}>
          Etapa {step} de 3
        </p>

        <form className="form-grid form-grid--left" onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
          {step === 1 ? (
            <>
              <h2 className="onboarding-subtitle">Dados pessoais</h2>
              <label>
                Nome completo (conforme documento de identidade)
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={3} />
              </label>
              <label>
                Data de nascimento
                <input
                  value={birthDate}
                  onChange={(e) => setBirthDate(maskBirthDateInput(e.target.value))}
                  placeholder="DD/MM/AAAA"
                  inputMode="numeric"
                  required
                />
              </label>
              <label>
                CPF
                <input
                  value={cpf}
                  onChange={(e) => setCpf(maskCpfInput(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  required
                />
              </label>
              <label>
                RG
                <input value={rg} onChange={(e) => setRg(e.target.value)} required minLength={5} />
              </label>
              <label>
                Nome do pai
                <input value={fatherName} onChange={(e) => setFatherName(e.target.value)} required minLength={3} />
              </label>
              <label>
                Nome da mãe
                <input value={motherName} onChange={(e) => setMotherName(e.target.value)} required minLength={3} />
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
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h2 className="onboarding-subtitle">Localização</h2>
              <label>
                CEP
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    style={{ flex: "1 1 140px" }}
                    value={cep}
                    onChange={(e) => {
                      setCep(maskCepInput(e.target.value));
                      setCepLocked(false);
                      setCepError("");
                    }}
                    onBlur={() => {
                      if (cep.replace(/\D/g, "").length === 8) {
                        void fetchCep();
                      }
                    }}
                    placeholder="00000-000"
                    inputMode="numeric"
                    required
                  />
                  <button type="button" className="btn-secondary" onClick={() => void fetchCep()} disabled={cepLoading}>
                    {cepLoading ? "Buscando…" : "Buscar CEP"}
                  </button>
                </div>
              </label>
              {cepError ? <p className="error">{cepError}</p> : null}
              <label>
                Logradouro
                <input value={street} onChange={(e) => setStreet(e.target.value)} required minLength={3} />
              </label>
              <label>
                Bairro
                <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} required minLength={2} />
              </label>
              <label>
                Cidade
                <input value={city} onChange={(e) => setCity(e.target.value)} required minLength={2} />
              </label>
              <label>
                UF
                <input
                  value={stateUf}
                  onChange={(e) => setStateUf(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))}
                  required
                  maxLength={2}
                  placeholder="SP"
                />
              </label>
              <label>
                Número do local
                <input value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} required />
              </label>
              <label className="checkbox-row" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={hasComplement}
                  onChange={(e) => {
                    setHasComplement(e.target.checked);
                    if (!e.target.checked) {
                      setAddressComplement("");
                    }
                  }}
                />
                <span>Existe complemento (apto, bloco, etc.)?</span>
              </label>
              {hasComplement ? (
                <label>
                  Complemento
                  <input value={addressComplement} onChange={(e) => setAddressComplement(e.target.value)} required />
                </label>
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h2 className="onboarding-subtitle">Documentos</h2>
              <label>
                Documento de identificação — frente
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setIdentityFrontFile(e.target.files?.[0] ?? null)}
                  required
                />
              </label>
              <label>
                Documento de identificação — verso
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setIdentityBackFile(e.target.files?.[0] ?? null)}
                  required
                />
              </label>
              <label>
                Comprovante de residência
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setAddressProofFile(e.target.files?.[0] ?? null)}
                  required
                />
              </label>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                <button type="button" className="btn-secondary" onClick={goBack}>
                  Voltar
                </button>
                <button type="submit" className="btn-confirm" disabled={submitting}>
                  {submitting ? "Enviando…" : "Finalizar cadastro"}
                </button>
              </div>
            </>
          ) : null}

          {step < 3 ? (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              {step > 1 ? (
                <button type="button" className="btn-secondary" onClick={goBack}>
                  Voltar
                </button>
              ) : null}
              <button type="button" className="btn-confirm" onClick={goNext}>
                Continuar
              </button>
            </div>
          ) : null}
        </form>
        {submitError ? <p className="error">{submitError}</p> : null}
      </section>
    </main>
  );
}

export function AtivarFlow() {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryMsg, setRecoveryMsg] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const r = await fetch(apiUrl("/branding"));
      if (r.ok) {
        setBranding((await r.json()) as Branding);
      }
    })();
  }, []);

  async function handleRequestResetCode(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setRecoveryMsg("");
    setRecoveryError("");
    setRecoveryLoading(true);
    try {
      const r = await fetch(apiUrl("/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail.trim() }),
      });
      const body = (await r.json()) as { message?: string };
      if (!r.ok) {
        throw new Error(body.message ?? "Falha ao solicitar código.");
      }
      setRecoveryMsg(body.message ?? "Código enviado para o e-mail informado.");
      setRecoveryStep(2);
    } catch (err) {
      setRecoveryError(err instanceof Error ? err.message : "Erro ao solicitar código.");
    } finally {
      setRecoveryLoading(false);
    }
  }

  async function handleValidateCode(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setRecoveryMsg("");
    setRecoveryError("");
    if (recoveryCode.trim().length !== 6) {
      setRecoveryError("Informe o código de 6 dígitos.");
      return;
    }
    setRecoveryLoading(true);
    try {
      const r = await fetch(apiUrl("/auth/validate-reset-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recoveryEmail.trim(),
          resetCode: recoveryCode.trim(),
        }),
      });
      const body = (await r.json()) as { message?: string };
      if (!r.ok) {
        throw new Error(body.message ?? "Código inválido.");
      }
      setRecoveryMsg("Código validado com sucesso.");
      setRecoveryStep(3);
    } catch (err) {
      setRecoveryError(err instanceof Error ? err.message : "Erro ao validar código.");
    } finally {
      setRecoveryLoading(false);
    }
  }

  async function handleSaveNewPassword(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setRecoveryMsg("");
    setRecoveryError("");
    if (newPassword.length < 6) {
      setRecoveryError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setRecoveryError("A confirmação de senha não confere.");
      return;
    }
    setRecoveryLoading(true);
    try {
      const r = await fetch(apiUrl("/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recoveryEmail.trim(),
          resetCode: recoveryCode.trim(),
          newPassword,
        }),
      });
      const body = (await r.json()) as { message?: string };
      if (!r.ok) {
        throw new Error(body.message ?? "Não foi possível alterar a senha.");
      }
      setRecoveryMsg("Senha gravada com sucesso. Redirecionando para o login…");
      window.setTimeout(() => {
        window.location.assign("/");
      }, 900);
    } catch (err) {
      setRecoveryError(err instanceof Error ? err.message : "Erro ao gravar senha.");
    } finally {
      setRecoveryLoading(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card auth-card--wide">
        {branding?.logoUrl ? (
          <img className="logo logo--auth" src={branding.logoUrl} alt="" width={220} height={64} />
        ) : null}
        <h1 className="onboarding-title">Recuperação de senha</h1>
        <div className="onboarding-block">
          {recoveryStep === 1 ? (
            <form className="form-grid form-grid--left" onSubmit={handleRequestResetCode}>
              <label>
                E-mail
                <input type="email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} required />
              </label>
              <button type="submit" disabled={recoveryLoading}>
                {recoveryLoading ? "Solicitando…" : "Solicitar código"}
              </button>
            </form>
          ) : null}

          {recoveryStep === 2 ? (
            <form className="form-grid form-grid--left" onSubmit={handleValidateCode}>
              <label>
                Informe o código
                <input
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  minLength={6}
                  maxLength={6}
                  inputMode="numeric"
                />
              </label>
              <button type="submit" disabled={recoveryLoading}>
                {recoveryLoading ? "Validando…" : "Validar"}
              </button>
            </form>
          ) : null}

          {recoveryStep === 3 ? (
            <form className="form-grid form-grid--left" onSubmit={handleSaveNewPassword}>
              <label>
                Informe a nova senha
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </label>
              <label>
                Confirmar nova senha
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </label>
              <button type="submit" disabled={recoveryLoading}>
                {recoveryLoading ? "Gravando…" : "Gravar senha"}
              </button>
            </form>
          ) : null}

          {recoveryMsg ? <p className="muted success-note">{recoveryMsg}</p> : null}
          {recoveryError ? <p className="error">{recoveryError}</p> : null}
        </div>

        <a className="link-home" href="/">
          Voltar ao login
        </a>
      </section>
    </main>
  );
}
