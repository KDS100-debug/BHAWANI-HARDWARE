import { FileClock, ShieldAlert } from "lucide-react";
import { getCurrentStaffContext } from "@/lib/auth/authorization.server";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Audit history" };

export default async function AuditPage() {
  const context = await getCurrentStaffContext();
  if (!context) return null;
  if (!context.isOwner && !context.permissions.has("audit.view")) {
    return <main className="admin-content shell-wide"><section className="system-callout danger"><ShieldAlert size={20} /><div><strong>Access denied</strong><p>Audit history is restricted to explicitly authorized accounts.</p></div></section></main>;
  }

  const supabase = await createClient();
  const { data: logs, error } = await supabase.from("audit_logs").select("id, actor_id, action, entity_type, entity_id, metadata, created_at").order("created_at", { ascending: false }).limit(100);

  return (
    <main className="admin-content shell-wide">
      <section className="workspace-heading compact"><div><p className="eyebrow">Immutable history</p><h1>Audit log</h1><p>Permission, staff and catalogue changes are recorded at the database boundary and cannot be edited by staff.</p></div><div className="access-badge owner"><FileClock size={18} /> Latest 100 events</div></section>
      {error ? <section className="system-callout danger"><div><strong>Audit log unavailable</strong><p>Apply the RBAC migration or verify the audit.view permission.</p></div></section> : <div className="audit-table-wrap"><table className="audit-table"><thead><tr><th>Time</th><th>Action</th><th>Target</th><th>Actor</th><th>Details</th></tr></thead><tbody>{(logs ?? []).map((log) => <tr key={log.id}><td>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(log.created_at))}</td><td><code>{log.action}</code></td><td>{log.entity_type}<small>{log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ""}</small></td><td>{log.actor_id ? log.actor_id.slice(0, 8) : "System"}</td><td><details><summary>View</summary><pre>{JSON.stringify(log.metadata, null, 2)}</pre></details></td></tr>)}</tbody></table>{!logs?.length && <p className="empty-table">No audited changes have been recorded yet.</p>}</div>}
    </main>
  );
}
