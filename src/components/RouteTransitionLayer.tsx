"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteTransitionLayer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [loading, setLoading] = useState(false);
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clear = () => {
      if (clearRef.current) {
        clearTimeout(clearRef.current);
      }
      if (safetyRef.current) {
        clearTimeout(safetyRef.current);
      }
      clearRef.current = setTimeout(() => setLoading(false), 360);
    };

    clear();
    return () => {
      if (clearRef.current) {
        clearTimeout(clearRef.current);
      }
      if (safetyRef.current) {
        clearTimeout(safetyRef.current);
      }
    };
  }, [pathname, query]);

  useEffect(() => {
    const showLoading = () => {
      setLoading(true);
      if (safetyRef.current) {
        clearTimeout(safetyRef.current);
      }
      safetyRef.current = setTimeout(() => setLoading(false), 2400);
    };

    const showNavigation = (event: Event) => {
      if (event.type === "clear-card:navigate") {
        showLoading();
      }
    };

    const showLinkNavigation = (event: MouseEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const anchor = target?.closest("a");

      if (anchor) {
        const href = anchor.getAttribute("href");
        const targetAttr = anchor.getAttribute("target");
        if (href?.startsWith("/") && targetAttr !== "_blank") {
          showLoading();
        }
      }
    };

    const showFormNavigation = (event: SubmitEvent) => {
      const target = event.target instanceof HTMLFormElement ? event.target : null;

      if (target?.getAttribute("action")?.startsWith("/")) {
        showLoading();
      }
    };

    document.addEventListener("click", showLinkNavigation, true);
    document.addEventListener("submit", showFormNavigation, true);
    document.addEventListener("clear-card:navigate", showNavigation);
    return () => {
      document.removeEventListener("click", showLinkNavigation, true);
      document.removeEventListener("submit", showFormNavigation, true);
      document.removeEventListener("clear-card:navigate", showNavigation);
    };
  }, []);

  if (!loading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-white/30 backdrop-blur-md dark:bg-black/25">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-journal-line border-t-journal-blue" />
    </div>
  );
}
