"use client";

import { Button } from "@/components/ui/button";

export function ConfirmSubmitButton({ children, message }: { children: React.ReactNode; message: string }) {
  return (
    <Button
      type="submit"
      variant="destructive"
      size="sm"
      className="rounded-none"
      onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}
    >
      {children}
    </Button>
  );
}
