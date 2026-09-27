"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/authorization.server";
import { permissionCodes, type PermissionCode } from "@/lib/auth/permissions";

const createStaffSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(12).max(128)
    .regex(/[a-z]/, "Password needs a lowercase letter")
    .regex(/[A-Z]/, "Password needs an uppercase letter")
    .regex(/[0-9]/, "Password needs a number"),
});

const targetSchema = z.string().uuid();

function staffRedirect(kind: "status" | "error", message: string): never {
  redirect(`/admin/staff?${kind}=${encodeURIComponent(message)}`);
}

export async function createStaffAction(formData: FormData) {
  const context = await requirePermission("user.manage");
  const parsed = createStaffSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) staffRedirect("error", parsed.error.issues[0]?.message ?? "Check the staff details.");

  const admin = createAdminClient();
  if (!admin) staffRedirect("error", "Add SUPABASE_SECRET_KEY to the server environment before creating staff accounts.");

  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  });
  if (error || !data.user) staffRedirect("error", error?.message ?? "The staff account could not be created.");

  const { error: profileError } = await admin
    .from("profiles")
    .update({ email: parsed.data.email, full_name: parsed.data.fullName, role: "staff", is_active: true })
    .eq("id", data.user.id);

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    staffRedirect("error", "The profile could not be assigned. The incomplete login was removed.");
  }

  await admin.from("audit_logs").insert({
    actor_id: context.userId,
    action: "staff.created",
    entity_type: "profile",
    entity_id: data.user.id,
    metadata: { email: parsed.data.email, role: "staff" },
  });

  staffRedirect("status", "Staff account created.");
}

export async function updateStaffStatusAction(formData: FormData) {
  const context = await requirePermission("staff.manage");
  const targetUserId = targetSchema.safeParse(formData.get("userId"));
  const active = formData.get("active") === "true";
  if (!targetUserId.success) staffRedirect("error", "Invalid staff account.");
  if (targetUserId.data === context.userId) staffRedirect("error", "You cannot disable your own account.");

  const supabase = await createClient();
  const { data: target } = await supabase.from("profiles").select("role").eq("id", targetUserId.data).maybeSingle();
  if (!target || target.role === "customer" || target.role === "owner") {
    staffRedirect("error", "Owner and customer status cannot be changed here.");
  }

  const { error } = await supabase.from("profiles").update({ is_active: active }).eq("id", targetUserId.data);
  if (error) staffRedirect("error", "Staff status could not be updated.");
  staffRedirect("status", active ? "Staff access enabled." : "Staff access disabled.");
}

export async function updateStaffPermissionsAction(formData: FormData) {
  await requirePermission("permission.manage");
  const targetUserId = targetSchema.safeParse(formData.get("userId"));
  if (!targetUserId.success) staffRedirect("error", "Invalid staff account.");

  const requested = [...new Set(formData.getAll("permission").filter((value): value is string => typeof value === "string"))];
  const validPermissions = requested.filter((permission): permission is PermissionCode => permissionCodes.includes(permission as PermissionCode));
  if (validPermissions.length !== requested.length) staffRedirect("error", "An unknown permission was submitted.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_permissions", {
    target_user_id: targetUserId.data,
    requested_permissions: validPermissions,
  });
  if (error) staffRedirect("error", "Permissions could not be updated.");
  staffRedirect("status", "Staff permissions updated.");
}
