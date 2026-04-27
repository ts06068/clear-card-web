"use client";

import { useThemeMode } from "./ThemeProvider";

const modes = [
  { value: "system" as const, label: "System" },
  { value: "light" as const, label: "Light" },
  { value: "dark" as const, label: "Dark" }
];

export function ThemeToggle() {
  const { mode, setMode } = useThemeMode();

  return (
    <div className="flex items-center border border-white/15 bg-white/[0.08] p-0.5 text-xs">
      {modes.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => setMode(item.value)}
          className={`px-2.5 py-1.5 font-semibold transition ${
            mode === item.value
              ? "bg-white text-journal-navy"
              : "text-blue-100 hover:bg-white/10 hover:text-white"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
