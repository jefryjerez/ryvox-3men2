// Service worker del panel RYVOX: notificaciones push + apertura directa al pulsar la notificación.
// Sin caché de páginas (evita servir contenido viejo del panel); solo maneja push y clics.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "RYVOX", body: "Tienes una actualización.", url: "/dashboard" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // payload no era JSON: se queda el texto por defecto
  }

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/brand/icon-512.png",
        badge: "/brand/icon-512.png",
        tag: data.tag,
        data: { url: data.url || "/dashboard" },
        vibrate: [120, 60, 120],
      });
      // Avisa a las pestañas abiertas (si el panel está en primer plano, ahí se reproduce el sonido propio).
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) client.postMessage({ type: "ryvox-push", data });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      const existing = clients.find((c) => "focus" in c);
      if (existing) {
        existing.navigate(url);
        return existing.focus();
      }
      return self.clients.openWindow(url);
    })(),
  );
});
