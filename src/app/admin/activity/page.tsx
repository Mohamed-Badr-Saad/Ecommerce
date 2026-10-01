import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminActivity } from "@/lib/admin-operations";

export const metadata = { title: "Activity | Admin" };

export default async function AdminActivityPage() {
  const activity = await getAdminActivity();
  return <section><p className="text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground">History</p><h2 className="mt-3 font-heading text-5xl">Activity</h2><p className="mt-3 text-muted-foreground">What admins changed recently, and when.</p><Card className="mt-8 rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">Latest events</CardTitle></CardHeader><CardContent>{activity.length ? <ol className="divide-y">{activity.map((entry) => <li key={entry.id} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr_auto]"><p className="font-medium">{entry.admin.name}</p><p>{entry.action} <span className="text-muted-foreground">· {entry.entityType}{entry.entityId ? ` · ${entry.entityId}` : ""}</span></p><time className="text-xs text-muted-foreground">{entry.timestamp.toLocaleString("en-EG")}</time></li>)}</ol> : <p className="py-10 text-center text-muted-foreground">No activity recorded.</p>}</CardContent></Card></section>;
}
