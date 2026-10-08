/** Secciones del panel que un rol puede dar o quitar. "Acceso completo" las tiene todas y además gestiona el equipo. */
export const PERMISSIONS = [
  "overview",
  "analytics",
  "orders",
  "abandoned",
  "discounts",
  "interested",
  "inventory",
  "products",
  "landing",
  "pos",
  "customers",
  "shipments",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** "any" = cualquier persona con al menos un permiso; "team" = solo acceso completo (gestión del equipo). */
export type Need = Permission | readonly Permission[] | "any" | "team";

export const SYSTEM_ROLE_ID = "role-admin";

/** Quién puede LEER cada conjunto de datos compartido que el panel carga de golpe (lo usan las rutas y el store). */
export const READ_ACCESS = {
  orders: ["orders", "overview", "customers", "shipments"],
  abandoned: ["abandoned"],
  customers: ["customers", "orders", "abandoned", "shipments", "overview"],
  discountCodes: ["discounts"],
} as const satisfies Record<string, readonly Permission[]>;

export interface AdminMe {
  id: string;
  name: string;
  email: string;
  roleName: string;
  fullAccess: boolean;
  permissions: Permission[];
}

export function isPermission(v: unknown): v is Permission {
  return typeof v === "string" && (PERMISSIONS as readonly string[]).includes(v);
}

export function hasAccess(me: Pick<AdminMe, "fullAccess" | "permissions"> | null, need: Need): boolean {
  if (!me) return false;
  if (need === "team") return me.fullAccess;
  if (me.fullAccess) return true;
  if (need === "any") return me.permissions.length > 0;
  const list: readonly Permission[] = typeof need === "string" ? [need] : need;
  return list.some((p) => me.permissions.includes(p));
}

/** Qué permiso pide cada pantalla del panel (la ruta ya viene sin el prefijo de idioma). */
export function pathNeed(path: string): Need | null {
  if (path === "/dashboard") return "overview";
  const m = path.match(/^\/dashboard\/([^/]+)(\/.+)?$/);
  if (!m) return null;
  const [, section, rest] = m;
  switch (section) {
    case "analiticas":
      return "analytics";
    case "ordenes":
      // el detalle de una orden se abre también desde Abandonados, Envíos y Clientes
      return rest ? ["orders", "abandoned", "shipments", "customers"] : "orders";
    case "abandonados":
      return "abandoned";
    case "descuentos":
      return "discounts";
    case "interesados":
      return "interested";
    case "inventario":
      return "inventory";
    case "productos":
      return "products";
    case "landing":
      return "landing";
    case "venta":
      return "pos";
    case "clientes":
      return "customers";
    case "envios":
      return "shipments";
    case "equipo":
      return "team";
    default:
      return null;
  }
}

/** Primera pantalla a la que la persona sí puede entrar (para mandarla ahí si abre una que no le toca). */
export function firstAllowedHref(me: Pick<AdminMe, "fullAccess" | "permissions">): string | null {
  const order: [Permission, string][] = [
    ["overview", "/dashboard"],
    ["orders", "/dashboard/ordenes"],
    ["shipments", "/dashboard/envios"],
    ["abandoned", "/dashboard/abandonados"],
    ["customers", "/dashboard/clientes"],
    ["inventory", "/dashboard/inventario"],
    ["products", "/dashboard/productos"],
    ["analytics", "/dashboard/analiticas"],
    ["discounts", "/dashboard/descuentos"],
    ["interested", "/dashboard/interesados"],
    ["landing", "/dashboard/landing"],
    ["pos", "/dashboard/venta"],
  ];
  return order.find(([p]) => hasAccess(me, p))?.[1] ?? null;
}
