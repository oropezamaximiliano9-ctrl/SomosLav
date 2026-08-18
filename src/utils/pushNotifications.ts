// Helper for Push Notifications and PWA registration
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Workers not supported in this browser");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    console.log("[PWA] Service Worker registered successfully:", registration.scope);
    return registration;
  } catch (error) {
    console.error("[PWA] Service Worker registration failed:", error);
    return null;
  }
}

// Request permission and subscribe device
export async function requestNotificationPermissionAndSubscribe(
  userId: string,
  userRole: string,
  userName: string = "Asociado"
): Promise<{ success: boolean; error?: string; permission?: NotificationPermission }> {
  if (!("Notification" in window)) {
    return { success: false, error: "Este navegador no soporta notificaciones push" };
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      return { success: false, permission, error: "Permiso de notificaciones denegado o cancelado" };
    }

    const registration = await registerServiceWorker();
    if (!registration) {
      return { success: false, error: "No se pudo inicializar el Service Worker" };
    }

    // Save device subscription record in Firestore under `associate_devices`
    const deviceId = `device_${userId}_${navigator.userAgent.replace(/[^a-zA-Z0-9]/g, "").slice(-16)}`;

    await setDoc(doc(db, "associate_devices", deviceId), {
      deviceId,
      userId,
      userName,
      userRole, // 'associate' | 'admin'
      userAgent: navigator.userAgent,
      enabled: true,
      updatedAt: new Date().toISOString(),
      platform: /iPhone|iPad|iPod/.test(navigator.userAgent) ? "ios" : /Android/.test(navigator.userAgent) ? "android" : "desktop"
    });

    return { success: true, permission: "granted" };
  } catch (error: any) {
    console.error("Error subscribing to notifications:", error);
    return { success: false, error: error.message || "Error al activar notificaciones" };
  }
}

// Trigger in-browser notification alert for active tab or service worker
export function triggerLocalNotification(title: string, body: string, url: string = "/associate-scanner") {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: "https://i.ibb.co/VcVSqJbP/A5-DFA592-E652-4373-9358-BA9-DC228-E0-D7.webp",
        badge: "https://i.ibb.co/VcVSqJbP/A5-DFA592-E652-4373-9358-BA9-DC228-E0-D7.webp",
        tag: `arrival-${Date.now()}`,
        renotify: true,
        data: { url }
      } as NotificationOptions);
    });
  } else {
    try {
      new Notification(title, {
        body,
        icon: "https://i.ibb.co/VcVSqJbP/A5-DFA592-E652-4373-9358-BA9-DC228-E0-D7.webp"
      });
    } catch (e) {
      console.warn("Direct Notification constructor failed:", e);
    }
  }
}
