export default function LmsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue-600" />
        <p className="text-sm font-medium text-slate-700">Elevate for Humanity</p>
        <p className="text-xs text-slate-400">Signing you in…</p>
      </div>
    </div>
  );
}
