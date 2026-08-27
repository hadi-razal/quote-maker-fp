"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Button, cx } from "@/components/ui/controls";
import { IconWarning } from "@/components/ui/icons";

interface ConfirmOptions {
  title: string;
  message?: string;
  /** Extra lines shown as a list — what exactly is about to go. */
  details?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (answer: boolean) => void;
}

/**
 * The browser's own confirm() looks like a security warning and cannot be
 * styled, so every destructive action in the app goes through this instead.
 * One host lives in the layout; anywhere else just awaits askConfirm().
 */
let pending: PendingConfirm | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function askConfirm(options: ConfirmOptions): Promise<boolean> {
  // A second request while one is open answers the first with "no".
  pending?.resolve(false);
  return new Promise<boolean>((resolve) => {
    pending = { ...options, resolve };
    emit();
  });
}

function settle(answer: boolean) {
  const request = pending;
  pending = null;
  emit();
  request?.resolve(answer);
}

export function ConfirmHost() {
  const request = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => pending,
    () => null,
  );

  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!request) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") settle(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [request]);

  if (!request) return null;

  const danger = request.tone === "danger";

  return (
    <div
      className="no-print fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-3"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) settle(false);
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm overflow-hidden rounded-md bg-white shadow-2xl"
      >
        <div className="flex gap-3 px-5 py-5">
          <span
            className={cx(
              "flex h-9 w-9 flex-none items-center justify-center rounded-sm",
              danger ? "bg-brand-light text-brand" : "bg-paper text-ink-soft",
            )}
          >
            <IconWarning className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">{request.title}</h2>
            {request.message ? (
              <p className="mt-1 text-sm text-ink-soft">{request.message}</p>
            ) : null}
            {request.details?.length ? (
              <ul className="mt-2 space-y-0.5 text-sm text-ink-soft">
                {request.details.map((line) => (
                  <li key={line} className="flex gap-1.5">
                    <span className="text-ink-soft/50">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line bg-paper px-5 py-3">
          <Button onClick={() => settle(false)}>{request.cancelLabel ?? "Cancel"}</Button>
          <Button ref={confirmRef} variant="primary" onClick={() => settle(true)}>
            {request.confirmLabel ?? "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
}
