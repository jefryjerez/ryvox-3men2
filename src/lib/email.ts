import "server-only";
import { Resend } from "resend";
import type { Order } from "@/lib/orders";
import { orderTotal } from "@/lib/orders";
import { money } from "@/lib/format";
import { fill, getDictionary } from "@/i18n/config";

/* Se leen en cada envío: en Cloudflare Workers las variables no existen al cargar el módulo. */
const cfg = () => ({
  site: process.env.NEXT_PUBLIC_SITE_URL || "https://ryvoxshop.com",
  from: process.env.EMAIL_FROM || "RYVOX <shopping@ryvoxshop.com>",
  replyTo: process.env.EMAIL_REPLY_TO || "info@ryvoxshop.com",
});

async function send(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.log(`[email simulado] para: ${to} · asunto: ${subject}`);
    return;
  }
  try {
    const { from, replyTo } = cfg();
    await new Resend(key).emails.send({ from, to, subject, html, replyTo });
  } catch (err) {
    console.error("[resend]", err);
  }
}

function layout(title: string, body: string) {
  const { site } = cfg();
  // El logo (PNG con transparencia) se veía en blanco solo en la app de Gmail en Android/iOS: su modo
  // oscuro "adapta" imágenes con transparencia y a veces invierte el fondo negro de la caja del logo sin
  // tocar el PNG blanco de encima, dejando blanco sobre blanco. Las dos meta de "color-scheme" le piden a
  // Gmail/Outlook/Apple Mail que no reprocesen el correo en oscuro, y el atributo bgcolor (además del
  // style) es el que de verdad respeta el modo oscuro de Gmail para forzar el fondo negro de esa caja.
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head><body style="margin:0;background:#e8e8e8;font-family:Inter,Arial,sans-serif;color:#000">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div bgcolor="#000000" style="background:#000000;border-radius:20px;padding:22px 26px"><img src="${site}/brand/ryvox-logo-white.png" alt="RYVOX" width="120" height="32" style="display:block;width:120px;height:32px"></div>
    <div style="background:#fff;border-radius:20px;padding:28px 26px;margin-top:12px">
      <h1 style="font-size:22px;margin:0 0 12px;letter-spacing:-0.02em">${title}</h1>
      ${body}
    </div>
    <p style="font-size:11px;color:#8a8a8a;margin:18px 4px 0">RYVOX · Build to evolve</p>
  </div></body></html>`;
}

function itemsTable(order: Order) {
  const lang = order.lang ?? "es";
  const t = getDictionary(lang).email;
  const rows = order.items
    .map((i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #e8e8e8">${i.name ?? i.productId} × ${i.qty}</td><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;text-align:right">${money(i.price * i.qty, "USD", lang)}</td></tr>`)
    .join("");
  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = order.tax ?? 0;
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
    <tr><td style="padding:8px 0;color:#8a8a8a">${t.shipping}</td><td style="text-align:right">${order.shippingCost === 0 ? t.free : money(order.shippingCost, "USD", lang)}</td></tr>
    ${tax > 0 ? `<tr><td style="padding:8px 0;color:#8a8a8a">${t.tax}</td><td style="text-align:right">${money(tax, "USD", lang)}</td></tr>` : ""}
    <tr><td style="padding:8px 0;font-weight:600">${t.total}</td><td style="text-align:right;font-weight:600">${money(subtotal + order.shippingCost + tax, "USD", lang)}</td></tr></table>`;
}

/** Código de acceso al panel (verificación en dos pasos, sin contraseña). Se registra en consola cuando Resend no está configurado, para poder probarlo en local. */
export async function sendLoginCode(email: string, code: string, lang: "es" | "en" = "es") {
  const t = getDictionary(lang).login;
  const digits = code.split("").join(" ");
  await send(
    email,
    fill(t.emailSubject, { code }),
    layout(
      t.emailTitle,
      `<p style="font-size:14px;color:#404040">${t.emailText}</p>
       <p style="margin:22px 0;text-align:center"><span style="display:inline-block;background:#f2f2f2;border-radius:14px;padding:16px 22px;font-size:28px;font-weight:700;letter-spacing:0.12em">${digits}</span></p>
       <p style="font-size:12px;color:#8a8a8a">${t.emailExpires}</p>
       <p style="font-size:12px;color:#8a8a8a;margin-top:14px">${t.emailIgnore}</p>`,
    ),
  );
}

/** Aviso al negocio de que entró un pedido pagado. Siempre en español: es correo interno, no del cliente. */
export async function sendAdminNewOrder(order: Order) {
  const to = process.env.ADMIN_EMAIL?.trim();
  if (!to) return;
  const a = order.shippingAddress;
  const rows = order.items
    .map((i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #e8e8e8">${i.name ?? i.productId} × ${i.qty}</td><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;text-align:right">${money(i.price * i.qty)}</td></tr>`)
    .join("");
  const { site } = cfg();
  await send(
    to,
    order.isGift ? `Regalo registrado ${order.number}` : `Nuevo pedido ${order.number} · ${money(orderTotal(order))}`,
    layout(
      order.isGift ? `Regalo ${order.number}` : `Nuevo pedido ${order.number}`,
      `<p style="font-size:14px;color:#404040">${a.name} · ${order.email ?? ""}</p>
       <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:10px">${rows}
         ${order.isGift ? "" : `<tr><td style="padding:8px 0;font-weight:600">Total</td><td style="text-align:right;font-weight:600">${money(orderTotal(order))}</td></tr>`}</table>
       <p style="font-size:13px;color:#404040;margin-top:18px"><strong>Envío a</strong><br>${a.name}<br>${a.line1}<br>${a.city}, ${a.region} ${a.zip}</p>
       <p style="margin:22px 0"><a href="${site}/dashboard/ordenes/${order.id}" style="background:#000;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;display:inline-block">Ver en el panel</a></p>`,
    ),
  );
}

