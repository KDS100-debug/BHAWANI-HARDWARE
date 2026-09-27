import { describe, expect, it } from "vitest";
import {
  adminModules,
  canAccessModule,
  defaultStaffPermissions,
  permissionCodes,
  permissionDefinitions,
} from "@/lib/auth/permissions";

describe("role permission matrix", () => {
  const staff = new Set<string>(defaultStaffPermissions);

  it("gives owners access to every module and permission", () => {
    expect(adminModules.every((module) => canAccessModule(module, new Set(), true))).toBe(true);
    expect(permissionCodes).toHaveLength(permissionDefinitions.length);
  });

  it("keeps sensitive financial and administration permissions out of staff defaults", () => {
    const sensitiveDefaults = permissionDefinitions
      .filter(({ code, sensitive }) => sensitive && staff.has(code))
      .map(({ code }) => code);

    expect(sensitiveDefaults).toEqual([]);
    expect(staff.has("dashboard.financial")).toBe(false);
    expect(staff.has("report.profit")).toBe(false);
    expect(staff.has("product.change_cost")).toBe(false);
    expect(staff.has("settings.manage")).toBe(false);
    expect(staff.has("permission.manage")).toBe(false);
    expect(staff.has("audit.view")).toBe(false);
  });

  it("shows staff operational modules without exposing owner modules", () => {
    const visible = adminModules.filter((module) => canAccessModule(module, staff)).map(({ slug }) => slug);

    expect(visible).toEqual(["orders", "sales", "products", "inventory", "customers", "suppliers"]);
    expect(visible).not.toContain("payments");
    expect(visible).not.toContain("expenses");
    expect(visible).not.toContain("reports");
    expect(visible).not.toContain("staff");
    expect(visible).not.toContain("settings");
    expect(visible).not.toContain("audit");
  });

  it("reveals a module only after an explicit grant", () => {
    const withPurchases = new Set<string>([...staff, "purchase.create"]);
    const purchases = adminModules.find(({ slug }) => slug === "purchases");

    expect(purchases).toBeDefined();
    expect(canAccessModule(purchases!, staff)).toBe(false);
    expect(canAccessModule(purchases!, withPurchases)).toBe(true);
  });
});
