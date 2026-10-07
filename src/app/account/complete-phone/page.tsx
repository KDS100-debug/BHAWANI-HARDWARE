import { redirect } from "next/navigation";
import { CompletePhoneForm } from "@/components/auth/complete-phone-form";
import { getCurrentAccountContext } from "@/lib/auth/account.server";
import { safeNextPath } from "@/lib/auth/client";

export const metadata = { title: "Verify phone" };

export default async function CompletePhonePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const account = await getCurrentAccountContext();
  if (!account) redirect("/login");
  if (account.isReady) redirect(account.role === "customer" ? "/account/security" : "/admin");
  const params = await searchParams;
  return <CompletePhoneForm existingName={account.fullName} nextPath={safeNextPath(params.next) ?? undefined} />;
}
