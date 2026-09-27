import { CircleAlert, KeyRound, ShieldCheck, UserPlus, UserRoundCheck } from "lucide-react";
import { createStaffAction, updateStaffPermissionsAction, updateStaffStatusAction } from "@/app/admin/staff/actions";
import { getCurrentStaffContext } from "@/lib/auth/authorization.server";
import { getSupabaseAdminEnv } from "@/lib/env.server";
import { defaultStaffPermissions, permissionDefinitions, permissionCodes, roleLabel, type AppRole, type PermissionCode } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Staff & permissions" };

type StaffRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  is_active: boolean;
  created_at: string;
};

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const context = await getCurrentStaffContext();
  if (!context) return null;
  const canView = context.isOwner || context.permissions.has("staff.manage") || context.permissions.has("user.manage") || context.permissions.has("permission.manage");
  if (!canView) return <AccessDenied />;

  const canCreate = context.isOwner || context.permissions.has("user.manage");
  const canChangeStatus = context.isOwner || context.permissions.has("staff.manage");
  const canChangePermissions = context.isOwner || context.permissions.has("permission.manage");
  const { status, error } = await searchParams;
  const supabase = await createClient();

  const [profilesResult, roleDefaultsResult, overridesResult] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, role, is_active, created_at").neq("role", "customer").order("created_at"),
    supabase.from("role_permissions").select("role, permission_code, granted").eq("granted", true),
    supabase.from("user_permission_overrides").select("user_id, permission_code, granted"),
  ]);

  if (profilesResult.error) {
    return <main className="admin-content shell-wide"><section className="system-callout danger"><CircleAlert size={20} /><div><strong>RBAC migration is not applied</strong><p>Apply the latest Supabase migrations, then reload this page.</p></div></section></main>;
  }

  const staff = profilesResult.data as StaffRow[];
  const roleDefaults = new Map<AppRole, Set<PermissionCode>>();
  for (const row of roleDefaultsResult.data ?? []) {
    const values = roleDefaults.get(row.role) ?? new Set<PermissionCode>();
    if (row.granted && permissionCodes.includes(row.permission_code as PermissionCode)) values.add(row.permission_code as PermissionCode);
    roleDefaults.set(row.role, values);
  }
  const overrides = new Map<string, Map<PermissionCode, boolean>>();
  for (const row of overridesResult.data ?? []) {
    if (!permissionCodes.includes(row.permission_code as PermissionCode)) continue;
    const values = overrides.get(row.user_id) ?? new Map<PermissionCode, boolean>();
    values.set(row.permission_code as PermissionCode, row.granted);
    overrides.set(row.user_id, values);
  }

  const groupedPermissions = Map.groupBy(permissionDefinitions, ({ module }) => module);

  return (
    <main className="admin-content shell-wide">
      <section className="workspace-heading compact"><div><p className="eyebrow">Protected administration</p><h1>Staff & permissions</h1><p>Create operational accounts, disable access immediately and grant only the capabilities each person needs.</p></div><div className="access-badge owner"><ShieldCheck size={18} /> Owner controlled</div></section>
      {status && <p className="form-banner success" role="status">{status}</p>}
      {error && <p className="form-banner error" role="alert">{error}</p>}

      {canCreate && <section className="management-panel">
        <div className="panel-heading"><div><UserPlus size={21} /><div><h2>Create staff account</h2><p>The password is sent only to Supabase Auth and is never stored in this application database.</p></div></div>{!getSupabaseAdminEnv() && <span className="setup-required">Server secret required</span>}</div>
        <form className="management-form" action={createStaffAction}>
          <label>Full name<input name="fullName" required minLength={2} maxLength={120} autoComplete="off" /></label>
          <label>Email<input name="email" type="email" required autoComplete="off" /></label>
          <label>Temporary password<input name="password" type="password" required minLength={12} autoComplete="new-password" /></label>
          <button className="button button-primary" type="submit"><KeyRound size={17} /> Create staff</button>
        </form>
      </section>}

      <section className="workspace-section">
        <div className="section-heading"><div><p className="eyebrow">Access directory</p><h2>{staff.length} staff accounts</h2></div></div>
        <div className="staff-list">
          {staff.map((member) => {
            const base = member.role === "owner"
              ? new Set<PermissionCode>(permissionCodes)
              : roleDefaults.get(member.role) ?? new Set<PermissionCode>(defaultStaffPermissions);
            const effective = new Set(base);
            for (const [permission, granted] of overrides.get(member.id) ?? []) {
              if (granted) effective.add(permission); else effective.delete(permission);
            }
            const isSelf = member.id === context.userId;
            const protectedOwner = member.role === "owner";

            return <article className="staff-card" key={member.id}>
              <header><span className="staff-avatar"><UserRoundCheck size={21} /></span><div><h3>{member.full_name || "Unnamed staff"}{isSelf && <small> You</small>}</h3><p>{member.email || "Email sync pending"} · {roleLabel(member.role)}</p></div><span className={`status-pill ${member.is_active ? "active" : "disabled"}`}>{member.is_active ? "Active" : "Disabled"}</span></header>
              <div className="staff-summary"><span><strong>{effective.size}</strong> effective permissions</span><span>Created {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(member.created_at))}</span></div>
              <div className="staff-actions">
                {canChangeStatus && !protectedOwner && !isSelf && <form action={updateStaffStatusAction}><input type="hidden" name="userId" value={member.id} /><input type="hidden" name="active" value={member.is_active ? "false" : "true"} /><button className="button button-secondary" type="submit">{member.is_active ? "Disable access" : "Enable access"}</button></form>}
                {canChangePermissions && !protectedOwner && <details className="permission-editor"><summary>Edit permissions</summary><form action={updateStaffPermissionsAction}><input type="hidden" name="userId" value={member.id} /><div className="permission-groups">{Array.from(groupedPermissions.entries()).map(([module, definitions]) => <fieldset key={module}><legend>{module}</legend>{definitions.map((definition) => <label key={definition.code}><input type="checkbox" name="permission" value={definition.code} defaultChecked={effective.has(definition.code)} /><span><strong>{definition.label}</strong>{definition.sensitive && <small>Sensitive</small>}<code>{definition.code}</code></span></label>)}</fieldset>)}</div><button className="button button-primary" type="submit">Save permissions</button></form></details>}
              </div>
            </article>;
          })}
        </div>
      </section>
    </main>
  );
}

function AccessDenied() {
  return <main className="admin-content shell-wide"><section className="system-callout danger"><CircleAlert size={20} /><div><strong>Access denied</strong><p>This account does not have staff-management permission.</p></div></section></main>;
}
