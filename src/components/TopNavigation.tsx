"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/articles", label: "Article Explorer", icon: ArticleIcon },
  { href: "/results", label: "Reports", icon: ResultsIcon },
  { href: "/about", label: "About", icon: AboutIcon }
];

export function TopNavigation() {
  const pathname = usePathname();

  return (
    <nav className="group fixed right-3 top-3 z-50 flex max-w-[calc(100vw-1.5rem)] items-center gap-1 overflow-hidden rounded-full border border-journal-line/70 bg-[color:var(--card-bg)] p-1 shadow-[0_18px_60px_rgba(60,64,67,0.18)] backdrop-blur-2xl transition-all duration-500 ease-out hover:gap-2 hover:p-1.5 focus-within:gap-2 focus-within:p-1.5 sm:right-6 sm:top-6">
      <button
        type="button"
        aria-label="Open navigation"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-journal-ink text-white shadow-[0_10px_30px_rgba(60,64,67,0.22)] outline-none transition duration-500 group-hover:rotate-90 group-focus-within:rotate-90"
      >
        <span className="grid gap-1">
          <span className="block h-0.5 w-4 rounded-full bg-white" />
          <span className="block h-0.5 w-4 rounded-full bg-white" />
          <span className="block h-0.5 w-4 rounded-full bg-white" />
        </span>
      </button>
      <div className="flex max-w-0 items-center gap-1 overflow-hidden opacity-0 transition-all duration-500 ease-out group-hover:max-w-[760px] group-hover:opacity-100 group-focus-within:max-w-[760px] group-focus-within:opacity-100">
        <div className="no-scrollbar flex max-w-[calc(100vw-5.5rem)] items-center gap-1 overflow-x-auto text-sm">
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 font-medium transition duration-300 ${
                  active
                    ? "bg-journal-ink text-white shadow-[0_8px_20px_rgba(60,64,67,0.16)]"
                    : "text-journal-slate hover:bg-journal-surface hover:text-journal-ink"
                }`}
              >
                <Icon />
                {link.label}
              </Link>
            );
          })}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function HomeIcon() {
  return (
    <NavIcon>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10.5V20h13v-9.5" />
      <path d="M9.5 20v-5h5v5" />
    </NavIcon>
  );
}

function ArticleIcon() {
  return (
    <NavIcon>
      <path d="M7 4h8l4 4v12H7z" />
      <path d="M15 4v5h4" />
      <path d="M10 13h6" />
      <path d="M10 17h4" />
    </NavIcon>
  );
}

function ResultsIcon() {
  return (
    <NavIcon>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15l3-4 3 2 4-6" />
      <path d="M8 15h.01" />
      <path d="M11 11h.01" />
      <path d="M14 13h.01" />
      <path d="M18 7h.01" />
    </NavIcon>
  );
}

function AboutIcon() {
  return (
    <NavIcon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <path d="M12 7h.01" />
    </NavIcon>
  );
}
