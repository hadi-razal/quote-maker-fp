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
  "w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm text-ink outline-none transition " +
  "placeholder:text-ink-soft/50 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-paper";

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
        <span className="mb-1 flex items-center gap-1 text-xs font-semibold tracking-wide text-ink-soft uppercase">
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
  primary: "bg-brand text-white hover:bg-brand-dark shadow-sm",
  secondary: "bg-white text-ink border border-line hover:border-ink/30 hover:bg-paper",
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
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
        "transition disabled:cursor-not-allowed disabled:opacity-45",
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
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-soft transition",
        "hover:bg-black/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30",
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
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-md border border-line bg-white p-3 text-left transition hover:border-ink/20"
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
    <section className="rounded-md border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {description ? <p className="mt-0.5 text-xs text-ink-soft">{description}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
