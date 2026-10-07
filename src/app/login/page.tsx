import { AuthForm } from "@/components/auth/auth-form";
import { safeNextPath } from "@/lib/auth/client";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const params = await searchParams;
  const initialMessage = params.error === "inactive"
    ? "Your account is currently inactive. Please contact the administrator."
    : params.error === "unauthorized"
      ? "This account does not have access to the business workspace."
      : params.error === "confirmation"
        ? "That confirmation link is invalid or has expired."
        : "";
  return <AuthForm initialMessage={initialMessage} nextPath={safeNextPath(params.next) ?? undefined} forceSignOut={params.error === "inactive"} />;
}
