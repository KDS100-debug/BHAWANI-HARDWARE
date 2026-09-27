import { notFound, redirect } from "next/navigation";
import { Check, LockKeyhole } from "lucide-react";
import { getCurrentStaffContext } from "@/lib/auth/authorization.server";
import { adminModules, canAccessModule, hasPermission } from "@/lib/auth/permissions";

export default async function AdminModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: moduleSlug } = await params;
  const moduleDefinition = adminModules.find(({ slug }) => slug === moduleSlug);
  if (!moduleDefinition) notFound();

  const context = await getCurrentStaffContext();
  if (!context) redirect("/login?mode=admin");
  if (!canAccessModule(moduleDefinition, context.permissions, context.isOwner)) redirect("/admin?error=forbidden");

  const capabilities = moduleDefinition.capabilities.filter(({ permission }) => hasPermission(context.permissions, permission, context.isOwner));

  return (
    <main className="admin-content shell-wide">
      <section className="workspace-heading compact">
        <div><p className="eyebrow">Authorized module</p><h1>{moduleDefinition.title}</h1><p>{moduleDefinition.description}</p></div>
        <div className="access-badge"><LockKeyhole size={18} /> {capabilities.length} capabilities</div>
      </section>
      <section className="module-detail-grid">
        {capabilities.map((capability) => <article className="capability-card" key={capability.permission}><Check size={18} /><div><h2>{capability.label}</h2><code>{capability.permission}</code></div></article>)}
      </section>
      <section className="system-callout"><div><strong>Authorization is active</strong><p>This module entry point and its database permissions are protected. Its business transaction screens will connect here when the corresponding ledger tables are implemented.</p></div></section>
    </main>
  );
}
