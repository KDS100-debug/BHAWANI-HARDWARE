export const permissionDefinitions = [
  { code: "dashboard.view", module: "dashboard", label: "Operational dashboard", sensitive: false },
  { code: "dashboard.financial", module: "dashboard", label: "Financial dashboard", sensitive: true },
  { code: "order.view", module: "orders", label: "View orders", sensitive: false },
  { code: "order.confirm", module: "orders", label: "Confirm orders", sensitive: false },
  { code: "order.prepare", module: "orders", label: "Prepare orders", sensitive: false },
  { code: "order.dispatch", module: "orders", label: "Dispatch orders", sensitive: false },
  { code: "order.deliver", module: "orders", label: "Deliver orders", sensitive: false },
  { code: "order.cancel", module: "orders", label: "Cancel orders", sensitive: true },
  { code: "sale.view", module: "sales", label: "View sales", sensitive: false },
  { code: "sale.create", module: "sales", label: "Create sales", sensitive: false },
  { code: "sale.confirm", module: "sales", label: "Confirm sales", sensitive: false },
  { code: "sale.return", module: "sales", label: "Process sales returns", sensitive: true },
  { code: "sale.reverse", module: "sales", label: "Reverse sales", sensitive: true },
  { code: "product.view", module: "products", label: "View products", sensitive: false },
  { code: "product.create", module: "products", label: "Create products", sensitive: false },
  { code: "product.edit", module: "products", label: "Edit products", sensitive: false },
  { code: "product.change_price", module: "products", label: "Change selling rates", sensitive: true },
  { code: "product.change_cost", module: "products", label: "Change or view cost", sensitive: true },
  { code: "category.view", module: "products", label: "View categories", sensitive: false },
  { code: "category.create", module: "products", label: "Create categories", sensitive: false },
  { code: "category.edit", module: "products", label: "Edit categories", sensitive: false },
  { code: "inventory.view", module: "inventory", label: "View inventory", sensitive: false },
  { code: "inventory.adjust", module: "inventory", label: "Adjust inventory", sensitive: true },
  { code: "inventory.valuation", module: "inventory", label: "View stock valuation", sensitive: true },
  { code: "purchase.view", module: "purchases", label: "View purchases", sensitive: true },
  { code: "purchase.create", module: "purchases", label: "Create purchase drafts", sensitive: true },
  { code: "purchase.confirm", module: "purchases", label: "Confirm purchases", sensitive: true },
  { code: "purchase.return", module: "purchases", label: "Process purchase returns", sensitive: true },
  { code: "customer.view", module: "customers", label: "View customers", sensitive: false },
  { code: "customer.create", module: "customers", label: "Create customers", sensitive: false },
  { code: "customer.edit", module: "customers", label: "Edit customers", sensitive: false },
  { code: "customer.ledger", module: "customers", label: "View customer ledgers", sensitive: true },
  { code: "supplier.view", module: "suppliers", label: "View suppliers", sensitive: false },
  { code: "supplier.edit", module: "suppliers", label: "Edit suppliers", sensitive: true },
  { code: "supplier.financial", module: "suppliers", label: "View supplier finances", sensitive: true },
  { code: "payment.view", module: "payments", label: "View payments", sensitive: true },
  { code: "payment.create", module: "payments", label: "Record payments", sensitive: true },
  { code: "payment.reverse", module: "payments", label: "Reverse payments", sensitive: true },
  { code: "expense.view", module: "expenses", label: "View expenses", sensitive: true },
  { code: "expense.create", module: "expenses", label: "Create expenses", sensitive: false },
  { code: "expense.edit", module: "expenses", label: "Correct expenses", sensitive: true },
  { code: "expense.report", module: "expenses", label: "View expense analysis", sensitive: true },
  { code: "gst.sale", module: "gst", label: "Create GST sales", sensitive: false },
  { code: "gst.purchase", module: "gst", label: "Create GST purchases", sensitive: true },
  { code: "gst.manage", module: "gst", label: "Manage GST", sensitive: true },
  { code: "gst.report", module: "gst", label: "View GST reports", sensitive: true },
  { code: "report.orders", module: "reports", label: "Order reports", sensitive: false },
  { code: "report.sales", module: "reports", label: "Sales reports", sensitive: false },
  { code: "report.purchases", module: "reports", label: "Purchase reports", sensitive: true },
  { code: "report.inventory", module: "reports", label: "Inventory reports", sensitive: false },
  { code: "report.expenses", module: "reports", label: "Expense reports", sensitive: true },
  { code: "report.gst", module: "reports", label: "GST reports", sensitive: true },
  { code: "report.financial", module: "reports", label: "Financial reports", sensitive: true },
  { code: "report.profit", module: "reports", label: "Profit reports", sensitive: true },
  { code: "staff.manage", module: "staff", label: "Manage staff status", sensitive: true },
  { code: "user.manage", module: "staff", label: "Create staff accounts", sensitive: true },
  { code: "permission.manage", module: "staff", label: "Manage permissions", sensitive: true },
  { code: "settings.manage", module: "settings", label: "Manage business settings", sensitive: true },
  { code: "audit.view", module: "audit", label: "View audit history", sensitive: true },
] as const;

