export function PageLoading() {
  return (
    <div
      aria-busy="true"
      className="flex min-h-screen items-center justify-center bg-warm-cream"
    >
      <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
    </div>
  );
}
