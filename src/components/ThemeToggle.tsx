"use client";

import { useThemeMode } from "./ThemeProvider";

const modes = [
  { value: "system" as const, label: "System", icon: SystemIcon },
  { value: "light" as const, label: "Light", icon: LightIcon },
  { value: "dark" as const, label: "Dark", icon: DarkIcon }
];

export function ThemeToggle() {
  const { mode, setMode } = useThemeMode();

  return (
    <div className="ml-1 flex items-center rounded-full border border-journal-line bg-white/70 p-0.5 text-xs shadow-hairline dark:bg-white/5">
      {modes.map((item) => {
        const Icon = item.icon;

        return (
          <ThemeButton
            key={item.value}
            active={mode === item.value}
            label={item.label}
            onClick={() => setMode(item.value)}
            icon={<Icon />}
          />
        );
      })}
    </div>
  );
}

function ThemeButton({
  active,
  label,
  icon,
  onClick
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${label} theme`}
      title={`${label} theme`}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-full transition ${
        active
          ? "bg-journal-control text-journal-control-ink"
          : "text-journal-slate hover:bg-journal-surface hover:text-journal-ink"
      }`}
    >
      {icon}
    </button>
  );
}

function ThemeIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
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

function SystemIcon() {
  return (
    <ThemeIcon>
      <rect x="4" y="5" width="16" height="11" rx="2" />
      <path d="M9 20h6" />
      <path d="M12 16v4" />
    </ThemeIcon>
  );
}

function LightIcon() {
  return (
    <ThemeIcon>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </ThemeIcon>
  );
}

function DarkIcon() {
  return (
    <ThemeIcon>
      <path d="M20 14.5A7.6 7.6 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </ThemeIcon>
  );
}
