# RYVOX · Landing + Ecommerce + Panel

Tienda y panel de administración para Ryvox, herramientas y accesorios para barberos.

Estado: **diseño completo, backend funcionando y desplegado en Cloudflare** (Workers + D1 + KV) en https://ryvoxshop.com. Pagos (Stripe),
envíos (Shippo) y correos (Resend) están programados y se activan al pegar las claves en `.env.local`.
Sin claves, la tienda funciona en modo simulado de punta a punta.

## Arrancar

```bash
npm install
npm run dev
```

- Tienda: http://localhost:3000
- Panel: http://localhost:3000/dashboard (usuario y contraseña en `.env.local`: `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

La base local es D1 de Wrangler (SQLite en `.wrangler/state`). Antes del primer arranque: `npm run db:migrate:local`.
La primera petición carga el catálogo inicial (`src/lib/products.ts`) y el usuario admin; no crea clientes ni órdenes.
Para vaciar clientes, órdenes y productos (el catálogo se vuelve a cargar solo): `npm run db:reset:local` o, en producción, `npm run db:reset:remote` y desplegar.

Comandos:

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Producción |
| `npm run lint` | ESLint |
| `npm run db:generate` | Genera una migración SQL en `./drizzle` tras cambiar `src/db/schema.ts` |
| `npm run db:migrate:local` / `db:migrate:remote` | Aplica las migraciones a la D1 local / de producción |
| `npm run preview` | Compila con OpenNext y sirve la versión Workers en local |
| `npm run deploy` | Compila con OpenNext, despliega a Cloudflare (ryvoxshop.com) y rellena la caché KV. Parar antes `npm run dev`: el servidor de desarrollo bloquea la carpeta `.open-next` en Windows. Si falla el último paso (`kv bulk put` es inestable en Windows), repetir solo `npm run cache:populate` |
| `npm run cf:types` | Regenera los tipos de los bindings tras cambiar wrangler.jsonc |
| `npm run db:studio` | Explorador visual de la base |

## Stack

| Paquete | Uso |
|---|---|
| Next.js 16 + React 19 + TypeScript | Rutas, HTML estático, API (Route Handlers), imágenes y fuentes |
| Tailwind CSS 4 | Tokens de la paleta en `src/app/globals.css` |
| three + @react-three/fiber + @react-three/drei | 3D del hero y de productos destacados |
| motion | Transiciones, revelado al hacer scroll, menús |
| lenis | Scroll suave (solo escritorio con ratón) |
| zustand | Carrito (persistido en el teléfono) y estado del panel |
| lucide-react | Iconos |
| recharts | Gráfica de ventas del panel |
| drizzle-orm (D1) | Base de datos Cloudflare D1 (SQLite), local y producción con el mismo esquema |
| @opennextjs/cloudflare + wrangler | Despliegue de Next en Cloudflare Workers, D1, KV, secretos |
| stripe + @stripe/react-stripe-js | Pagos con Payment Element (tarjeta, Apple Pay, Google Pay, Link) |
| shippo | Tarifas reales, compra de etiquetas y seguimiento |
| resend | Correos de confirmación y envío |
| jose | Sesión del panel (JWT firmado en cookie httpOnly) |
| sharp | Imágenes provisionales y compresión en producción |

## Paleta

Definida una sola vez en `src/app/globals.css` como tokens de Tailwind:
`black #000`, `charcoal #0D0D0D`, `graphite #1A1A1A`, `steel #262626`, `smoke #333`, `fog #404040`,
`white #FFF`, fondo `mist #E8E8E8`, borde `line #D6D6D6`, `muted #8A8A8A` (estado pendiente)
y `alert #D93025`, el único color de la interfaz. Solo aparece cuando algo necesita atención.

## Estructura

