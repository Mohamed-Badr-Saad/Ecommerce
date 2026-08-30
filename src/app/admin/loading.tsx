export default function AdminLoading() {
  return <div aria-label="Loading admin dashboard" role="status" className="animate-pulse"><div className="h-3 w-32 bg-muted" /><div className="mt-4 h-12 w-64 bg-muted" /><div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-32 border border-border bg-muted/60" />)}</div><div className="mt-8 h-80 border border-border bg-muted/60" /></div>;
}
