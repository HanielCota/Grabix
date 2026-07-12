import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cx } from "./utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--g-accent)] text-[var(--g-accent-text)] shadow-[var(--g-shadow-button)] hover:bg-[var(--g-accent-hover)]",
  secondary:
    "border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] text-[var(--g-ink)] hover:border-[var(--g-accent-border)] hover:bg-[var(--g-line)]",
  ghost: "text-[var(--g-sub)] hover:bg-[var(--g-surface-3)] hover:text-[var(--g-ink)]",
  danger: "border border-[var(--g-danger-border)] bg-[var(--g-danger-bg)] text-[var(--g-danger)] hover:bg-red-400/10",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-[var(--g-radius-md)] font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cx("rounded-[var(--g-radius-lg)] border border-[var(--g-line)] bg-[var(--g-surface-1)]", className)}
      {...props}
    />
  );
}

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "success" | "warning" | "danger" | "brand" }) {
  const tones = {
    neutral: "border-[var(--g-line-hover)] bg-[var(--g-surface-3)] text-[var(--g-sub)]",
    success: "border-[var(--g-success-border)] bg-[var(--g-success-bg)] text-[var(--g-success)]",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    danger: "border-[var(--g-danger-border)] bg-[var(--g-danger-bg)] text-[var(--g-danger)]",
    brand: "border-[var(--g-brand)]/25 bg-[var(--g-brand)]/10 text-[var(--g-brand-light)]",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "h-11 w-full rounded-[var(--g-radius-md)] border border-[var(--g-line-hover)] bg-[var(--g-surface-1)] px-3 text-sm text-[var(--g-ink)] placeholder:text-[var(--g-muted)] transition-colors focus:border-[var(--g-accent-border)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={cx("max-w-2xl", align === "center" ? "mx-auto text-center" : "text-left")}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.17em] text-[var(--g-brand)]">{eyebrow}</p>
      ) : null}
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--g-ink)] sm:text-4xl">{title}</h2>
      {description ? <div className="mt-4 text-base leading-7 text-[var(--g-sub)]">{description}</div> : null}
    </div>
  );
}

export function Alert({
  tone = "danger",
  icon,
  children,
  className,
}: {
  tone?: "danger" | "success";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const color =
    tone === "danger"
      ? "border-[var(--g-danger-border)] bg-[var(--g-danger-bg)] text-[var(--g-danger)]"
      : "border-[var(--g-success-border)] bg-[var(--g-success-bg)] text-[var(--g-success)]";
  return (
    <div
      role="alert"
      className={cx("flex items-center gap-2 rounded-[var(--g-radius-md)] border p-4 text-sm", color, className)}
    >
      {icon}
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--g-radius-lg)] border border-dashed border-[var(--g-line-hover)] bg-[var(--g-surface-1)] px-6 py-14 text-center">
      {icon ? (
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--g-surface-2)] text-[var(--g-muted)]">
          {icon}
        </span>
      ) : null}
      <h2 className="mt-4 text-sm font-semibold text-[var(--g-ink)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--g-sub)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
