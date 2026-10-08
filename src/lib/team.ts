import "server-only";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hashPassword } from "@/lib/password";
import { PERMISSIONS, SYSTEM_ROLE_ID, isPermission, type AdminMe, type Permission } from "@/lib/permissions";

/** Error de validación del equipo/roles: lleva el código HTTP que debe devolver la ruta. */
export class TeamError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export interface RoleDto {
  id: string;
  name: string;
  fullAccess: boolean;
  permissions: Permission[];
  isSystem: boolean;
  userCount: number;
}

export interface TeamUser {
  id: string;
  name: string;
  email: string;
  roleId: string | null;
  active: boolean;
  createdAt: string;
}

const cleanPermissions = (list: unknown): Permission[] => (Array.isArray(list) ? [...new Set(list.filter(isPermission))] : []);

/** Quién es y qué puede hacer esta persona, leído de la base en cada petición: así cambiar un rol o desactivar a alguien surte efecto al instante. */
export async function getAdminMe(userId: string): Promise<AdminMe | null> {
  const db = await getDb();
  const [row] = await db
    .select({ user: schema.adminUsers, role: schema.roles })
    .from(schema.adminUsers)
    .leftJoin(schema.roles, eq(schema.roles.id, schema.adminUsers.roleId))
    .where(eq(schema.adminUsers.id, userId));
  if (!row || !row.user.active || !row.role) return null;
  return {
    id: row.user.id,
    name: row.user.name,
    email: row.user.email,
    roleName: row.role.name,
    fullAccess: row.role.fullAccess,
    permissions: row.role.fullAccess ? [...PERMISSIONS] : cleanPermissions(row.role.permissions),
  };
}

export async function listRoles(): Promise<RoleDto[]> {
  const db = await getDb();
  const rows = await db.select().from(schema.roles).orderBy(asc(schema.roles.createdAt));
  const counts = await db.select({ roleId: schema.adminUsers.roleId, n: sql<number>`count(*)` }).from(schema.adminUsers).groupBy(schema.adminUsers.roleId);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    fullAccess: r.fullAccess,
    permissions: cleanPermissions(r.permissions),
    isSystem: r.isSystem,
    userCount: Number(counts.find((c) => c.roleId === r.id)?.n ?? 0),
  }));
}

function validateRoleInput(input: { name?: unknown; fullAccess?: unknown; permissions?: unknown }) {
  const name = typeof input.name === "string" ? input.name.trim().slice(0, 60) : "";
  if (!name) throw new TeamError("El rol necesita un nombre", 400);
  const fullAccess = input.fullAccess === true;
  const permissions = fullAccess ? [] : cleanPermissions(input.permissions);
  if (!fullAccess && permissions.length === 0) throw new TeamError("Elige al menos una sección o marca acceso completo", 400);
  return { name, fullAccess, permissions };
}

export async function createRole(input: { name?: unknown; fullAccess?: unknown; permissions?: unknown }): Promise<void> {
  const data = validateRoleInput(input);
  const db = await getDb();
  try {
    await db.insert(schema.roles).values({ id: `role-${crypto.randomUUID()}`, ...data });
  } catch {
    throw new TeamError("Ya existe un rol con ese nombre", 409);
  }
}

/** Cuántas personas activas con acceso completo hay, sin contar a `exceptUserId` ni a las de `exceptRoleId`. */
async function otherActiveFullAccess(opts: { exceptUserId?: string; exceptRoleId?: string }): Promise<number> {
  const db = await getDb();
  const conds = [eq(schema.adminUsers.active, true), eq(schema.roles.fullAccess, true)];
  if (opts.exceptUserId) conds.push(ne(schema.adminUsers.id, opts.exceptUserId));
  if (opts.exceptRoleId) conds.push(ne(schema.roles.id, opts.exceptRoleId));
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.adminUsers)
    .innerJoin(schema.roles, eq(schema.roles.id, schema.adminUsers.roleId))
    .where(and(...conds));
  return Number(row?.n ?? 0);
}

export async function updateRole(id: string, input: { name?: unknown; fullAccess?: unknown; permissions?: unknown }, actingUserId: string): Promise<void> {
  const db = await getDb();
  const [role] = await db.select().from(schema.roles).where(eq(schema.roles.id, id));
  if (!role) throw new TeamError("Rol no encontrado", 404);
  if (role.isSystem) throw new TeamError("El rol de Administrador es del sistema y no se puede modificar", 409);
  const data = validateRoleInput(input);

  if (role.fullAccess && !data.fullAccess) {
    const [me] = await db.select({ roleId: schema.adminUsers.roleId }).from(schema.adminUsers).where(eq(schema.adminUsers.id, actingUserId));
    if (me?.roleId === id) throw new TeamError("No puedes quitarle el acceso completo al rol que usas tú", 409);
    if ((await otherActiveFullAccess({ exceptRoleId: id })) === 0) throw new TeamError("Debe quedar al menos una persona con acceso completo", 409);
  }
  try {
    await db.update(schema.roles).set(data).where(eq(schema.roles.id, id));
  } catch {
    throw new TeamError("Ya existe un rol con ese nombre", 409);
  }
}

