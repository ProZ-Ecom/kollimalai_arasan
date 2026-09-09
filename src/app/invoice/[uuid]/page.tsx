import { notFound, redirect } from "next/navigation";

import { TaxInvoice } from "@/features/invoice/components/TaxInvoice";
import { InvoicePrintButton } from "@/features/invoice/components/InvoicePrintButton";
import { invoiceService } from "@/features/invoice/services/invoice.service";
import type { InvoiceDto } from "@/features/invoice/types";
import { getPageSessionUser } from "@/lib/auth/require-auth";
import { ROLES } from "@/lib/constants";
import "@/features/invoice/components/tax-invoice.css";

export const dynamic = "force-dynamic";

export default async function OrderInvoicePage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;

  const user = await getPageSessionUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/invoice/${uuid}`)}`);
  }

  // Staff print any order; customers only get their own.
  const isStaff = user.role === ROLES.ADMIN || user.role === ROLES.STAFF;

  let invoice: InvoiceDto;
  try {
    invoice = await invoiceService.getOrderInvoice(
      uuid,
      isStaff ? undefined : user.id
    );
  } catch {
    notFound();
  }

  return (
    <div className="ti-screen">
      <InvoicePrintButton />
      <TaxInvoice invoice={invoice} />
    </div>
  );
}
