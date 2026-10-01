"use client";

import { Printer } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "./ui/button";

/** Opens the browser's print dialog for the admin's printable order document. */
export function PrintOrderButton() {
  return (
    <Button type="button" className="h-11 rounded-none px-6 print:hidden" onClick={() => window.print()}>
      <Printer aria-hidden="true" /> Print
    </Button>
  );
}

/** Opens the print dialog once when the printable page is opened from the "Print order" button. */
export function AutoPrint() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    // Let fonts and layout settle before the dialog captures the page. (No cleanup on purpose:
    // React's development double-run would otherwise cancel the only scheduled print.)
    setTimeout(() => window.print(), 400);
  }, []);
  return null;
}
