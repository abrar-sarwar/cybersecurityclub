import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const control =
  "block w-full rounded-[10px] border border-line-strong bg-surface px-3.5 text-[0.95rem] text-navy-900 placeholder:text-faint shadow-[inset_0_1px_1px_rgb(16_33_58/0.04)] transition-[border-color,box-shadow] duration-150 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:bg-pale disabled:text-muted aria-[invalid=true]:border-danger-600 aria-[invalid=true]:focus:ring-danger-50";

export function Field({
  label,
  name,
  hint,
  error,
  optional,
  children,
  className,
}: {
  label: string;
  name: string;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={name} className="flex items-baseline justify-between gap-3 text-sm font-semibold text-navy-900">
        <span>{label}</span>
        {optional ? <span className="text-xs font-medium text-muted">Optional</span> : null}
      </label>
      {children}
      {hint ? (
        <p id={`${name}-hint`} className="text-[0.8125rem] leading-5 text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${name}-error`} className="text-[0.8125rem] font-medium leading-5 text-danger-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type Described = { name: string; error?: string | null; hint?: ReactNode };

function describedBy({ name, error, hint }: Described) {
  const ids = [hint ? `${name}-hint` : null, error ? `${name}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export function Input({ name, error, hint, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & Described) {
  return (
    <input
      id={name}
      name={name}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy({ name, error, hint })}
      className={cn(control, "h-11", className)}
      {...rest}
    />
  );
}

export function Textarea({ name, error, hint, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & Described) {
  return (
    <textarea
      id={name}
      name={name}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy({ name, error, hint })}
      className={cn(control, "min-h-28 py-2.5 leading-6", className)}
      {...rest}
    />
  );
}

export function Select({ name, error, hint, className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & Described) {
  return (
    <select
      id={name}
      name={name}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy({ name, error, hint })}
      className={cn(control, "h-11 pr-9", className)}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  name,
  label,
  description,
  error,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { name: string; label: ReactNode; description?: ReactNode; error?: string | null }) {
  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={name} className="flex cursor-pointer gap-3 rounded-lg p-1 -m-1">
        <input
          id={name}
          name={name}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          className="mt-0.5 size-5 shrink-0 rounded border-line-strong text-accent accent-brand-600 focus:ring-brand-500"
          {...rest}
        />
        <span className="text-sm">
          <span className="font-medium text-navy-900">{label}</span>
          {description ? <span className="mt-0.5 block text-muted">{description}</span> : null}
        </span>
      </label>
      {error ? (
        <p id={`${name}-error`} className="text-[0.8125rem] font-medium text-danger-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl border border-danger-600/30 bg-danger-50 px-4 py-3 text-sm text-danger-700">
      {message}
    </div>
  );
}

export function FormSuccess({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="status" className="rounded-xl border border-success-600/30 bg-success-50 px-4 py-3 text-sm text-success-600">
      {message}
    </div>
  );
}
