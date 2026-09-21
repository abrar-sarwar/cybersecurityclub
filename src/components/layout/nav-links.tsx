"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavLinks({ items, className }: { items: { href: string; label: string }[]; className?: string }) {
  const pathname = usePathname();
  return (
    <ul className={cn("signal-nav-list", className)}>
      {items.map((item) => {
        const base = item.href.split("#")[0];
        const active = !item.href.includes("#") && (pathname === base || pathname.startsWith(base + "/"));
        return (
          <li key={item.href}>
            <Link href={item.href} aria-current={active ? "page" : undefined} className="signal-nav-link">
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
