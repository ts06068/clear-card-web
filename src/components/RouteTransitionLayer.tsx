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

    const show = (event: Event) => {
      if (event.type === "clear-card:navigate") {
        showLoading();
        return;
      }

      const target = event.target instanceof HTMLElement ? event.target : null;
      const anchor = target?.closest("a");
      const form = target?.closest("form");

      if (anchor) {
        const href = anchor.getAttribute("href");
        const targetAttr = anchor.getAttribute("target");
        if (href?.startsWith("/") && targetAttr !== "_blank") {
          showLoading();
        }
      }

      if (form?.getAttribute("action")?.startsWith("/")) {
        showLoading();
      }
    };

    document.addEventListener("click", show, true);
    document.addEventListener("submit", show, true);
    document.addEventListener("clear-card:navigate", show);
    return () => {
      document.removeEventListener("click", show, true);
      document.removeEventListener("submit", show, true);
      document.removeEventListener("clear-card:navigate", show);
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
