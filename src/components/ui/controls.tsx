"use client";

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  Ref,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useEffect, useRef } from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const inputBase =
  "min-h-10 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition " +
  "placeholder:text-ink-soft/50 hover:border-ink/20 focus:border-brand focus:ring-3 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-paper disabled:text-ink-soft";

export function Field({
  label,
  hint,
  required,
  error,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  required?: boolean;
  error?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      {label ? (
        <span className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold tracking-[0.08em] text-ink-soft uppercase">
          {label}
          {required ? <span className={error ? "text-brand" : "text-ink-soft/60"}>*</span> : null}
        </span>
      ) : null}
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink-soft/80">{hint}</span> : null}
    </label>
  );
}

export function TextInput({
  invalid,
  className,
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}) {
  return (
    <input
      ref={ref}
      {...props}
      className={cx(inputBase, invalid && "border-brand/70 bg-brand-light/40", className)}
    />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...props}
      className={cx(inputBase, "appearance-none pr-7", invalid && "border-brand/70", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4.5 6 8.5 10 4.5' fill='none' stroke='%2352514e' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
        backgroundSize: "12px",
        ...props.style,
      }}
    >
      {children}
    </select>
  );
}

export function Textarea({
  autoGrow,
  className,
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { autoGrow?: boolean; invalid?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!autoGrow || !ref.current) return;
    const el = ref.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [autoGrow, props.value]);

  return (
    <textarea
      ref={ref}
      {...props}
      onInput={(e) => {
        if (autoGrow) {
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = `${el.scrollHeight}px`;
        }
        props.onInput?.(e);
      }}
      className={cx(
        inputBase,
        "resize-y leading-snug",
        autoGrow && "resize-none overflow-hidden",
        invalid && "border-brand/70 bg-brand-light/40",
        className,
      )}
    />
  );
}

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-[0_2px_8px_rgba(234,78,27,0.22)]",
  secondary: "bg-white text-ink border border-line hover:border-ink/30 hover:bg-paper shadow-sm",
  ghost: "text-ink-soft hover:bg-black/5 hover:text-ink",
  danger: "text-brand hover:bg-brand-light",
};

export function Button({
  variant = "secondary",
  className,
  ref,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      ref={ref}
      {...props}
      className={cx(
        "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold",
        "transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        className,
      )}
    />
  );
}

export function IconButton({
  label,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      {...props}
      className={cx(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition",
        "hover:bg-black/5 hover:text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-30",
        className,
      )}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-lg border border-line bg-white p-3.5 text-left shadow-sm transition hover:border-ink/25"
    >
      <span
        className={cx(
          "mt-0.5 flex h-5 w-9 flex-none items-center rounded-sm p-0.5 transition",
          checked ? "bg-brand" : "bg-line",
        )}
      >
        <span
          className={cx(
            "h-4 w-4 rounded-sm bg-white shadow transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-ink-soft">{description}</span>
        ) : null}
      </span>
    </button>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-white p-4 shadow-[0_4px_18px_rgba(29,29,27,0.035)] sm:p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-ink">{title}</h3>
          {description ? <p className="mt-1 text-xs leading-relaxed text-ink-soft">{description}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
