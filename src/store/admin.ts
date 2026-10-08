"use client";

import { create } from "zustand";
import type { Product } from "@/lib/products";
import type { Address, Order, OrderStatus, Customer, DiscountCode } from "@/lib/orders";
import { hasAccess, READ_ACCESS, type AdminMe } from "@/lib/permissions";

type Result = { ok: true } | { ok: false; error: string };

interface AdminState {
  products: Product[];
  orders: Order[];
  /** Órdenes creadas pero nunca pagadas: el cliente se fue antes de terminar. */
  abandoned: Order[];
  customers: Customer[];
  discountCodes: DiscountCode[];
  /** Quién es la persona con sesión y qué secciones puede usar (null mientras se carga). */
  me: AdminMe | null;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  toggleProductActive: (id: string) => Promise<Result>;
  upsertProduct: (product: Product) => Promise<Result & { product?: Product }>;
  adjustStock: (id: string, delta: number) => Promise<Result>;
  setOrderStatus: (id: string, status: OrderStatus) => Promise<Result>;
  markShipped: (id: string, input: { carrier: string; tracking: string } | { auto: true }) => Promise<Result>;
  refreshLabel: (id: string) => Promise<Result>;
  updateCustomer: (id: string, patch: { name: string; email: string; phone: string; city: string; note: string }) => Promise<Result>;
  editOrderContact: (id: string, patch: { email: string; shippingAddress: Address }) => Promise<Result>;
  createDiscountCode: (input: { code: string; percentOff: number; note?: string }) => Promise<Result>;
  toggleDiscountCodeActive: (id: string) => Promise<Result>;
  sendAbandonedOffer: (orderId: string, percentOff: number) => Promise<Result>;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (res.status === 401) {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    throw new Error("Sesión caducada");
  }
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data;
}

function fail(err: unknown): Result {
  return { ok: false, error: (err as Error).message };
}

