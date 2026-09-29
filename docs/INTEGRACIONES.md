# Integraciones: qué está hecho y qué falta

Todo el código de pagos, envíos, correos, base de datos y acceso al panel **ya está escrito y desplegado**.
Lo que falta es crear las cuentas y cargar las claves: en `.env.local` para desarrollo y con `wrangler secret put` en producción.
Ninguna de estas cuentas requiere LLC: se abren con nombre, correo y tarjeta.

Sin claves, todo funciona en modo simulado: Postgres embebido, pago confirmado al instante,
tarifas fijas de envío, guía manual y correos impresos en la consola del servidor.

---

## 0. Base de datos y hosting: Cloudflare

**Hecho:** la app corre en Cloudflare Workers (adaptador OpenNext) con base D1 (`ryvox-db`), caché de páginas en KV
y dominio ryvoxshop.com. Esquema en `src/db/schema.ts`, migraciones en `migrations/`, siembra automática.

Comandos:
- `npm run db:generate` tras cambiar el esquema → nueva migración.
- `npm run db:migrate:local` / `npm run db:migrate:remote` → aplicar en local / producción.
- `npm run deploy` → compilar y desplegar.
- `npx wrangler secret put NOMBRE` → cargar un secreto en producción (no hace falta redesplegar).
- `npx wrangler tail` → ver logs en vivo del Worker.

R2 está activo: bucket `ryvox-media` para fotos de producto (subida desde el editor del panel, servidas en `/media/...`).

Pendiente opcional en el panel de Cloudflare: **Images → Transformations** en la zona ryvoxshop.com para redimensionar fotos automáticamente (5.000 transformaciones/mes gratis).

---

## 1. Stripe (pagos)

**Hecho:**
- `POST /api/checkout` recalcula precios en el servidor, crea la orden y el PaymentIntent.
- Payment Element en `src/components/store/Checkout.tsx`: tarjeta, Apple Pay, Google Pay y Link.
- `POST /api/webhooks/stripe`: `payment_intent.succeeded` → orden pagada, stock descontado, correo; `charge.refunded` → orden cancelada y stock repuesto.

**Para activar:**
1. Cuenta en https://dashboard.stripe.com como *individual* (nombre, SSN, cuenta bancaria personal). Empieza en modo test.
2. Developers → API keys:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
3. Webhook. En local, con la CLI de Stripe:
   ```
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Te da el `whsec_...` → `STRIPE_WEBHOOK_SECRET=`. En producción, Developers → Webhooks → endpoint
   `https://ryvoxshop.com/api/webhooks/stripe` con los eventos `payment_intent.succeeded`,
   `payment_intent.payment_failed` y `charge.refunded`.
4. Tarjeta de prueba: `4242 4242 4242 4242`, cualquier fecha futura, cualquier CVC.
5. Apple Pay en producción: Settings → Payment methods → Apple Pay → verificar dominio.

**Pendiente opcional:** Stripe Tax (impuesto por estado). Hoy `tax = 0` en `src/app/api/checkout/route.ts`;
se activa añadiendo `automatic_tax` al PaymentIntent y activando Tax en el dashboard.

---

## 2. Shippo (tarifas, etiquetas, seguimiento)

**Hecho:**
- `POST /api/shipping/rates`: cotiza con la dirección del cliente y el peso/medidas de los productos. Sin clave, tarifas fijas (estándar $5.99, gratis desde $99; exprés $14.99).
- `POST /api/admin/orders/[id]/ship`: compra la etiqueta (PDF 4×6) con el nivel de servicio que pagó el cliente, guarda guía, enlace de seguimiento y PDF, y avisa al cliente. Con `carrier` + `tracking` en el cuerpo registra una guía manual.
- `POST /api/webhooks/shippo`: evento `track_updated` → actualiza el estado de la orden hasta "entregado".
- Peso y medidas por producto en el editor del panel (sección "Envío").
- Las guías registradas a mano también se dan de alta en Shippo, así el seguimiento automático funciona igual.
- Para probar el webhook sin enviar nada: en "Guía manual" usa transportista `shippo` y número `SHIPPO_TRANSIT` o `SHIPPO_DELIVERED`.

**Para activar:**
1. Cuenta en https://goshippo.com. Settings → API → copia el token de test.
2. `.env.local`:
   ```
   SHIPPO_API_KEY=shippo_test_...
   SHIP_FROM_NAME=Ryvox
   SHIP_FROM_STREET1=...        # tu taller
   SHIP_FROM_CITY=...
   SHIP_FROM_STATE=...
   SHIP_FROM_ZIP=...
   SHIP_FROM_COUNTRY=US
   SHIP_FROM_PHONE=...
   SHIP_FROM_EMAIL=...
   ```
   Sin dirección de origen no se cotiza: la app cae a tarifas fijas.
3. Webhook de seguimiento: Settings → API → Webhooks → URL
   `https://ryvoxshop.com/api/webhooks/shippo?token=UN_SECRETO`, evento *Track updated*,
   y en `.env.local` `SHIPPO_WEBHOOK_SECRET=UN_SECRETO`.
4. Etiquetas de test son gratis. En modo live se cobra por etiqueta (tarifas USPS con descuento incluidas; UPS/FedEx propios se conectan en Carriers).

**Impresión:** el botón "Imprimir etiqueta" de la orden abre el PDF 4×6. Con impresora térmica (Rollo, Zebra, MUNBYN)
configurada a 4×6 sale directo. Con impresora normal se imprime en hoja y se recorta. Para cambiar el formato
(ZPL, carta), edita `labelFileType` en `src/lib/shipping.ts`.

---

## 3. Resend (correos)

**Hecho:** confirmación de pedido y aviso de envío con guía (`src/lib/email.ts`). Sin clave, se imprimen en la consola.

**Para activar:**
1. Cuenta en https://resend.com (3.000 correos/mes gratis).
2. Verifica tu dominio (DNS) para enviar desde `pedidos@tudominio.com`. Sin dominio verificado solo puedes enviar a tu propio correo desde `onboarding@resend.dev`.
3. `.env.local`:
   ```
   RESEND_API_KEY=re_...
   EMAIL_FROM=RYVOX <pedidos@tudominio.com>
   ```

---

## 4. Acceso al panel

**Hecho:** login con correo y contraseña, sesión de 7 días en cookie httpOnly, `src/proxy.ts` protege `/dashboard` y `/api/admin`.

Usuario inicial: `ADMIN_EMAIL` / `ADMIN_PASSWORD` de `.env.local` (se crea al arrancar si no existe).
`AUTH_SECRET` debe ser largo y aleatorio en producción. Cambia la contraseña por defecto antes de desplegar.

---

## 5. Despliegue

Ya está en Cloudflare Workers con el dominio ryvoxshop.com. Cada cambio se publica con `npm run deploy`.
Las claves live se cargan con `wrangler secret put`; la publicable de Stripe en `.env.production`.

## Variables de entorno completas

Ver `.env.example`.

## Orden sugerido

1. Base y hosting: hechos (Cloudflare).
2. Stripe en test con la CLI para el webhook local. Probar una compra con 4242.
3. Shippo en test con tu dirección de origen. Probar "Marcar como enviada" → PDF.
4. Resend con dominio verificado.
5. Desplegar, cambiar claves a live, verificar Apple Pay.
