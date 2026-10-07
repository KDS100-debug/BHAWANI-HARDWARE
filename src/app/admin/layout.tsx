import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentAccountContext } from "@/lib/auth/account.server";
import { getCurrentStaffContext } from "@/lib/auth/authorization.server";

export const metadata: Metadata = { title: "Business workspace" };

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const account = await getCurrentAccountContext();
  if (!account) redirect("/login?next=/admin");
  if (!account.isActive) redirect("/login?error=inactive");
  if (!account.isReady) redirect("/account/complete-phone?next=/admin");
  const context = await getCurrentStaffContext();
  if (!context) redirect("/login?mode=admin&error=unauthorized");
  return <AdminShell context={context}>{children}</AdminShell>;
}
