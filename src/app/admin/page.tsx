import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { createClient } from "@/lib/supabase/server";

const staffRoles = ["owner", "manager", "sales_staff", "accountant"];

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?mode=admin");

  const { data: profile } = await supabase.from("profiles").select("full_name, role, is_active").eq("id", user.id).maybeSingle();
  if (!profile || !profile.is_active || !staffRoles.includes(profile.role)) redirect("/login?mode=admin&error=unauthorized");

  return <main className="admin-page shell"><header className="admin-header"><div><p className="eyebrow">Bhawani Hardware</p><h1>Operations dashboard</h1><p className="hero-copy">Signed in as {profile.full_name || user.email}.</p></div><SignOutButton /></header><section className="admin-notice"><h2>Staff access is active</h2><p>Your authenticated session and staff role are verified server-side. Business modules will appear here as they are connected.</p></section></main>;
}