export async function sendOrderConfirmation(order: Order) {
  if (!order.email) return;
  const t = getDictionary(order.lang ?? "es").email;
  const a = order.shippingAddress;
  await send(
    order.email,
    fill(t.confirmedSubject, { n: order.number }),
    layout(
      fill(t.thanks, { name: a.name.split(" ")[0] }),
      `<p style="font-size:14px;color:#404040">${fill(t.confirmedText, { n: order.number })}</p>
       ${itemsTable(order)}
       <p style="font-size:13px;color:#404040;margin-top:18px"><strong>${t.shipTo}</strong><br>${a.name}<br>${a.line1}<br>${a.city}, ${a.region} ${a.zip}</p>`,
    ),
  );
}

/** Oferta con código de descuento para un carrito abandonado (plantilla elegida desde el panel). */
export async function sendAbandonedCartOffer(order: Order, code: string, percentOff: number) {
  if (!order.email) return;
  const t = getDictionary(order.lang ?? "es").email;
  const { site } = cfg();
  const name = order.shippingAddress.name.split(" ")[0];
  await send(
    order.email,
    fill(t.abandonedOfferSubject, { percent: String(percentOff) }),
    layout(
      fill(t.abandonedOfferTitle, { name }),
      `<p style="font-size:14px;color:#404040">${fill(t.abandonedOfferText, { percent: String(percentOff) })}</p>
       <p style="margin:22px 0;text-align:center">
         <span style="display:block;font-size:11px;color:#8a8a8a;margin-bottom:6px">${t.abandonedOfferCodeLabel}</span>
         <span style="display:inline-block;background:#f2f2f2;border-radius:14px;padding:14px 26px;font-size:22px;font-weight:700;letter-spacing:0.08em">${code}</span>
       </p>
       <p style="text-align:center"><a href="${site}/${order.lang ?? "es"}/productos" style="background:#000;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;display:inline-block">${t.abandonedOfferButton}</a></p>`,
    ),
  );
}

export async function sendOrderShipped(order: Order) {
  if (!order.email || !order.tracking) return;
  const t = getDictionary(order.lang ?? "es").email;
  const link =
    order.trackingUrl ??
    `${cfg().site}/seguimiento/${encodeURIComponent(order.number.replace("#", ""))}?t=${encodeURIComponent(order.trackingToken ?? "")}`;
  const subject = order.isGift ? t.giftShippedSubject : fill(t.shippedSubject, { n: order.number });
  const title = order.isGift ? t.giftOnItsWay : t.onItsWay;
  const text = order.isGift
    ? fill(t.giftShippedText, { carrier: order.carrier ?? "", tracking: order.tracking })
    : fill(t.shippedText, { carrier: order.carrier ?? "", tracking: order.tracking });
  await send(
    order.email,
    subject,
    layout(
      title,
      `<p style="font-size:14px;color:#404040">${text}</p>
       <p style="margin:22px 0"><a href="${link}" style="background:#000;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;display:inline-block">${t.trackButton}</a></p>`,
    ),
  );
}