```
src/app/(store)/          landing, /productos, /productos/[slug], /carrito, /checkout, /seguimiento/[numero]
src/app/dashboard/        resumen, ordenes, inventario, productos, clientes, envios (protegido por sesión)
src/app/login/            acceso al panel
src/app/api/              checkout, shipping/rates, admin/*, auth/*, webhooks/stripe, webhooks/shippo
src/proxy.ts              redirige a /login sin sesión (panel y API admin)
src/db/schema.ts          esquema D1/SQLite (Drizzle)
src/db/index.ts           cliente D1 vía getCloudflareContext; siembra si está vacía
wrangler.jsonc            Worker, dominio, bindings D1/KV, variables públicas
open-next.config.ts       caché ISR en KV
src/db/seed.ts            catálogo inicial y usuario admin (sin clientes ni órdenes)
src/lib/data.ts           consultas y mapeo filas → tipos de la interfaz
src/lib/shipping.ts       Shippo: tarifas, validación de tarifa, compra de etiqueta; tarifas fijas de respaldo
src/lib/stripe.ts         cliente de Stripe (null si no hay clave)
src/lib/email.ts          Resend (log en consola si no hay clave)
src/lib/session.ts        JWT de sesión
src/components/store/     Hero, About, Featured, Catalog, Header, Footer, CartDrawer, Checkout…
src/components/three/     modelos 3D procedurales, escena y visor con fallback
src/components/dashboard/ sidebar, topbar, tarjetas, tablas, gráfica, diálogos
src/store/cart.ts         carrito (zustand + localStorage)
src/store/admin.ts        estado del panel: carga de la API y acciones contra el servidor
migrations/               migraciones SQL (wrangler d1 migrations)
public/brand/             logo blanco y negro
public/products/          imágenes de producto (provisionales, ver abajo)
docs/INTEGRACIONES.md     cómo activar Stripe, Shippo y Resend, y qué falta
```

## Cómo fluye una compra

1. El checkout pide dirección y cotiza envío en `/api/shipping/rates` (Shippo o tarifas fijas).
2. `/api/checkout` recalcula precios con la base, valida stock y tarifa, crea la orden y, con Stripe, el PaymentIntent.
3. Con Stripe, el cliente paga con el Payment Element; el webhook `payment_intent.succeeded` marca la orden pagada y descuenta stock. Sin Stripe, se marca pagada al instante (modo simulado).
4. En el panel, "Marcar como enviada" compra la etiqueta en Shippo (PDF 4×6) o registra una guía manual, y avisa al cliente por correo.
5. El webhook de Shippo actualiza el estado hasta "entregado". El cliente lo sigue en `/seguimiento/<número>`.

## 3D y rendimiento en móvil

- Three.js **nunca** entra en el paquete inicial: se descarga por importación dinámica solo cuando toca.
- `src/lib/use-can-render-3d.ts` decide si el dispositivo lo aguanta. En pantallas menores de 768 px,
  conexiones 2G/3G, modo ahorro de datos, poca memoria o preferencia de movimiento reducido, se muestra
  la imagen estática y no se descarga nada de 3D. Reevalúa si la red cambia.
- En el detalle de producto hay un botón "Ver en 3D" para forzarlo desde el teléfono.
- El canvas se pausa cuando sale de pantalla.
- Los modelos actuales son procedurales (`src/components/three/models.tsx`). Para usar modelos reales,
  exportar GLB comprimido con Draco (< 1 MB) y cargarlo con `useGLTF` de drei en ese archivo.
- Landing, catálogo y detalle son HTML estático que se regenera cada 5 minutos o al guardar un producto en el panel.

## Imágenes de producto

Las fotos de los productos impresos en 3D se exportan desde sus propios modelos: con `npm run dev` corriendo,
`node scripts/render-products.mjs` abre `/render/<modelo>` en Chrome headless, captura el PNG transparente
(`POST /api/dev/render`, solo desarrollo) y `scripts/compose-render.mjs` lo monta sobre el fondo de estudio en
`public/products/<nombre>.webp`. La plantilla sale de su arte real: `node scripts/trace-template.mjs <arte.png>` recorta el arte
(`plantilla-hairline-art.png`, textura del modelo 3D), traza la silueta (`src/components/three/template-outline.json`, extruida como
acrílico) y genera la foto de catálogo `plantilla-hairline.webp` con el arte a todo detalle.
Para sustituir cualquiera por fotografía real basta con guardar un archivo con el **mismo nombre**
(`plantilla-hairline.webp`, `dispensador-cuchillas.webp`, …), idealmente cuadrado, 1200 × 1200, fondo claro.
Un producto nuevo se crea desde el panel indicando la ruta de su imagen.

