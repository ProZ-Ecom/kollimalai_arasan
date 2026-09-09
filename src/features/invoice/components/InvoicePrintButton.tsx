"use client";

export function InvoicePrintButton() {
  return (
    <div className="no-print flex justify-center gap-3 py-4">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-md bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-700"
      >
        Print / Save as PDF
      </button>
    </div>
  );
}
