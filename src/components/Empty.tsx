export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-3xl border border-dashed border-border bg-card px-5 py-6 text-center text-muted-foreground">{children}</p>;
}
export function Loading() {
  return <div className="space-y-3 px-5 pt-8">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-3xl bg-secondary" />)}</div>;
}