## Idiomas

Español e inglés. El idioma se decide en `src/proxy.ts`: prefijo explícito en la URL (`/es/...`, `/en/...`) > cookie `ryvox_lang` > idioma del dispositivo (Accept-Language; español si aparece antes que inglés, si no inglés).
Las páginas viven en `src/app/[lang]/...` y se sirven sin cambiar la URL visible. Los textos están en `src/i18n/es.ts` (fuente de verdad) y `src/i18n/en.ts`;
los componentes de cliente usan `useT()` y los de servidor `dict(lang)`. El selector ES/EN está en cabecera, pie, login, panel y página de construcción.
Cada pedido guarda el idioma del cliente para los correos. Los textos de producto (nombre, descripción) se muestran tal como se escriben en el panel.

## Fotos de producto desde el panel

El editor de productos sube imágenes a R2 (bucket `ryvox-media`, binding `MEDIA`) vía `POST /api/admin/upload` y se sirven en `/media/...` con caché larga.
JPG, PNG o WebP hasta 4 MB; se guardan tal cual (sin redimensionar), así que conviene subirlas ya cuadradas y ligeras.

## Modo "en construcción"

Con `SITE_LOCKED=true` (en `wrangler.jsonc` → `vars`) el público ve `/en-construccion` y la API pública responde 503.
Se entra a la web completa con la sesión del panel o abriendo `/preview?key=<PREVIEW_KEY>`, que deja una cookie de 30 días.
`PREVIEW_KEY` es un secreto del Worker. Para abrir la web al público: `SITE_LOCKED` a `"false"` y `npm run deploy`.

## Variables de entorno y despliegue

Desarrollo: copia `.env.example` a `.env.local`. Sin claves todo funciona en modo simulado.

Producción (Cloudflare): las variables públicas están en `wrangler.jsonc` → `vars`; los secretos se cargan con
`npx wrangler secret put NOMBRE` (AUTH_SECRET, ADMIN_PASSWORD, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
SHIPPO_API_KEY, SHIPPO_WEBHOOK_SECRET, RESEND_API_KEY). La clave publicable de Stripe va en `.env.production`
porque entra en el paquete del navegador al compilar. Despliegue: `npm run deploy`. Ver `docs/INTEGRACIONES.md`.

## Qué falta para salir a producción

- Claves de Stripe, Shippo y Resend (ninguna requiere empresa registrada) y sus webhooks apuntando a https://ryvoxshop.com.
- Activar Images → Transformations en Cloudflare si se quiere redimensionado automático de fotos.
- Stripe Tax si se quiere cobrar impuesto por estado.

## SEO y páginas legales

- Metadatos por página con `pageMeta()` (`src/lib/seo.ts`): canónica por idioma, hreflang es/en, Open Graph y Twitter Card. La vista previa al compartir (WhatsApp, Instagram, iMessage) usa `public/brand/og-image.png` (1200×630, logo sobre negro); las fichas de producto usan su propia foto.
- Datos estructurados schema.org: Organization + WebSite en la portada, Product (con oferta y política de devolución) + BreadcrumbList en cada ficha (`src/components/seo/JsonLd.tsx`).
- `/robots.txt` y `/sitemap.xml` se generan en cada petición (`src/app/robots.ts`, `src/app/sitemap.ts`): con `SITE_LOCKED=true` bloquean todo; abiertos, excluyen panel, checkout, carrito, login y seguimiento.
- Textos legales bilingües en `src/content/legal.ts`: `/terminos` y `/reembolsos` (enlazados en el footer y en el checkout). Cuando exista la razón social definitiva, actualizar el apartado "Quiénes somos".

## Colores (variantes)

- Cada producto declara `colors` (negro, azul, verde, rosado, rojo, dorado; ver `src/lib/colors.ts`) y una foto por color en `colorImages`; sin foto propia se usa `image`.
- Las tarjetas del catálogo muestran los círculos de color abajo a la derecha: cambian la foto sin abrir el producto. En la ficha, el color elegido cambia la foto, el material del 3D y se guarda en el carrito (`key = productId:color`), en los artículos de la orden (columna `color`, y el nombre lleva el color) y en los correos.
- Fotos por color: `node scripts/render-products.mjs` (soporte y dispensador × 6 colores, desde el 3D) y `node scripts/tint-template.mjs` (plantilla: el arte sobre cada color base, más las texturas del 3D).
- En el panel, el editor permite marcar los colores disponibles y subir una foto por color.