export async function deleteRole(id: string): Promise<void> {
  const db = await getDb();
  const [role] = await db.select().from(schema.roles).where(eq(schema.roles.id, id));
  if (!role) throw new TeamError("Rol no encontrado", 404);
  if (role.isSystem || id === SYSTEM_ROLE_ID) throw new TeamError("El rol de Administrador es del sistema y no se puede borrar", 409);
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(schema.adminUsers).where(eq(schema.adminUsers.roleId, id));
  if (Number(n) > 0) throw new TeamError(`Hay ${n} persona(s) con este rol: cámbialas a otro rol primero`, 409);
  await db.delete(schema.roles).where(eq(schema.roles.id, id));
}

export async function listTeam(): Promise<TeamUser[]> {
  const db = await getDb();
  const rows = await db.select().from(schema.adminUsers).orderBy(asc(schema.adminUsers.createdAt));
  return rows.map((u) => ({ id: u.id, name: u.name, email: u.email, roleId: u.roleId, active: u.active, createdAt: u.createdAt.toISOString() }));
}

async function requireRole(roleId: unknown): Promise<schema.RoleRow> {
  const db = await getDb();
  const [role] = typeof roleId === "string" ? await db.select().from(schema.roles).where(eq(schema.roles.id, roleId)) : [];
  if (!role) throw new TeamError("Elige un rol válido", 400);
  return role;
}

/** Agrega a una persona al equipo. No lleva contraseña: entra con el código que le llega por correo. */
export async function createTeamUser(input: { name?: unknown; email?: unknown; roleId?: unknown }): Promise<void> {
  const name = typeof input.name === "string" ? input.name.trim().slice(0, 80) : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase().slice(0, 254) : "";
  if (!name) throw new TeamError("El nombre es obligatorio", 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new TeamError("Correo inválido", 400);
  const role = await requireRole(input.roleId);
  const db = await getDb();
  try {
    await db.insert(schema.adminUsers).values({ id: `u-${crypto.randomUUID()}`, email, name, roleId: role.id, passwordHash: await hashPassword(crypto.randomUUID()) });
  } catch {
    throw new TeamError("Ya hay alguien del equipo con ese correo", 409);
  }
}

export async function updateTeamUser(id: string, input: { name?: unknown; roleId?: unknown; active?: unknown }, actingUserId: string): Promise<void> {
  const db = await getDb();
  const [target] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, id));
  if (!target) throw new TeamError("Persona no encontrada", 404);

  const patch: Partial<typeof schema.adminUsers.$inferInsert> = {};
  if (input.name !== undefined) {
    const name = typeof input.name === "string" ? input.name.trim().slice(0, 80) : "";
    if (!name) throw new TeamError("El nombre es obligatorio", 400);
    patch.name = name;
  }
  const nextRole = input.roleId !== undefined ? await requireRole(input.roleId) : null;
  if (nextRole) patch.roleId = nextRole.id;
  if (input.active !== undefined) patch.active = input.active === true;

  // Quitarle el acceso completo a alguien (cambiándole el rol o desactivándolo): nunca a uno mismo, y siempre debe quedar otra persona con acceso completo.
  const [currentRole] = target.roleId ? await db.select().from(schema.roles).where(eq(schema.roles.id, target.roleId)) : [];
  const wasFull = target.active && !!currentRole?.fullAccess;
  const willBeFull = (patch.active ?? target.active) && (nextRole ? nextRole.fullAccess : !!currentRole?.fullAccess);
  if (wasFull && !willBeFull) {
    if (id === actingUserId) throw new TeamError("No puedes quitarte tu propio acceso completo", 409);
    if ((await otherActiveFullAccess({ exceptUserId: id })) === 0) throw new TeamError("Debe quedar al menos una persona con acceso completo", 409);
  }
  if (Object.keys(patch).length > 0) await db.update(schema.adminUsers).set(patch).where(eq(schema.adminUsers.id, id));
}

/** Ids de las personas activas cuyo rol permite ver pedidos: solo a ellas les llega el aviso de pedido nuevo. */
export async function userIdsWithAccess(permission: Permission): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db
    .select({ id: schema.adminUsers.id, fullAccess: schema.roles.fullAccess, permissions: schema.roles.permissions })
    .from(schema.adminUsers)
    .innerJoin(schema.roles, eq(schema.roles.id, schema.adminUsers.roleId))
    .where(eq(schema.adminUsers.active, true));
  return new Set(rows.filter((r) => r.fullAccess || cleanPermissions(r.permissions).includes(permission)).map((r) => r.id));
}

/** Convierte un error de validación del equipo en su respuesta HTTP; cualquier otro error es un 500 genérico. */
export function teamErrorResponse(err: unknown): Response {
  if (err instanceof TeamError) return Response.json({ error: err.message }, { status: err.status });
  console.error("[team]", err);
  return Response.json({ error: "No se pudo guardar el cambio" }, { status: 500 });
}
