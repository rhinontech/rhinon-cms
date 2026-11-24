/** The one loader: a centred spinner, used for route loading and in-flight navigation. */
export function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-muted-foreground" role="status" aria-live="polite">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-foreground/10 border-t-primary" aria-hidden />
      <span className="text-xs">{label}…</span>
    </div>
  );
}

/** Shown inside the app shell while a page's server response is on its way. */
export function PageLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-card">
      <Loader />
    </div>
  );
}
