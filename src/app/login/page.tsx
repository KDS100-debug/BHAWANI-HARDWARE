import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string; error?: string }> }) {
  const params = await searchParams;
  const initialMessage = params.error === "unauthorized" ? "This account is inactive or does not have business access." : "";
  return <AuthForm initialMode={params.mode === "admin" ? "admin" : "customer"} initialMessage={initialMessage} />;
}
