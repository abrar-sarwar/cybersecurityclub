"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string };

export function MobileNav({
  items,
  primary,
  secondary,
  brandLabel,
}: {
  items: Item[];
  primary: Item;
  secondary: Item;
  brandLabel: string;
}) {
  const pathname = usePathname();
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const setOpen = useCallback((value: boolean) => setOpenedAt(value ? pathname : null), [pathname]);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  // Focus management, Escape, scroll lock, focus trap.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background = Array.from(document.querySelectorAll<HTMLElement>("main, footer"));
    const previousInert = background.map((element) => element.inert);
    background.forEach((element) => { element.inert = true; });
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
    focusables()[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === "Tab") {
        const list = focusables();
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      background.forEach((element, index) => { element.inert = previousInert[index]; });
      (previous ?? trigger)?.focus();
    };
  }, [open, setOpen]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-lg text-navy-900 hover:bg-pale"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            tabIndex={-1}
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            id={id}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${brandLabel} menu`}
            className="absolute inset-y-0 right-0 flex w-[min(22rem,100%)] flex-col bg-surface shadow-pop motion-safe:animate-[slide-in_200ms_var(--ease-out-quart)]"
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <span className="font-display text-base font-bold text-navy-900">Menu</span>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-lg text-navy-900 hover:bg-pale"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="size-6" aria-hidden />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Site">
              <ul className="space-y-1">
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center rounded-lg px-3 text-[1.05rem] font-medium text-navy-900 hover:bg-pale",
                          active && "bg-brand-50 text-brand-700",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="space-y-2 border-t border-line p-4">
              <Link href={primary.href} onClick={() => setOpen(false)} className={buttonClasses({ variant: "primary", size: "lg", className: "w-full" })}>
                {primary.label}
              </Link>
              <Link href={secondary.href} onClick={() => setOpen(false)} className={buttonClasses({ variant: "outline", size: "lg", className: "w-full" })}>
                {secondary.label}
              </Link>
            </div>
          </div>
          <style>{`@keyframes slide-in { from { transform: translateX(24px); opacity: 0 } to { transform: none; opacity: 1 } }`}</style>
        </div>
      ) : null}
    </div>
  );
}