## 3D en móvil

Desde el 2026-09-11 el 3D también se carga en teléfonos (`src/lib/use-can-render-3d.ts`). Solo cae a la foto estática con conexión 2G, "ahorro de datos" activado, dispositivos con menos de 2 GB o 2 núcleos, o preferencia de movimiento reducido.

## Editor del inicio (panel)

- Dashboard → Inicio (`/dashboard/landing`): el dueño reordena las secciones del inicio (Hero, Productos, Destacado, Qué es Ryvox, Manifiesto) con flechas subir/bajar, y edita todos los textos de marketing de esas secciones en español e inglés, sin tocar código.
- Se guarda en D1 (`site_settings`, fila única `id="landing"`: `order` y `content.{es,en}`) vía `/api/admin/landing` (GET/PATCH, protegido como el resto del panel). `src/lib/landing.ts` mezcla lo guardado sobre el diccionario i18n por defecto (`mergeLandingText`); si una sección nunca se editó, se usa el texto de `src/i18n/es.ts`/`en.ts`.
- Hero.tsx y Manifesto.tsx reciben el diccionario ya mezclado como prop `t` (dejaron de usar `useT()` para el texto); Featured.tsx recibe `eyebrow` opcional. About.tsx y CatalogPreview.tsx ya lo hacían así.

## Panel: cifras reales del resumen

- El resumen del panel (`/dashboard`) ya no usa datos de ejemplo: el gráfico de ventas, el % de los últimos 30 días y los % "vs. ayer" de las tarjetas se calculan en `src/lib/orders.ts` (`salesSeries`, `sumSalesWindow`, `percentChange`) a partir de las órdenes reales (`paid === true` y no canceladas). Cuando no hay un período anterior con qué comparar, el % simplemente no se muestra (antes eran números fijos como "+27%" inventados en el diccionario i18n).
- `SALES_30D` (mock) se eliminó de `src/lib/orders.ts`; `CUSTOMERS`/`ORDERS` (mock, ya sin uso desde que se quitaron los datos de ejemplo del seed) siguen ahí sin usarse — limpieza pendiente, no bloquea nada.

## Login del panel sin contraseña (verificación en 2 pasos)

- `/login` ya no pide contraseña: solo correo. Se envía un código de 6 dígitos por Resend (`sendLoginCode` en `src/lib/email.ts`; en local sin `RESEND_API_KEY` se imprime en consola como "[email simulado]") y se verifica en `/api/auth/verify-code`.
- Tabla `login_codes` (migración 0005): un código activo por correo (uno nuevo invalida el anterior), vence en 10 minutos, máximo 5 intentos, no se puede reenviar antes de 45 s. La respuesta de `/api/auth/request-code` es siempre `{ok:true}` exista o no la cuenta, para no revelar qué correos son admin.
- La ruta vieja `/api/auth/login` (contraseña) se eliminó. `src/lib/password.ts` y la columna `password_hash` siguen en `admin_users`/`seed.ts` sin usarse en el login (no se tocaron, por si se necesitan más adelante).
- Probado de punta a punta en local: correo → código real recibido → verificación → sesión abierta; también código incorrecto, código reutilizado, 5+ intentos fallidos y correo desconocido.

## App instalable, sesión permanente, notificaciones push y venta en persona (2026-09-11)

**PWA del panel**: `src/app/manifest.ts` + `public/sw.js`. En Android/Chrome, "Instalar app" abre directo en /dashboard (start_url + scope del manifest). En iOS/Safari, start_url no se respeta: hay que hacer "Agregar a inicio" estando ya dentro de /dashboard. `proxy.ts` excluye `manifest.webmanifest` y `sw.js` del rewrite de idioma.

**Sesión persistente**: `src/lib/session.ts` — la cookie/JWT dura 400 días (el tope real que permiten los navegadores; no existe "para siempre"). Solo se cierra si el admin pulsa "Cerrar sesión".

