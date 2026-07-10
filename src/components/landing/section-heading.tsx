import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  children,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  align?: "center" | "left";
}) {
  const alignment = align === "center" ? "mx-auto text-center" : "text-left";
  return (
    <div className={`max-w-2xl ${alignment}`}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.17em] text-[var(--g-brand)]">{eyebrow}</p>
      ) : null}
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--g-ink)] sm:text-4xl">{title}</h2>
      {children ? <div className="mt-4 text-base leading-7 text-[var(--g-sub)]">{children}</div> : null}
    </div>
  );
}
