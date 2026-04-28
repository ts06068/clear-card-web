export function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg bg-white/64 shadow-[0_18px_54px_rgba(60,64,67,0.10)] backdrop-blur-xl dark:bg-white/5">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-journal-line text-sm">
          {children}
        </table>
      </div>
    </div>
  );
}
