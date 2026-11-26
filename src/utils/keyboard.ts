import { useEffect, useLayoutEffect, type RefObject } from "react";

/**
 * Global Keyboard & Viewport Utilities for iOS Safari / Chrome & Android Chrome.
 */

function isTextInputElement(element: Element | null): element is HTMLInputElement | HTMLTextAreaElement {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  if (tagName === "textarea") return true;

  if (tagName === "input") {
    const inputType = (element as HTMLInputElement).type?.toLowerCase() || "text";
    const nonTextTypes = [
      "button",
      "checkbox",
      "color",
      "file",
      "hidden",
      "image",
      "radio",
      "range",
      "reset",
      "submit",
    ];
    return !nonTextTypes.includes(inputType);
  }

  return (element as HTMLElement).isContentEditable;
}

/**
 * Dismisses the active keyboard by blurring the currently focused text field.
 */
export function dismissKeyboard() {
  if (typeof document === "undefined") return;
  const active = document.activeElement;
  if (isTextInputElement(active)) {
    (active as HTMLElement).blur();
  }
}

/**
 * Reference-counted background scroll lock.
 * Fixes body at the exact scroll position so iOS Safari cannot push the page behind the sheet,
 * and restores scroll position instantaneously when the last sheet closes.
 */
let bodyScrollLockCount = 0;
let savedScrollY = 0;

export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || typeof document === "undefined") return;

    if (bodyScrollLockCount === 0) {
      savedScrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.body.classList.add("sheet-scroll-locked");
    }
    bodyScrollLockCount += 1;

    return () => {
      bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
      if (bodyScrollLockCount === 0) {
        document.body.classList.remove("sheet-scroll-locked");
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, savedScrollY);
      }
    };
  }, [isOpen]);
}

/**
 * 3-layer top-anchored visualViewport synchronization for iOS Safari & Android Chrome:
 * - viewportLayer (fixed top: 0, transition: none): tracks vv.offsetTop instantaneously (0ms)
 * - kbLayer (absolute top: 0, 220ms transition): tracks vv.height smoothly
 * - scrollEl: caps maxHeight to Math.max(200, height - 24) so close button never goes under status bar
 * - focusin/focusout on sheet triggers a 600ms rAF sync loop to capture Safari viewport shifts in 16ms
 * - focusout checks after 40ms if focus left all inputs in sheet and resets ghost offsetTop via scrollTo(0, 0)
 */
export function useKeyboardSheetViewport(
  isOpen: boolean,
  viewportLayerRef: RefObject<HTMLDivElement | null>,
  kbLayerRef: RefObject<HTMLDivElement | null>,
  sheetRef: RefObject<HTMLDivElement | null>,
  scrollRef: RefObject<HTMLDivElement | null>
) {
  useLayoutEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    const viewportLayer = viewportLayerRef.current;
    const kbLayer = kbLayerRef.current;
    const scrollEl = scrollRef.current;
    if (!viewportLayer || !kbLayer || !scrollEl) return;

    kbLayer.style.transition = "none";

    const vv = window.visualViewport;
    const offsetTop = vv ? Math.round(vv.offsetTop) : 0;
    const height = vv ? Math.round(vv.height) : window.innerHeight;

    viewportLayer.style.transform = `translate3d(0, ${offsetTop}px, 0)`;
    kbLayer.style.transform = `translate3d(0, ${height}px, 0)`;
    scrollEl.style.maxHeight = `${Math.max(200, height - 24)}px`;

    void kbLayer.offsetHeight;
    kbLayer.style.transition = "";
  }, [isOpen, viewportLayerRef, kbLayerRef, scrollRef]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    const viewportLayer = viewportLayerRef.current;
    const kbLayer = kbLayerRef.current;
    const sheet = sheetRef.current;
    const scrollEl = scrollRef.current;
    if (!viewportLayer || !kbLayer || !sheet || !scrollEl) return;

    const syncViewport = () => {
      const vv = window.visualViewport;
      const offsetTop = vv ? Math.round(vv.offsetTop) : 0;
      const height = vv ? Math.round(vv.height) : window.innerHeight;

      viewportLayer.style.transform = `translate3d(0, ${offsetTop}px, 0)`;
      kbLayer.style.transform = `translate3d(0, ${height}px, 0)`;
      scrollEl.style.maxHeight = `${Math.max(200, height - 24)}px`;
    };

    let rafId: number | null = null;
    let focusoutTimer: number | null = null;

    const stopRafLoop = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const startRafSyncLoop = () => {
      stopRafLoop();
      const startTime = performance.now();
      const tick = (now: number) => {
        syncViewport();
        if (now - startTime < 600) {
          rafId = window.requestAnimationFrame(tick);
        } else {
          rafId = null;
        }
      };
      rafId = window.requestAnimationFrame(tick);
    };

    const handleFocusIn = () => {
      if (focusoutTimer !== null) {
        window.clearTimeout(focusoutTimer);
        focusoutTimer = null;
      }
      startRafSyncLoop();
    };

    const handleFocusOut = () => {
      startRafSyncLoop();
      if (focusoutTimer !== null) {
        window.clearTimeout(focusoutTimer);
      }
      focusoutTimer = window.setTimeout(() => {
        focusoutTimer = null;
        const active = document.activeElement;
        const focusRemainsInSheet = Boolean(
          active && sheet.contains(active) && isTextInputElement(active)
        );
        if (!focusRemainsInSheet && window.visualViewport && window.visualViewport.offsetTop > 0) {
          window.scrollTo(0, 0);
          syncViewport();
        }
      }, 40);
    };

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", syncViewport);
      vv.addEventListener("scroll", syncViewport);
    }
    sheet.addEventListener("focusin", handleFocusIn);
    sheet.addEventListener("focusout", handleFocusOut);

    return () => {
      stopRafLoop();
      if (focusoutTimer !== null) {
        window.clearTimeout(focusoutTimer);
      }
      if (vv) {
        vv.removeEventListener("resize", syncViewport);
        vv.removeEventListener("scroll", syncViewport);
      }
      sheet.removeEventListener("focusin", handleFocusIn);
      sheet.removeEventListener("focusout", handleFocusOut);
    };
  }, [isOpen, viewportLayerRef, kbLayerRef, sheetRef, scrollRef]);
}
