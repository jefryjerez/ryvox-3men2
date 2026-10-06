"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, ChevronRight, Mail, MapPin, Pencil, Phone } from "lucide-react";
import { useAdmin } from "@/store/admin";
import { orderTotal, type Customer, type Order } from "@/lib/orders";
import { Card, PageHeader, StatusBadge, td, th } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("");
}

function spent(orders: Order[]) {
  return orders.filter((o) => o.status !== "cancelado").reduce((s, o) => s + orderTotal(o), 0);
}

export function CustomersList() {
  const { t, f, money, shortDate } = useT();
  const c = t.dash.customers;
  const customers = useAdmin((s) => s.customers);
  const orders = useAdmin((s) => s.orders);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return customers
      .map((x) => {
        const own = orders.filter((o) => o.customerId === x.id);
        const last = [...own].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        return { c: x, count: own.length, total: spent(own), last };
      })
      .filter(({ c: x }) => !term || x.name.toLowerCase().includes(term) || x.email.toLowerCase().includes(term) || x.city.toLowerCase().includes(term))
      .sort((a, b) => b.total - a.total);
  }, [customers, orders, q]);

  return (
    <>
      <PageHeader title={c.title} subtitle={f(c.subtitle, { n: customers.length })} />
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={c.search} className="h-10 w-full rounded-full border border-line bg-white px-4 text-sm outline-none focus:border-black md:w-80" />

      <ul className="mt-4 space-y-2 md:hidden">
        {rows.map(({ c: x, count, total }) => (
          <li key={x.id}>
            <Link href={`/dashboard/clientes/${x.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">{initials(x.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{x.name}</p>
                <p className="truncate text-[11px] text-black/50">{x.city}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">{money(total)}</p>
                <p className="text-[11px] text-black/50">{f(c.orders, { n: count })}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Card className="mt-4 hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-line bg-mist/60">
              <tr>
                <th className={th}>{c.table.customer}</th>
                <th className={th}>{c.table.city}</th>
                <th className={th}>{c.table.orders}</th>
                <th className={th}>{c.table.spent}</th>
                <th className={th}>{c.table.last}</th>
                <th className={th}>{c.table.since}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ c: x, count, total, last }) => (
                <tr key={x.id} className="hover:bg-mist/50">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-[11px] font-semibold text-white">{initials(x.name)}</span>
                      <div className="min-w-0">
                        <Link href={`/dashboard/clientes/${x.id}`} className="block truncate font-medium hover:underline">
                          {x.name}
                        </Link>
                        <p className="text-[11px] text-black/50">{x.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`${td} text-black/70`}>{x.city}</td>
                  <td className={`${td} tabular-nums`}>{count}</td>
                  <td className={`${td} font-medium tabular-nums`}>{money(total)}</td>
                  <td className={`${td} text-black/60`}>{last ? shortDate(last.createdAt) : "—"}</td>
                  <td className={`${td} text-black/60`}>{new Date(x.createdAt).getFullYear()}</td>
                  <td className={`${td} text-right`}>
                    <Link href={`/dashboard/clientes/${x.id}`} aria-label={f(c.view, { name: x.name })} className="inline-flex text-black/40 hover:text-black">
                      <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

const input = "h-10 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-black";

/** Datos de contacto del cliente, con modo de edición (p. ej. para corregir un correo o teléfono mal escritos). */
function CustomerInfoCard({ customer, total, count }: { customer: Customer; total: number; count: number }) {
  const { t, f, money } = useT();
  const c = t.dash.customers;
  const updateCustomer = useAdmin((s) => s.updateCustomer);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", phone: "", city: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setDraft({ name: customer.name, email: customer.email, phone: customer.phone, city: customer.city, note: customer.note ?? "" });
    setError(null);
    setEditing(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await updateCustomer(customer.id, draft);
    setBusy(false);
    if (res.ok) setEditing(false);
    else setError(res.error);
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-base font-semibold text-white">{initials(customer.name)}</span>
        <div className="min-w-0 flex-1">
          <p className="display text-2xl tabular-nums">{money(total)}</p>
          <p className="text-xs text-black/50">{f(c.spent, { n: count })}</p>
        </div>
        {!editing && (
          <button type="button" onClick={startEdit} aria-label={t.common.edit} className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5">
            <Pencil size={15} />
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} className="mt-5 space-y-3 border-t border-line pt-4">
          {(["name", "email", "phone", "city"] as const).map((k) => (
            <label key={k} className="block">
              <span className="mb-1 block text-xs font-medium text-black/60">{c.fields[k]}</span>
              <input value={draft[k]} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))} type={k === "email" ? "email" : "text"} required={k === "name" || k === "email"} className={input} />
            </label>
          ))}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-black/60">{c.fields.note}</span>
            <textarea value={draft.note} onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))} rows={2} className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-black" />
          </label>
          <p className="text-[11px] leading-relaxed text-black/50">{c.editHint}</p>
          {error && <p className="text-sm font-medium text-alert">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? t.common.saving : t.common.save}
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
              {t.common.cancel}
            </Button>
          </div>
        </form>
      ) : (
        <>
          <ul className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm">
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-black/40" /> {customer.email}
            </li>
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-black/40" /> {customer.phone}
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={14} className="text-black/40" /> {customer.city}
            </li>
          </ul>
          {customer.note && <p className="mt-4 rounded-xl bg-mist p-3 text-xs leading-relaxed">{customer.note}</p>}
        </>
      )}
    </Card>
  );
}

export function CustomerDetail({ id }: { id: string }) {
  const { t, f, money, shortDate, longDate } = useT();
  const c = t.dash.customers;
  const customer = useAdmin((s) => s.customers.find((x) => x.id === id));
  const orders = useAdmin((s) => s.orders);
  const products = useAdmin((s) => s.products);
  const loaded = useAdmin((s) => s.loaded);

  if (!customer) {
    return (
      <div className="py-20 text-center text-sm text-black/55">
        {loaded ? (
          <>
            {c.notFound}{" "}
            <Link href="/dashboard/clientes" className="underline">
              {t.common.back}
            </Link>
          </>
        ) : (
          t.common.loading
        )}
      </div>
    );
  }

  const own = orders.filter((o) => o.customerId === customer.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const total = spent(own);
  const counts = new Map<string, number>();
  own.forEach((o) => o.items.forEach((i) => counts.set(i.productId, (counts.get(i.productId) ?? 0) + i.qty)));
  const favorite = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const favProduct = favorite && products.find((p) => p.id === favorite[0]);

  return (
    <>
      <Link href="/dashboard/clientes" className="mb-4 inline-flex items-center gap-1 text-sm text-black/60 hover:text-black">
        <ArrowLeft size={16} /> {c.back}
      </Link>
      <PageHeader title={customer.name} subtitle={f(c.customerSince, { date: longDate(customer.createdAt).split(",")[0] })} />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4">
          <CustomerInfoCard customer={customer} total={total} count={own.length} />
          {favProduct && (
            <Card className="p-5">
              <p className="text-[11px] uppercase tracking-wider text-black/45">{c.favorite}</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="relative h-12 w-12 overflow-hidden rounded-xl bg-mist">
                  <Image src={favProduct.image} alt="" fill sizes="48px" className="object-contain" />
                </span>
                <div>
                  <p className="text-sm font-medium">{favProduct.name}</p>
                  <p className="text-[11px] text-black/50">{f(c.units, { n: favorite[1] })}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <Card className="overflow-hidden xl:col-span-2">
          <div className="px-5 pt-5">
            <h2 className="text-[15px] font-semibold tracking-tight">{c.history}</h2>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {own.map((o) => {
              const first = o.items[0];
              const img = products.find((p) => p.id === first?.productId)?.image;
              return (
                <li key={o.id}>
                  <Link href={`/dashboard/ordenes/${o.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-mist/50">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-mist">{img && <Image src={img} alt="" fill sizes="48px" className="object-contain" />}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium tabular-nums">
                        {o.number} <span className="font-normal text-black/50">· {shortDate(o.createdAt)}</span>
                      </p>
                      <p className="truncate text-xs text-black/55">
                        {first?.name}
                        {o.items.length > 1 && ` +${o.items.length - 1}`}
                      </p>
                    </div>
                    <StatusBadge status={o.status} />
                    <p className="w-20 text-right text-sm font-semibold tabular-nums">{money(orderTotal(o))}</p>
                  </Link>
                </li>
              );
            })}
            {own.length === 0 && <li className="px-5 py-8 text-sm text-black/50">{c.noOrders}</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
