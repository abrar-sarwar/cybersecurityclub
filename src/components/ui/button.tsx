import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-normal text-center rounded-md font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out select-none disabled:opacity-60 disabled:pointer-events-none active:translate-y-px";

/* Colors and edges come from the homepage buttons (.btn-cyber in signal.css). */
const variants: Record<Variant, string> = {
  primary: "btn-cyber btn-cyber-primary",
  secondary: "btn-cyber btn-cyber-secondary",
  outline: "btn-cyber btn-cyber-outline",
  ghost: "btn-cyber btn-cyber-ghost",
  danger: "bg-red-800 text-white hover:bg-red-900",
  link: "text-accent underline-offset-4 hover:underline px-0 h-auto",
};

const sizes: Record<Size, string> = {
  sm: "min-h-11 py-2 px-3 text-sm",
  md: "min-h-11 py-2 px-4 text-[0.95rem]",
  lg: "min-h-12 py-3 px-6 text-base",
};

export function buttonClasses(opts: { variant?: Variant; size?: Size; className?: string } = {}) {
  const { variant = "primary", size = "md", className } = opts;
  return cn(base, variants[variant], variant === "link" ? "" : sizes[size], className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
};

export function Button({ variant, size, loading, loadingText, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
  external,
  ...rest
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  external?: boolean;
  "aria-label"?: string;
  title?: string;
}) {
  const cls = buttonClasses({ variant, size, className });
  if (external || /^https?:|^mailto:/.test(href)) {
    return (
      <a href={href} className={cls} target={/^https?:/.test(href) ? "_blank" : undefined} rel={/^https?:/.test(href) ? "noopener noreferrer" : undefined} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}
