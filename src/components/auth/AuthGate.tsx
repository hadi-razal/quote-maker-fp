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
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-8"
      >
        <Image
          src={COMPANY.logo}
          alt="Fairplatz"
          width={639}
          height={182}
          priority
          className="h-9 w-auto"
        />
        <h1 className="mt-5 text-lg font-semibold tracking-tight">Quotation Maker</h1>
        <p className="mt-1 mb-5 text-sm text-ink-soft">Sign in to build and download quotations.</p>

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
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded px-1.5 py-1 text-xs font-medium text-ink-soft transition hover:bg-black/5 hover:text-ink"
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
  );
}

/** Nothing renders until we know whether there is a session, to avoid a flash of the login form. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return <div className="min-h-[100dvh]" />;
  }

  if (status === "signed-out") {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
