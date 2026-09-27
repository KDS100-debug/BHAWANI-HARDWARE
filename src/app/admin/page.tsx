import Link from "next/link";
import { ArrowUpRight, Boxes, CircleAlert, PackageCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import { getCurrentStaffContext } from "@/lib/auth/authorization.server";
import { adminModules, canAccessModule } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };

const ownerMetrics = [
  ["Today's sales", "Sales ledger"],
  ["Today's orders", "Order workflow"],
  ["Today's purchases", "Purchase ledger"],
  ["Payments received", "Payment ledger"],
  ["Gross profit", "Owner only"],
  ["Net profit", "Owner only"],
  ["Customer outstanding", "Financial"],
  ["Supplier payable", "Financial"],
  ["Stock value", "Cost protected"],
  ["GST summary", "Tax reporting"],
] as const;

const staffMetrics = [
  ["New orders", "Order queue"],
  ["Today's orders", "Operations"],
  ["Today's sales", "Operations"],
  ["Pending deliveries", "Dispatch queue"],
] as const;

export default async function AdminDashboardPage() {
  const context = await getCurrentStaffContext();
  if (!context) return null;
  if (!context.isOwner && !context.permissions.has("dashboard.view")) {
    return <main className="admin-content shell-wide"><section className="system-callout danger"><ShieldAlert size={20} /><div><strong>Dashboard access denied</strong><p>This account can use only the modules explicitly granted by the owner.</p></div></section></main>;
  }

  const canViewProducts = context.isOwner || context.permissions.has("product.view");
  const supabase = await createClient();
  const [{ count: productCount }, { count: categoryCount }] = canViewProducts
    ? await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
      ])
    : [{ count: null }, { count: null }];

  const metrics = context.isOwner ? ownerMetrics : staffMetrics;
  const visibleModules = adminModules.filter((module) => canAccessModule(module, context.permissions, context.isOwner));

  return (
    <main className="admin-content shell-wide">
      <section className="workspace-heading">
        <div><p className="eyebrow">{context.isOwner ? "Complete business control" : "Daily operations"}</p><h1>{context.isOwner ? "Owner dashboard" : "Staff dashboard"}</h1><p>Welcome back, {context.fullName || context.email}. Your workspace contains only the capabilities authorized for this account.</p></div>
        <div className={`access-badge ${context.isOwner ? "owner" : "staff"}`}><ShieldCheck size={18} /> {context.isOwner ? "Owner override active" : `${context.permissions.size} permissions active`}</div>
      </section>

      {!context.authorizationReady && <section className="system-callout danger"><CircleAlert size={20} /><div><strong>Permission migration required</strong><p>Apply the latest Supabase migrations before using staff accounts. Owner access remains available.</p></div></section>}

      <section className="metric-grid" aria-label="Dashboard metrics">
        {metrics.map(([label, note]) => <article className="metric-card" key={label}><span>{note}</span><strong>—</strong><h2>{label}</h2><p>Connect this module&apos;s transaction ledger to display a live value.</p></article>)}
        {canViewProducts && <article className="metric-card live"><span>Live catalogue</span><strong>{productCount ?? 0}</strong><h2>Products</h2><p>{categoryCount ?? 0} catalogue categories visible to this account.</p></article>}
      </section>

      <section className="workspace-section">
        <div className="section-heading"><div><p className="eyebrow">Authorized modules</p><h2>Your workspace</h2></div><span>{visibleModules.length} available</span></div>
        <div className="module-grid">
          {visibleModules.map((module) => <Link className="module-card" href={`/admin/${module.slug}`} key={module.slug}><div className="module-icon">{module.slug === "inventory" ? <Boxes size={22} /> : <PackageCheck size={22} />}</div><div><h3>{module.shortTitle}</h3><p>{module.description}</p></div><ArrowUpRight size={19} /></Link>)}
        </div>
      </section>
    </main>
  );
}
