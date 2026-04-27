"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/articles", label: "Article Explorer" },
  { href: "/results", label: "Results Atlas" },
  { href: "/journals", label: "Journals" },
  { href: "/methodology", label: "Methodology" }
];

export function TopNavigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-journal-navy/90 text-white shadow-[0_12px_44px_rgba(8,31,61,0.2)] backdrop-blur-2xl">
      <nav className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="text-lg font-semibold">
          CLEAR-CARD Atlas
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border border-transparent px-3 py-2 transition duration-300 ${
                  active
                    ? "border-white/25 bg-white/[0.12] text-white"
                    : "text-blue-100 hover:border-white/15 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <span className="ml-1 border border-white/20 px-2.5 py-1 text-xs font-semibold uppercase text-blue-100">
            research workspace
          </span>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
