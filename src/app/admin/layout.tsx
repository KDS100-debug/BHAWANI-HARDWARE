import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentStaffContext } from "@/lib/auth/authorization.server";

export const metadata: Metadata = { title: "Business workspace" };

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const context = await getCurrentStaffContext();
  if (!context) redirect("/login?mode=admin&error=unauthorized");
  return <AdminShell context={context}>{children}</AdminShell>;
}
