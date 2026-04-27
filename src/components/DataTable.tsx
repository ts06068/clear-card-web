export function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="academic-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-journal-line text-sm">
          {children}
        </table>
      </div>
    </div>
  );
}
