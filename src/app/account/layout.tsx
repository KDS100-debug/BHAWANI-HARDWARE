import { redirect } from "next/navigation";
import { getCurrentAccountContext } from "@/lib/auth/account.server";

export default async function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const account = await getCurrentAccountContext();
  if (!account) redirect("/login?next=/account/security");
  if (!account.isActive) redirect("/login?error=inactive");
  return children;
}
