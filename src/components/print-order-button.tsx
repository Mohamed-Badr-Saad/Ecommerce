"use client";

import { Printer } from "lucide-react";

import { Button } from "./ui/button";

/** Opens the browser's print dialog; the site header, footer and buttons are hidden when printing. */
export function PrintOrderButton() {
  return (
    <Button type="button" variant="outline" className="h-12 rounded-none px-7 print:hidden" onClick={() => window.print()}>
      <Printer aria-hidden="true" /> Print order
    </Button>
  );
}
