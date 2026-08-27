"use client";

import Image from "next/image";
import { useState } from "react";
import { Button, Field, TextInput } from "@/components/ui/controls";
import { IconWarning } from "@/components/ui/icons";
import { signIn, useSession } from "@/lib/auth";
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
      <div className="grid w-full max-w-3xl overflow-hidden rounded-md border border-line bg-white md:grid-cols-[1fr_1.1fr]">
        <aside className="hidden flex-col justify-between bg-ink p-8 text-white md:flex">
          <Image
            src={COMPANY.logoLight}
            alt="Fairplatz"
            width={639}
            height={182}
            className="h-8 w-auto"
            priority
          />
          <div>
            <p className="text-xl leading-snug font-semibold">
              Quotations that build
              <br />
              themselves.
            </p>
            <p className="mt-3 text-sm text-white/60">
              Categories that add up on their own, an A4 page that redraws as you type, and a PDF in
              one click.
            </p>
          </div>
          <p className="text-xs tracking-wide text-white/40 uppercase">
            {COMPANY.tagline.replace(/\s*\|\s*/g, " · ")}
          </p>
        </aside>

        <form onSubmit={submit} className="p-6 sm:p-8">
          <Image
            src={COMPANY.logo}
            alt="Fairplatz"
            width={639}
            height={182}
            priority
            className="h-8 w-auto md:hidden"
          />
          <h1 className="mt-5 text-lg font-semibold tracking-tight md:mt-0">Sign in</h1>
          <p className="mt-1 mb-5 text-sm text-ink-soft">
            The Quotation Maker is for the Fairplatz team.
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

          <Button type="submit" variant="primary" className="mt-5 w-full py-2">
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
  const { status } = useSession();

  if (status === "loading") {
    return <div className="min-h-[100dvh] bg-paper" />;
  }

  if (status === "signed-out") {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
