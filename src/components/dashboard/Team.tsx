"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Card, PageHeader, Pill } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import type { RoleDto, TeamUser } from "@/lib/team";
import { useAdmin } from "@/store/admin";
import { useT } from "@/i18n/client";

const input = "h-10 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-black";

interface RoleDraft {
  id: string | null;
  name: string;
  fullAccess: boolean;
  permissions: Permission[];
}
const emptyDraft: RoleDraft = { id: null, name: "", fullAccess: false, permissions: [] };

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data;
}

/** Roles (acceso completo o secciones elegidas) y personas del equipo con su rol. Solo lo ve quien tiene acceso completo. */
export function Team() {
  const { t, f } = useT();
  const d = t.dash.team;
  const me = useAdmin((s) => s.me);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [draft, setDraft] = useState<RoleDraft | null>(null);
  const [person, setPerson] = useState({ name: "", email: "", roleId: "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [r, u] = await Promise.all([call<{ roles: RoleDto[] }>("/api/admin/roles"), call<{ users: TeamUser[] }>("/api/admin/users")]);
        if (cancelled) return;
        setRoles(r.roles);
        setUsers(u.users);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Ejecuta un cambio; el servidor devuelve las listas ya actualizadas. */
  async function run(fn: () => Promise<{ roles?: RoleDto[]; users?: TeamUser[] }>): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const data = await fn();
      if (data.roles) setRoles(data.roles);
      if (data.users) setUsers(data.users);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveRole(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const body = JSON.stringify({ name: draft.name, fullAccess: draft.fullAccess, permissions: draft.permissions });
    const ok = await run(() => (draft.id ? call(`/api/admin/roles/${draft.id}`, { method: "PATCH", body }) : call("/api/admin/roles", { method: "POST", body })));
    if (ok) setDraft(null);
  }

  async function removeRole(role: RoleDto) {
    if (!window.confirm(f(d.deleteRoleConfirm, { name: role.name }))) return;
    await run(() => call(`/api/admin/roles/${role.id}`, { method: "DELETE" }));
  }

  async function addPerson(e: FormEvent) {
    e.preventDefault();
    const ok = await run(() => call("/api/admin/users", { method: "POST", body: JSON.stringify(person) }));
    if (ok) setPerson((p) => ({ ...p, name: "", email: "" }));
  }

  const patchUser = (id: string, body: Record<string, unknown>) => run(() => call(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }));
  const roleName = (id: string | null) => roles.find((r) => r.id === id)?.name ?? d.noRole;
  const togglePermission = (p: Permission) =>
    setDraft((cur) => (cur ? { ...cur, permissions: cur.permissions.includes(p) ? cur.permissions.filter((x) => x !== p) : [...cur.permissions, p] } : cur));

  return (
    <>
      <PageHeader title={d.title} subtitle={d.subtitle} />
      {error && <p className="mb-4 rounded-2xl border border-alert/40 bg-white px-4 py-3 text-sm font-medium text-alert">{error}</p>}

      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight">{d.rolesTitle}</h2>
          {!draft && (
            <Button size="sm" onClick={() => setDraft(emptyDraft)}>
              <Plus size={14} /> {d.newRole}
            </Button>
          )}
        </div>

        {draft && (
          <form onSubmit={saveRole} className="mt-4 space-y-4 rounded-2xl border border-line p-4">
            <p className="text-sm font-semibold">{draft.id ? d.editRole : d.newRole}</p>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-black/60">{d.roleName}</span>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={d.roleNamePlaceholder} required maxLength={60} className={input} />
            </label>
            <label className="flex items-start gap-3 rounded-xl bg-mist p-3">
              <input type="checkbox" checked={draft.fullAccess} onChange={(e) => setDraft({ ...draft, fullAccess: e.target.checked })} className="mt-0.5 h-4 w-4 accent-black" />
              <span>
                <span className="block text-sm font-medium">{d.fullAccess}</span>
                <span className="block text-xs text-black/55">{d.fullAccessHint}</span>
              </span>
            </label>
            <fieldset disabled={draft.fullAccess} className={draft.fullAccess ? "opacity-40" : ""}>
              <legend className="mb-2 text-xs font-medium text-black/60">{d.sections}</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {PERMISSIONS.map((p) => (
                  <label key={p} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm">
                    <input type="checkbox" checked={draft.fullAccess || draft.permissions.includes(p)} onChange={() => togglePermission(p)} className="h-4 w-4 accent-black" />
                    {t.dash.nav[p]}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={busy}>
                {draft.id ? d.saveRole : d.createRole}
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setDraft(null)}>
                {t.common.cancel}
              </Button>
            </div>
          </form>
        )}

        <ul className="mt-4 divide-y divide-line">
          {roles.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {r.fullAccess && <ShieldCheck size={15} />} {r.name}
                  {r.isSystem && <Pill tone="muted">{d.systemRole}</Pill>}
                </p>
                <p className="mt-0.5 text-xs text-black/55">
                  {r.fullAccess ? d.allSections : r.permissions.map((p) => t.dash.nav[p]).join(" · ")} — {f(d.people, { n: r.userCount })}
                </p>
              </div>
              {!r.isSystem && (
                <div className="flex items-center gap-1">
                  <button type="button" aria-label={t.common.edit} onClick={() => setDraft({ id: r.id, name: r.name, fullAccess: r.fullAccess, permissions: r.permissions })} className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5">
                    <Pencil size={15} />
                  </button>
                  <button type="button" aria-label={d.deleteRole} disabled={busy} onClick={() => removeRole(r)} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-alert hover:bg-black/5 disabled:opacity-40">
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-4 p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold tracking-tight">{d.usersTitle}</h2>

        <ul className="mt-3 divide-y divide-line">
          {users.map((u) => {
            const self = u.id === me?.id;
            return (
              <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {u.name} {self && <span className="font-normal text-black/45">{d.you}</span>}
                  </p>
                  <p className="truncate text-xs text-black/55">{u.email}</p>
                </div>
                <select
                  aria-label={d.role}
                  value={u.roleId ?? ""}
                  disabled={busy || self}
                  onChange={(e) => patchUser(u.id, { roleId: e.target.value })}
                  className="h-9 rounded-full border border-line bg-white px-3 text-[13px] outline-none focus:border-black disabled:opacity-50"
                >
                  {!u.roleId && <option value="">{roleName(null)}</option>}
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busy || self}
                  onClick={() => patchUser(u.id, { active: !u.active })}
                  className="rounded-full bg-mist px-3 py-1.5 text-xs font-medium text-black/70 hover:text-black disabled:opacity-40"
                >
                  {u.active ? d.deactivate : d.activate}
                </button>
                {!u.active && <Pill tone="muted">{d.inactive}</Pill>}
              </li>
            );
          })}
          {users.length === 0 && <li className="py-6 text-center text-sm text-black/50">{d.none}</li>}
        </ul>

        <form onSubmit={addPerson} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <label>
            <span className="mb-1 block text-xs font-medium text-black/60">{d.name}</span>
            <input value={person.name} onChange={(e) => setPerson({ ...person, name: e.target.value })} required className={input} />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-black/60">{d.email}</span>
            <input type="email" value={person.email} onChange={(e) => setPerson({ ...person, email: e.target.value })} required className={input} />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-black/60">{d.role}</span>
            <select value={person.roleId} onChange={(e) => setPerson({ ...person, roleId: e.target.value })} required className={input}>
              <option value="" disabled>
                —
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? d.adding : d.add}
          </Button>
        </form>
        <p className="mt-3 text-[11px] leading-relaxed text-black/50">{d.loginHint}</p>
      </Card>
    </>
  );
}
