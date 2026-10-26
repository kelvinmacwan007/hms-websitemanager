"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  PanelsTopLeft,
  LockKeyhole,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export function ManagerLogin({ hmsMode = false }: { hmsMode?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [help, setHelp] = useState(false);
  const [properties, setProperties] = useState<Array<{ tenantId: string; name: string }>>([]);
  return (
    <main className="manager-login">
      <div className="ml-orbit ml-orbit-top" aria-hidden="true" />
      <div className="ml-orbit ml-orbit-bottom" aria-hidden="true" />
      <div className="ml-layout">
        <section className="ml-intro" aria-labelledby="ml-intro-title">
          <div className="ml-brand">
            <Image src="/branding/patel-hms-logo.svg" alt="Patel HMS" width={240} height={76} />
          </div>
          <h1 id="ml-intro-title">
            Your hotel website.
            <br />
            Beautifully managed.
          </h1>
          <p className="ml-lead">One place to manage your content, rooms and reservations.</p>
          <ul className="ml-features">
            {[
              { Icon: PanelsTopLeft, title: "Easy website updates" },
              { Icon: Settings, title: "Connected with PatelHMS" },
              { Icon: ShieldCheck, title: "Secure account access" },
            ].map(({ Icon, title }) => (
              <li key={title}>
                <Icon size={34} strokeWidth={1.7} aria-hidden="true" />
                <span>{title}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="ml-card" aria-labelledby="ml-login-title">
          <header className="ml-card-heading">
            <h2 id="ml-login-title">Welcome back</h2>
            <p>Sign in to manage your hotel website.</p>
          </header>
          <form
            aria-busy={busy}
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              setBusy(true);
              setError("");
              const data = new FormData(e.currentTarget);
              try {
                const r = await fetch("/api/manager/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  signal: AbortSignal.timeout(30000),
                  body: JSON.stringify({
                    username: data.get("username"),
                    password: data.get("password"),
                    customerCode: data.get("customerCode"),
                    tenantId: data.get("tenantId") || undefined,
                  }),
                });
                const result = await r.json();
                if (!r.ok) throw new Error(result.error || "Sign-in failed. Please try again.");
                if (result.chooseProperty) {
                  setProperties(result.properties);
                  setBusy(false);
                  return;
                }
                router.replace("/website-manager");
                router.refresh();
              } catch (e) {
                setError(
                  e instanceof Error && ["TimeoutError", "AbortError"].includes(e.name)
                    ? "Sign-in took too long. Please check your connection and try again."
                    : e instanceof Error
                      ? e.message
                      : "Please try again.",
                );
                setBusy(false);
              }
            }}
          >
            <label htmlFor="ml-username">
              Username
              <span className="ml-input">
                <UserRound size={22} aria-hidden="true" />
                <input
                  id="ml-username"
                  name="username"
                  placeholder="Enter username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  maxLength={100}
                />
              </span>
            </label>
            {properties.length > 0 && (
              <div className="ml-property-choice">
                <p className="ml-property-hint" role="status">
                  Your account has multiple hotels. Choose one to continue.
                </p>
                <label htmlFor="ml-property">
                  Hotel property
                  <select id="ml-property" name="tenantId" required defaultValue="">
                    <option value="" disabled>
                      Choose your hotel
                    </option>
                    {properties.map((p) => (
                      <option key={p.tenantId} value={p.tenantId}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <div className="ml-password-field">
              <div className="ml-password-label">
                <label htmlFor="ml-password">Password</label>
                <button
                  className="ml-text-button"
                  type="button"
                  onClick={() => setHelp(!help)}
                  aria-expanded={help}
                  aria-controls="ml-help"
                >
                  Forgot password?
                </button>
              </div>
              <span className="ml-input">
                <LockKeyhole size={22} aria-hidden="true" />
                <input
                  id="ml-password"
                  name="password"
                  placeholder="Enter password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  maxLength={256}
                  aria-describedby={capsLock ? "ml-caps-lock" : undefined}
                  onKeyDown={(event) => setCapsLock(event.getModifierState("CapsLock"))}
                  onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
                  onBlur={() => setCapsLock(false)}
                />
                <button
                  className="ml-eye"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={23} /> : <Eye size={23} />}
                </button>
              </span>
              {capsLock && (
                <p id="ml-caps-lock" className="ml-caps-lock" role="status">
                  Caps Lock is on.
                </p>
              )}
            </div>
            {hmsMode && (
              <label htmlFor="ml-customer">
                Customer code
                <span className="ml-input">
                  <Building2 size={22} aria-hidden="true" />
                  <input
                    id="ml-customer"
                    name="customerCode"
                    placeholder="Enter customer code"
                    autoComplete="organization"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-describedby="ml-customer-hint"
                    required
                    maxLength={100}
                  />
                </span>
                <small id="ml-customer-hint">Provided by your hotel</small>
              </label>
            )}
            {error && (
              <p className="ml-error" role="alert">
                {error}
              </p>
            )}
            <button className="ml-submit" disabled={busy} type="submit">
              {busy ? "Signing in..." : "Sign in"}
              <ArrowRight size={24} aria-hidden="true" />
            </button>
          </form>
          <footer className="ml-card-footer">
            <div className="ml-secure">
              <ShieldCheck size={21} />
              <span>Secure sign-in with PatelHMS</span>
            </div>
            <p>
              Need help?{" "}
              <button
                type="button"
                className="ml-text-button"
                onClick={() => setHelp(!help)}
                aria-expanded={help}
                aria-controls="ml-help"
              >
                Contact support <ArrowRight size={18} />
              </button>
            </p>
            {help && (
              <p id="ml-help" className="ml-help" role="status">
                Contact your hotel administrator or your PatelHMS support representative for help
                with your customer code, account access or password reset.
              </p>
            )}
          </footer>
        </section>
      </div>
    </main>
  );
}
