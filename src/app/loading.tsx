export default function Loading() {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-white/30 backdrop-blur-md dark:bg-black/25">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-journal-line border-t-journal-blue" />
    </div>
  );
}