**Notificaciones push** (nuevo pedido, con o sin la app abierta): Web Push cifrado a mano con Web Crypto (RFC 8291/8292) en `src/lib/web-push.ts` — sin la librería `web-push` porque no corre en Cloudflare Workers. Claves VAPID en `.env.local`/Worker secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY_PKCS8`, `VAPID_SUBJECT`) + `NEXT_PUBLIC_VAPID_PUBLIC_KEY` para el navegador. Tabla `push_subscriptions` (migración 0006, una fila por dispositivo). Botón en el Topbar (`PushBell.tsx`) para activar/probar/desactivar. `markOrderPaid` en `src/lib/data.ts` dispara `notifyNewOrder`.
**Límite real de las plataformas**: ninguna app web puede poner un sonido propio en la notificación del sistema (Android/iOS siempre usan su sonido por defecto). Con el panel ABIERTO en primer plano sí suena un timbre propio, sintetizado con Web Audio (`src/lib/notification-sound.ts`, sin copiar el sonido de ninguna otra tienda) cuando llega el `push` vía `postMessage` del service worker.
Probado: cifrado verificado por autoconsistencia (cifrar con la clave pública simulada y descifrar con la privada, mensaje idéntico) y un envío real a un endpoint de FCM inventado (VAPID firma OK, FCM respondió 404 y la suscripción se borró sola, como debe ser). Falta que el usuario pruebe el botón "Activar" en su teléfono real para ver la notificación de verdad.

**Venta en persona** (`/dashboard/venta`, componente `PosCart.tsx`): el admin arma el carrito, `POST /api/admin/pos/checkout` crea la orden (envío "pickup", $0, sin dirección real) y el PaymentIntent de Stripe, y muestra un QR (`qrcode`, generado en el navegador) + enlace a `/pagar/[intentId]` (`intentId` = id del PaymentIntent de Stripe, no el número de pedido, para que no se pueda adivinar). El cliente abre eso en SU teléfono y paga con Apple Pay/Google Pay/tarjeta (`PosPayForm.tsx`, mismo patrón que el checkout normal). El panel hace polling cada 3 s a `GET /api/pos/[intentId]` (pública, sin sesión) hasta ver `paid:true`. Sin correo del cliente, se usa uno sintético (`src/lib/orders.ts`: `placeholderEmail`/`isPlaceholderEmail`) y no se manda confirmación por correo a esa dirección falsa. `/pagar` y `/api/pos` siguen abiertos aunque `SITE_LOCKED=true`.
**No incluye "tap to pay"**: cobrar tocando una tarjeta contra el propio teléfono del vendedor (como Shopify Tap to Pay) no es posible desde ningún sitio web — solo apps nativas iOS/Android certificadas con el SDK de Stripe Terminal. Esto es una limitación de la plataforma, no del código; se le explicó al usuario y eligió la alternativa de QR/enlace.
Probado de punta a punta en local (modo simulado sin Stripe): carrito → orden creada con envío "pickup" y correo sintético → pagada al instante → el panel detecta el pago por polling → la página del cliente muestra "pago recibido". Datos de prueba borrados después.

## Por qué los cambios del panel no se veían en la tienda (corregido 2026-09-11)

`open-next.config.ts` solo configura la caché incremental en KV, sin cola de revalidación (`queue`) ni caché de etiquetas (`tagCache`). Sin eso, en Cloudflare Workers `revalidatePath()` (llamado desde `src/lib/store-revalidate.ts` tras editar un producto o el inicio) no invalida de verdad la página estática cacheada: el cambio solo se veía tras los 5 minutos del `revalidate` de Next, o tras el próximo `populateCache` de un deploy.

Solución: `/`, `/productos` y `/productos/[slug]` pasaron de `revalidate = 300` a `revalidate = 0` (siempre dinámicas, leen D1 en cada visita). Con el tráfico de esta tienda no hay problema de rendimiento; a cambio, un cambio de precio, de stock, de "activo" o del editor del inicio se ve al instante, sin depender de `populateCache`. Probado: cambiar el precio y desactivar un producto por la API del panel se reflejó de inmediato en la página pública, sin esperar ni redeployar.
