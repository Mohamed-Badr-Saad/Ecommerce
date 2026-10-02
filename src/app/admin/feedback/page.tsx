import { Mail, MessageSquareText, Star } from "lucide-react";
import Link from "next/link";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFeedbackMessages, getFeedbackSummary, type FeedbackFilter } from "@/lib/feedback-messages";
import { cn } from "@/lib/utils";
import { deleteFeedbackMessageAction, markAllFeedbackReadAction, setFeedbackReadAction } from "./actions";

export const metadata = { title: "Feedback | Admin" };

const dateFormat = new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" });

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => <Star key={value} className={cn("size-4", value <= rating ? "fill-primary text-primary" : "text-muted-foreground/40")} aria-hidden="true" />)}
    </span>
  );
}

export default async function AdminFeedbackPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show } = await searchParams;
  const filter: FeedbackFilter = show === "all" ? "all" : "unread";
  const [messages, summary] = await Promise.all([getFeedbackMessages(filter), getFeedbackSummary()]);

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground">Customers</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-5xl">Feedback</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">Messages sent through the &ldquo;Share your feedback&rdquo; form on the homepage.</p>
        </div>
        {summary.unread ? <form action={markAllFeedbackReadAction}><Button variant="outline" className="rounded-none">Mark all as read</Button></form> : null}
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="border border-border bg-card p-5"><dt className="text-sm text-muted-foreground">Unread</dt><dd className="mt-2 font-heading text-4xl">{summary.unread}</dd></div>
        <div className="border border-border bg-card p-5"><dt className="text-sm text-muted-foreground">All messages</dt><dd className="mt-2 font-heading text-4xl">{summary.total}</dd></div>
        <div className="border border-border bg-card p-5"><dt className="text-sm text-muted-foreground">Average rating</dt><dd className="mt-2 font-heading text-4xl">{summary.averageRating ? `${summary.averageRating.toFixed(1)} / 5` : "—"}</dd></div>
      </dl>

      <nav aria-label="Filter feedback" className="mt-8 flex gap-2">
        {([["unread", `Unread (${summary.unread})`], ["all", `All (${summary.total})`]] as const).map(([value, label]) => (
          <Link key={value} href={value === "unread" ? "/admin/feedback" : "/admin/feedback?show=all"} aria-current={filter === value ? "page" : undefined} className={cn("border px-4 py-2 text-sm transition-colors", filter === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary")}>{label}</Link>
        ))}
      </nav>

      <div className="mt-6 grid gap-4">
        {messages.length ? messages.map((message) => {
          const name = message.name || message.user?.name || "Anonymous";
          const email = message.email || message.user?.email || null;
          return (
            <Card key={message.id} className={cn("rounded-none", !message.isRead && "border-primary/50")}>
              <CardContent className="grid gap-4 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{name}</p>
                      {!message.isRead ? <Badge className="rounded-none">New</Badge> : null}
                      {message.user ? <Badge variant="outline" className="rounded-none">Signed-in customer</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{dateFormat.format(message.createdAt)}</p>
                  </div>
                  <Stars rating={message.rating} />
                </div>
                <p className="whitespace-pre-wrap break-words leading-7">{message.message}</p>
                <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                  {email ? (
                    <Button asChild size="sm" variant="outline" className="rounded-none"><a href={`mailto:${email}?subject=${encodeURIComponent("Thank you for your feedback — Talié")}`}><Mail aria-hidden="true" /> Reply by email</a></Button>
                  ) : <span className="text-xs text-muted-foreground">No email left</span>}
                  <form action={setFeedbackReadAction.bind(null, message.id, !message.isRead)}>
                    <Button size="sm" variant="outline" className="rounded-none">{message.isRead ? "Mark as unread" : "Mark as read"}</Button>
                  </form>
                  <form action={deleteFeedbackMessageAction.bind(null, message.id)} className="ml-auto">
                    <ConfirmSubmitButton message="Delete this feedback message? This can't be undone.">Delete</ConfirmSubmitButton>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        }) : (
          <Card className="rounded-none">
            <CardContent className="flex flex-col items-center py-14 text-center text-muted-foreground">
              <MessageSquareText className="size-7 text-primary" aria-hidden="true" />
              <p className="mt-3">{filter === "unread" ? "You're all caught up — no unread feedback." : "No feedback has been sent yet."}</p>
              {filter === "unread" && summary.total ? <Link href="/admin/feedback?show=all" className="mt-2 text-sm underline underline-offset-4">See all messages</Link> : null}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
