// Service Worker for SOMOS PWA Push Notifications
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for incoming Push Events (from backend or web push service)
self.addEventListener("push", (event) => {
  let data = {
    title: "🧺 SOMOS - Aviso de Llegada",
    body: "Un cliente va en camino a dejar su cesto.",
    url: "/associate-scanner",
    tag: "somos-arrival"
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "https://i.ibb.co/VcVSqJbP/A5-DFA592-E652-4373-9358-BA9-DC228-E0-D7.webp",
    badge: "https://i.ibb.co/VcVSqJbP/A5-DFA592-E652-4373-9358-BA9-DC228-E0-D7.webp",
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || "somos-arrival-tag",
    renotify: true,
    data: {
      url: data.url || "/associate-scanner"
    },
    actions: [
      { action: "open", title: "Ver Cesto 🧺" },
      { action: "dismiss", title: "Cerrar" }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification tap
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/associate-scanner";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