export type PermissionCode = (typeof permissionDefinitions)[number]["code"];
export type AppRole = "customer" | "owner" | "staff" | "manager" | "sales_staff" | "accountant";

export const permissionCodes = permissionDefinitions.map(({ code }) => code) as PermissionCode[];

export const defaultStaffPermissions = [
  "dashboard.view",
  "order.view",
  "order.prepare",
  "order.dispatch",
  "order.deliver",
  "sale.view",
  "sale.create",
  "sale.confirm",
  "product.view",
  "category.view",
  "inventory.view",
  "customer.view",
  "customer.create",
  "customer.edit",
  "supplier.view",
] as const satisfies readonly PermissionCode[];

export type AdminModuleDefinition = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  access: readonly PermissionCode[];
  capabilities: readonly { permission: PermissionCode; label: string }[];
};

export const adminModules: readonly AdminModuleDefinition[] = [
  {
    slug: "orders",
    title: "Customer orders",
    shortTitle: "Orders",
    description: "Move COD orders through confirmation, preparation, dispatch and delivery.",
    access: ["order.view"],
    capabilities: [
      { permission: "order.view", label: "Search orders and view customer, address, payment and status history" },
      { permission: "order.confirm", label: "Confirm new orders" },
      { permission: "order.prepare", label: "Move confirmed orders to Preparing" },
      { permission: "order.dispatch", label: "Move prepared orders to Out for Delivery" },
      { permission: "order.deliver", label: "Mark orders Delivered" },
      { permission: "payment.create", label: "Record COD collection" },
      { permission: "order.cancel", label: "Cancel eligible orders through the controlled workflow" },
    ],
  },
  {
    slug: "sales",
    title: "Sales & invoices",
    shortTitle: "Sales",
    description: "Create counter sales, confirm invoices, record payments and process controlled returns.",
    access: ["sale.view", "sale.create"],
    capabilities: [
      { permission: "sale.view", label: "Search, print and reprint sales invoices" },
      { permission: "sale.create", label: "Create draft sales and add products" },
      { permission: "sale.confirm", label: "Confirm sales and issue final invoices" },
      { permission: "sale.return", label: "Process sales returns" },
      { permission: "sale.reverse", label: "Reverse eligible sales without deleting history" },
    ],
  },
  {
    slug: "products",
    title: "Products & categories",
    shortTitle: "Products",
    description: "Maintain the catalogue while preserving historical transaction records.",
    access: ["product.view", "category.view"],
    capabilities: [
      { permission: "product.view", label: "Search products and view selling rates and availability" },
      { permission: "product.create", label: "Create products" },
      { permission: "product.edit", label: "Edit non-sensitive product details" },
      { permission: "product.change_price", label: "Change selling rates" },
      { permission: "product.change_cost", label: "View and change purchase costs" },
      { permission: "category.create", label: "Create product categories" },
      { permission: "category.edit", label: "Edit, order and activate categories" },
      { permission: "gst.manage", label: "Change GST rates and HSN/SAC" },
    ],
  },
  {
    slug: "inventory",
    title: "Inventory",
    shortTitle: "Inventory",
    description: "Monitor on-hand, reserved and available stock with audited adjustments.",
    access: ["inventory.view"],
    capabilities: [
      { permission: "inventory.view", label: "View stock, movements and low-stock warnings" },
      { permission: "inventory.adjust", label: "Record reasoned stock adjustments" },
      { permission: "inventory.valuation", label: "View purchase-cost stock valuation" },
    ],
  },
  {
    slug: "purchases",
    title: "Purchases",
    shortTitle: "Purchases",
    description: "Prepare supplier purchases and confirm stock increases through controlled approvals.",
    access: ["purchase.view", "purchase.create"],
    capabilities: [
      { permission: "purchase.view", label: "View purchase history and supplier invoices" },
      { permission: "purchase.create", label: "Create purchase drafts" },
      { permission: "purchase.confirm", label: "Confirm purchases and increase inventory" },
      { permission: "purchase.return", label: "Process supplier returns" },
    ],
  },
  {
    slug: "customers",
    title: "Customers",
    shortTitle: "Customers",
    description: "Manage buyer contact details, sales context and permitted collections.",
    access: ["customer.view", "customer.create"],
    capabilities: [
      { permission: "customer.view", label: "Search and view customer contact information" },
      { permission: "customer.create", label: "Add customers" },
      { permission: "customer.edit", label: "Edit basic contact details" },
      { permission: "customer.ledger", label: "View complete customer ledgers and credit details" },
      { permission: "payment.create", label: "Record customer payments" },
    ],
  },
  {
    slug: "suppliers",
    title: "Suppliers",
    shortTitle: "Suppliers",
    description: "Maintain supplier details while restricting sensitive payable information.",
    access: ["supplier.view", "supplier.edit"],
    capabilities: [
      { permission: "supplier.view", label: "Search and select suppliers" },
      { permission: "supplier.edit", label: "Create and edit suppliers" },
      { permission: "supplier.financial", label: "View supplier payables and complete ledgers" },
    ],
  },
  {
    slug: "payments",
    title: "Payments",
    shortTitle: "Payments",
    description: "Record and review customer, COD and supplier payments without deleting history.",
    access: ["payment.view", "payment.create"],
    capabilities: [
      { permission: "payment.view", label: "Search payment history" },
      { permission: "payment.create", label: "Record customer, COD and supplier payments" },
      { permission: "payment.reverse", label: "Reverse incorrect payments through an audited correction" },
    ],
  },
  {
    slug: "expenses",
    title: "Expenses",
    shortTitle: "Expenses",
    description: "Record operating expenses and protect complete business expense analysis.",
    access: ["expense.view", "expense.create"],
    capabilities: [
      { permission: "expense.view", label: "Search and view expense records" },
      { permission: "expense.create", label: "Add expenses and receipts" },
      { permission: "expense.edit", label: "Correct old expenses with an audit trail" },
      { permission: "expense.report", label: "View complete expense trends and analysis" },
    ],
  },
  {
    slug: "gst",
    title: "GST",
    shortTitle: "GST",
    description: "Create compliant documents and restrict tax configuration and reports.",
    access: ["gst.sale", "gst.purchase", "gst.manage", "gst.report"],
    capabilities: [
      { permission: "gst.sale", label: "Generate GST sales invoices" },
      { permission: "gst.purchase", label: "Record GST purchases" },
      { permission: "gst.manage", label: "Configure GST rates and HSN/SAC" },
      { permission: "gst.report", label: "View input and output GST reports" },
    ],
  },
  {
    slug: "reports",
    title: "Reports",
    shortTitle: "Reports",
    description: "Permission-filtered operational, financial, tax and profitability reporting.",
    access: ["report.orders", "report.sales", "report.purchases", "report.inventory", "report.expenses", "report.gst", "report.financial", "report.profit"],
    capabilities: [
      { permission: "report.orders", label: "Order reports" },
      { permission: "report.sales", label: "Sales reports" },
      { permission: "report.purchases", label: "Purchase reports" },
      { permission: "report.inventory", label: "Inventory and stock-movement reports" },
      { permission: "report.expenses", label: "Expense reports" },
      { permission: "report.gst", label: "GST reports" },
      { permission: "report.financial", label: "Outstanding, payable and payment reports" },
      { permission: "report.profit", label: "Revenue, COGS, gross and net profit reports" },
    ],
  },
  {
    slug: "staff",
    title: "Staff & permissions",
    shortTitle: "Staff",
    description: "Create staff accounts, disable access and grant explicit capabilities.",
    access: ["staff.manage", "user.manage", "permission.manage"],
    capabilities: [
      { permission: "staff.manage", label: "Activate and deactivate staff" },
      { permission: "user.manage", label: "Create staff authentication accounts" },
      { permission: "permission.manage", label: "Grant and revoke granular permissions" },
    ],
  },
  {
    slug: "settings",
    title: "Business settings",
    shortTitle: "Settings",
    description: "Business identity, invoice, stock, COD, delivery and rounding configuration.",
    access: ["settings.manage"],
    capabilities: [{ permission: "settings.manage", label: "Manage protected business configuration" }],
  },
  {
    slug: "audit",
    title: "Audit history",
    shortTitle: "Audit",
    description: "Immutable staff, permission and business-change history.",
    access: ["audit.view"],
    capabilities: [{ permission: "audit.view", label: "Review actor, action and timestamp history" }],
  },
];

export function hasPermission(granted: ReadonlySet<string>, permission: PermissionCode, isOwner = false) {
  return isOwner || granted.has(permission);
}

export function canAccessModule(module: AdminModuleDefinition, granted: ReadonlySet<string>, isOwner = false) {
  return isOwner || module.access.some((permission) => granted.has(permission));
}

export function roleLabel(role: AppRole) {
  if (role === "owner") return "Admin / Owner";
  if (role === "customer") return "Customer";
  return "Staff";
}
