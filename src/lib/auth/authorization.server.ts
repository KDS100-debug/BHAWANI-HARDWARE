import "server-only";

import { cache } from "react";
import { getCurrentAccountContext } from "@/lib/auth/account.server";
import { createClient } from "@/lib/supabase/server";
import { permissionCodes, type AppRole, type PermissionCode } from "@/lib/auth/permissions";

export type StaffContext = {
  userId: string;
  email: string;
  fullName: string | null;
  role: Exclude<AppRole, "customer">;
  isOwner: boolean;
  permissions: ReadonlySet<PermissionCode>;
  authorizationReady: boolean;
};

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

const staffRoles = new Set<AppRole>(["owner", "staff", "manager", "sales_staff", "accountant"]);

export const getCurrentStaffContext = cache(async (): Promise<StaffContext | null> => {
  const account = await getCurrentAccountContext();
  if (!account || !account.isReady || !staffRoles.has(account.role)) return null;
  const supabase = await createClient();

  const role = account.role as Exclude<AppRole, "customer">;
  const isOwner = role === "owner";
  if (isOwner) {
    return {
      userId: account.userId,
      email: account.email ?? account.phone ?? "Owner",
      fullName: account.fullName,
      role,
      isOwner: true,
      permissions: new Set(permissionCodes),
      authorizationReady: true,
    };
  }

  const { data, error } = await supabase.rpc("my_permissions");
  const permissions = new Set<PermissionCode>();
  if (!error) {
    for (const row of data ?? []) {
      if (permissionCodes.includes(row.permission_code as PermissionCode)) {
        permissions.add(row.permission_code as PermissionCode);
      }
    }
  }

  return {
    userId: account.userId,
    email: account.email ?? account.phone ?? "Staff member",
    fullName: account.fullName,
    role,
    isOwner: false,
    permissions,
    authorizationReady: !error,
  };
});

export async function requireStaffContext() {
  const context = await getCurrentStaffContext();
  if (!context) throw new AuthorizationError("A verified staff account is required.");
  return context;
}

export async function requirePermission(permission: PermissionCode) {
  const context = await requireStaffContext();
  if (!context.isOwner && !context.permissions.has(permission)) throw new AuthorizationError();
  return context;
}

export async function requireAnyPermission(permissions: readonly PermissionCode[]) {
  const context = await requireStaffContext();
  if (!context.isOwner && !permissions.some((permission) => context.permissions.has(permission))) {
    throw new AuthorizationError();
  }
  return context;
}
