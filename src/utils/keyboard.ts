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
 * Single source of truth for mobile virtual keyboard offset via window.visualViewport.
 * Listens cleanly to visualViewport "resize" & "scroll" with requestAnimationFrame
 * and updates GPU translate3d on kbLayer + maxHeight on sheet.
 */
export function useKeyboardSheetOffset(
  isOpen: boolean,
  kbLayerRef: RefObject<HTMLDivElement | null>,
  sheetRef: RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    const kbLayer = kbLayerRef.current;
    const sheet = sheetRef.current;
    if (!kbLayer || !sheet || typeof window === "undefined") return;

    if (!isOpen) {
      const resetTimer = window.setTimeout(() => {
        kbLayer.style.transform = "translate3d(0, 0px, 0)";
        sheet.style.maxHeight = "";
      }, 280);
      return () => window.clearTimeout(resetTimer);
    }

    const vv = window.visualViewport;
    if (!vv) {
      kbLayer.style.transform = "translate3d(0, 0px, 0)";
      return;
    }

    let rafId: number | null = null;

    const update = () => {
      rafId = null;
      const offset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      const finalOffset = offset < 50 ? 0 : offset;

      kbLayer.style.transform = `translate3d(0, ${-finalOffset}px, 0)`;
      sheet.style.maxHeight = `${Math.max(220, Math.round(vv.height - 16))}px`;
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
  }, [isOpen, kbLayerRef, sheetRef]);
}