/** Estado del panel: se carga de la API y cada acción llama al servidor. */
export const useAdmin = create<AdminState>()((set, get) => ({
  products: [],
  orders: [],
  abandoned: [],
  customers: [],
  discountCodes: [],
  me: null,
  loaded: false,
  loading: false,
  error: null,

  load: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      // Primero se sabe quién es y qué le toca; solo se pide lo que su rol permite leer (el servidor lo vuelve a exigir).
      const { me } = await api<{ me: AdminMe }>("/api/admin/me");
      const none = <T,>(value: T) => Promise.resolve(value);
      const [p, o, a, c, d] = await Promise.all([
        api<{ products: Product[] }>("/api/admin/products"),
        hasAccess(me, READ_ACCESS.orders) ? api<{ orders: Order[] }>("/api/admin/orders") : none({ orders: [] as Order[] }),
        hasAccess(me, READ_ACCESS.abandoned) ? api<{ orders: Order[] }>("/api/admin/orders?abandoned=1") : none({ orders: [] as Order[] }),
        hasAccess(me, READ_ACCESS.customers) ? api<{ customers: Customer[] }>("/api/admin/customers") : none({ customers: [] as Customer[] }),
        hasAccess(me, READ_ACCESS.discountCodes) ? api<{ codes: DiscountCode[] }>("/api/admin/discount-codes") : none({ codes: [] as DiscountCode[] }),
      ]);
      set({ me, products: p.products, orders: o.orders, abandoned: a.orders, customers: c.customers, discountCodes: d.codes, loaded: true, loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  toggleProductActive: async (id) => {
    const current = get().products.find((p) => p.id === id);
    if (!current) return { ok: false, error: "Producto no encontrado" };
    set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, active: !p.active } : p)) }));
    try {
      const { product } = await api<{ product: Product }>(`/api/admin/products/${id}`, { method: "PATCH", body: JSON.stringify({ active: !current.active }) });
      set((s) => ({ products: s.products.map((p) => (p.id === id ? product : p)) }));
      return { ok: true };
    } catch (err) {
      set((s) => ({ products: s.products.map((p) => (p.id === id ? current : p)) }));
      return fail(err);
    }
  },

  upsertProduct: async (product) => {
    const exists = get().products.some((p) => p.id === product.id);
    try {
      const { product: saved } = exists
        ? await api<{ product: Product }>(`/api/admin/products/${product.id}`, { method: "PATCH", body: JSON.stringify(product) })
        : await api<{ product: Product }>("/api/admin/products", { method: "POST", body: JSON.stringify(product) });
      set((s) => ({ products: exists ? s.products.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...s.products] }));
      return { ok: true, product: saved };
    } catch (err) {
      return fail(err);
    }
  },

  adjustStock: async (id, delta) => {
    set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p)) }));
    try {
      const { product } = await api<{ product: Product }>(`/api/admin/products/${id}`, { method: "PATCH", body: JSON.stringify({ stockDelta: delta }) });
      set((s) => ({ products: s.products.map((p) => (p.id === id ? product : p)) }));
      return { ok: true };
    } catch (err) {
      void get().load();
      return fail(err);
    }
  },

  setOrderStatus: async (id, status) => {
    const prev = get().orders.find((o) => o.id === id);
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) }));
    try {
      const { order } = await api<{ order: Order }>(`/api/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      set((s) => ({ orders: s.orders.map((o) => (o.id === id ? order : o)) }));
      if (status === "cancelado") void get().load(); // el inventario cambió
      return { ok: true };
    } catch (err) {
      if (prev) set((s) => ({ orders: s.orders.map((o) => (o.id === id ? prev : o)) }));
      return fail(err);
    }
  },

  markShipped: async (id, input) => {
    try {
      const body = "auto" in input ? {} : input;
      const { order } = await api<{ order: Order }>(`/api/admin/orders/${id}/ship`, { method: "POST", body: JSON.stringify(body) });
      set((s) => ({ orders: s.orders.map((o) => (o.id === id ? order : o)) }));
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  },

  refreshLabel: async (id) => {
    try {
      const { order } = await api<{ order: Order }>(`/api/admin/orders/${id}/label`, { method: "POST" });
      set((s) => ({ orders: s.orders.map((o) => (o.id === id ? order : o)) }));
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  },

  updateCustomer: async (id, patch) => {
    try {
      const { customer } = await api<{ customer: Customer }>(`/api/admin/customers/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      set((s) => ({ customers: s.customers.map((c) => (c.id === id ? customer : c)) }));
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  },

  editOrderContact: async (id, patch) => {
    try {
      const { order } = await api<{ order: Order }>(`/api/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      set((s) => ({ orders: s.orders.map((o) => (o.id === id ? order : o)), abandoned: s.abandoned.map((o) => (o.id === id ? order : o)) }));
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  },

  createDiscountCode: async (input) => {
    try {
      const { code } = await api<{ code: DiscountCode }>("/api/admin/discount-codes", { method: "POST", body: JSON.stringify(input) });
      set((s) => ({ discountCodes: [code, ...s.discountCodes] }));
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  },

  toggleDiscountCodeActive: async (id) => {
    const current = get().discountCodes.find((d) => d.id === id);
    if (!current) return { ok: false, error: "Código no encontrado" };
    set((s) => ({ discountCodes: s.discountCodes.map((d) => (d.id === id ? { ...d, active: !d.active } : d)) }));
    try {
      const { code } = await api<{ code: DiscountCode }>(`/api/admin/discount-codes/${id}`, { method: "PATCH", body: JSON.stringify({ active: !current.active }) });
      set((s) => ({ discountCodes: s.discountCodes.map((d) => (d.id === id ? code : d)) }));
      return { ok: true };
    } catch (err) {
      set((s) => ({ discountCodes: s.discountCodes.map((d) => (d.id === id ? current : d)) }));
      return fail(err);
    }
  },

  sendAbandonedOffer: async (orderId, percentOff) => {
    try {
      const { code } = await api<{ code: DiscountCode }>(`/api/admin/orders/${orderId}/discount-email`, { method: "POST", body: JSON.stringify({ percentOff }) });
      set((s) => ({ discountCodes: [code, ...s.discountCodes] }));
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  },
}));

export function isLowStock(p: Product) {
  return p.stock <= p.lowStockAt;
}
