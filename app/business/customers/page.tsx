import { requireBusinessAccount } from "@/lib/business-guard";
import CustomersClient from "./CustomersClient";

export const dynamic = "force-dynamic";

/* BUSINESS CUSTOMERS — the follow-up list generated from the four
 * automations, the automations editor and business settings (owner
 * order 2026-11-24). Self-guarded like /business/home. Preview
 * only: it runs on this device over labeled sample data, and no
 * messages are sent — the page says so in its honesty line. */
export default async function BusinessCustomersPage() {
  await requireBusinessAccount("/business/customers");
  return <CustomersClient />;
}
