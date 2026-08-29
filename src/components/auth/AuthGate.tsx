"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button, Field, TextInput } from "@/components/ui/controls";
import { IconWarning } from "@/components/ui/icons";
import { signIn, useSession, useSharedEditAccess } from "@/lib/auth";
import { COMPANY } from "@/lib/presets";

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn(email, password)) setError(true);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_70px_rgba(29,29,27,0.12)] md:grid-cols-[1fr_1.05fr]">
        <aside className="hidden min-h-[31rem] flex-col justify-between bg-ink p-10 text-white md:flex">
          <Image
            src={COMPANY.logoLight}
            alt="Fairplatz"
            width={639}
            height={182}
            className="h-8 w-auto"
            priority
          />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-brand uppercase">
              Fairplatz workspace
            </p>
            <p className="mt-3 text-3xl leading-tight font-semibold tracking-tight">
              From scope to polished PDF in minutes.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              Categories that add up on their own, an A4 page that redraws as you type, and a PDF in
              one click.
            </p>
          </div>
          <p className="text-xs tracking-wide text-white/40 uppercase">
            {COMPANY.tagline.replace(/\s*\|\s*/g, " · ")}
          </p>
        </aside>

        <form onSubmit={submit} className="flex flex-col justify-center p-6 sm:p-10">
          <Image
            src={COMPANY.logo}
            alt="Fairplatz"
            width={639}
            height={182}
            priority
            className="h-8 w-auto md:hidden"
          />
          <p className="mt-5 text-[11px] font-semibold tracking-[0.12em] text-brand uppercase md:mt-0">
            Internal quotation maker
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 mb-6 text-sm leading-relaxed text-ink-soft">
            Sign in to continue building Fairplatz quotations.
          </p>

          <div className="space-y-3">
            <Field label="Email">
              <TextInput
                type="email"
                autoComplete="username"
                autoFocus
                placeholder="admin@fairplatz.com"
                value={email}
                invalid={error}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(false);
                }}
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <TextInput
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  value={password}
                  invalid={error}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  className="pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md px-1.5 py-1 text-xs font-medium text-ink-soft transition hover:bg-black/5 hover:text-ink"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </Field>
          </div>

          {error ? (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-brand">
              <IconWarning className="h-4 w-4 flex-none" />
              That email and password don&apos;t match.
            </p>
          ) : null}

          <Button type="submit" variant="primary" className="mt-6 w-full py-2.5">
            Sign in
          </Button>

          <p className="mt-4 text-xs text-ink-soft">
            You stay signed in on this computer until you sign out. Quotations are saved here too —
            they don&apos;t follow you to another machine.
          </p>
        </form>
      </div>
    </div>
  );
}

/** Nothing renders until we know whether there is a session, to avoid a flash of the login form. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();
  const isPublicShare = pathname === "/shared" || pathname.startsWith("/shared/");
  const sharedQuoteId = pathname.match(/^\/quote\/([^/]+)$/)?.[1] ?? null;
  const hasSharedEditAccess = useSharedEditAccess(sharedQuoteId);

  if (isPublicShare || hasSharedEditAccess) return <>{children}</>;

  if (status === "loading") {
    return <div className="min-h-[100dvh] bg-paper" />;
  }

  if (status === "signed-out") {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
