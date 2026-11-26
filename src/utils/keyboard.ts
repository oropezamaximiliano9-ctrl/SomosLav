import { useEffect, type RefObject } from "react";

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
let cleanupViewportGuard: (() => void) | null = null;

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

      const vv = window.visualViewport;
      if (vv) {
        const preventViewportPush = () => {
          if (vv.offsetTop > 0) {
            window.scrollTo(0, 0);
          }
        };
        vv.addEventListener("scroll", preventViewportPush);
        vv.addEventListener("resize", preventViewportPush);
        cleanupViewportGuard = () => {
          vv.removeEventListener("scroll", preventViewportPush);
          vv.removeEventListener("resize", preventViewportPush);
        };
      }
    }
    bodyScrollLockCount += 1;

    return () => {
      bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
      if (bodyScrollLockCount === 0) {
        if (cleanupViewportGuard) {
          cleanupViewportGuard();
          cleanupViewportGuard = null;
        }
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
 * Lifts only kbLayer above the iOS/Android virtual keyboard via window.visualViewport
 * using requestAnimationFrame, and constrains the inner scroll container's maxHeight.
 * Resets kbLayer cleanly without transition 300ms after closing.
 */
export function useKeyboardSheetOffset(
  isOpen: boolean,
  kbLayerRef: RefObject<HTMLDivElement | null>,
  scrollRef: RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    const kbLayer = kbLayerRef.current;
    const scrollEl = scrollRef.current;
    if (!kbLayer || !scrollEl || typeof window === "undefined") return;

    if (!isOpen) {
      const resetTimer = window.setTimeout(() => {
        kbLayer.style.transition = "none";
        kbLayer.style.transform = "translate3d(0, 0px, 0)";
        scrollEl.style.maxHeight = "";
        void kbLayer.offsetHeight;
        kbLayer.style.transition = "";
      }, 300);
      return () => window.clearTimeout(resetTimer);
    }

    kbLayer.style.transition = "";

    const vv = window.visualViewport;
    if (!vv) {
      kbLayer.style.transform = "translate3d(0, 0px, 0)";
      return;
    }

    let rafId: number | null = null;

    const update = () => {
      rafId = null;
      const rawOffset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      const keyboardOffset = rawOffset > 60 ? rawOffset : 0;

      kbLayer.style.transform = `translate3d(0, ${-keyboardOffset}px, 0)`;
      scrollEl.style.maxHeight = `${Math.max(200, Math.round(vv.height - 24))}px`;
    };

    const scheduleUpdate = () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(update);
    };

    update();
    vv.addEventListener("resize", scheduleUpdate);
    vv.addEventListener("scroll", scheduleUpdate);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      vv.removeEventListener("resize", scheduleUpdate);
      vv.removeEventListener("scroll", scheduleUpdate);
    };
  }, [isOpen, kbLayerRef, scrollRef]);
}
