"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { RouteTransitionLayer } from "./RouteTransitionLayer";
import { TopNavigation } from "./TopNavigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="min-h-screen bg-journal-surface">
      <TopNavigation />
      <Suspense fallback={null}>
        <RouteTransitionLayer />
      </Suspense>
      <main
        key={pathname}
        className={
          isHome
            ? "h-screen w-full overflow-hidden"
            : "animate-float-in w-full px-4 py-8 sm:px-6 lg:px-8"
        }
      >
        {children}
      </main>
    </div>
  );
}
