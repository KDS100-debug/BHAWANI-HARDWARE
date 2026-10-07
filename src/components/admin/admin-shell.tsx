import Link from "next/link";
import {
  Boxes,
  ChartNoAxesCombined,
  ClipboardList,
  FileClock,
  FileText,
  IndianRupee,
  LayoutDashboard,
  LockKeyhole,
  PackageSearch,
  ReceiptIndianRupee,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  Store,
  Tags,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { adminModules, canAccessModule, roleLabel } from "@/lib/auth/permissions";
import type { StaffContext } from "@/lib/auth/authorization.server";

const moduleIcons = {
  orders: ClipboardList,
  sales: ReceiptIndianRupee,
  products: Tags,
  inventory: Boxes,
  purchases: ShoppingBasket,
  customers: Users,
  suppliers: Truck,
  payments: WalletCards,
  expenses: IndianRupee,
  gst: FileText,
  reports: ChartNoAxesCombined,
  staff: ShieldCheck,
  settings: Settings,
  audit: FileClock,
} as const;

export function AdminShell({ context, children }: { context: StaffContext; children: React.ReactNode }) {
  const visibleModules = adminModules.filter((module) => canAccessModule(module, context.permissions, context.isOwner));
  const displayName = context.fullName || context.email;

  return (
    <div className="admin-workspace">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin" aria-label="Bhawani Hardware dashboard">
          <span>BH</span>
          <strong>Bhawani Hardware<small>{roleLabel(context.role)} workspace</small></strong>
        </Link>
        <nav className="admin-nav" aria-label="Business modules">
          {(context.isOwner || context.permissions.has("dashboard.view")) && <Link href="/admin"><LayoutDashboard size={18} /> Dashboard</Link>}
          {visibleModules.map((module) => {
            const Icon = moduleIcons[module.slug as keyof typeof moduleIcons] ?? PackageSearch;
            return <Link href={`/admin/${module.slug}`} key={module.slug}><Icon size={18} /> {module.shortTitle}</Link>;
          })}
          <Link href="/account/security"><LockKeyhole size={18} /> Account security</Link>
        </nav>
        <div className="admin-account">
          <span className="admin-avatar">{displayName.slice(0, 1).toUpperCase()}</span>
          <div><strong>{displayName}</strong><small>{roleLabel(context.role)}</small></div>
          <SignOutButton />
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-mobile-header">
          <Link href="/admin"><Store size={20} /> Bhawani Hardware</Link>
          <span>{roleLabel(context.role)}</span>
        </header>
        {children}
      </div>
    </div>
  );
}
