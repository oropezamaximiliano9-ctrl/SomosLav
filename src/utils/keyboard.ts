import { useEffect, type RefObject } from "react";

/**
 * Global Keyboard Dismissal Utility
 * Ensures that no virtual keyboard on mobile or desktop text field gets stuck open.
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
      "submit"
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
 * Tracks the mobile virtual keyboard via window.visualViewport and writes the
 * GPU-composited `--kb-offset` CSS custom property directly on the bottom sheet
 * element (zero React re-renders during keyboard open/close animations).
 */
export function useKeyboardSheetOffset(
  isOpen: boolean,
  sheetRef: RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    const el = sheetRef.current;
    if (!el || typeof window === "undefined") return;

    if (!isOpen) {
      el.removeAttribute("data-vv-pan");
      // Wait for the sheet's exit transition to finish before zeroing --kb-offset
      // so closing while the keyboard is open glides out in a single fluid motion.
      const resetTimer = window.setTimeout(() => {
        el.style.setProperty("--kb-offset", "0px");
        if (window.scrollY !== 0 || window.scrollX !== 0) {
          window.scrollTo(0, 0);
        }
      }, 340);
      return () => window.clearTimeout(resetTimer);
    }

    const vv = window.visualViewport;
    if (!vv) {
      el.style.setProperty("--kb-offset", "0px");
      return;
    }

    let rafId: number | null = null;
    let panClearTimer: number | null = null;
    let lastOffset = -1;
    let lastKeyboardHeight = Math.round(window.innerHeight - vv.height);

    const updateOffset = (isScrollEvent: boolean) => {
      rafId = null;
      const keyboardHeight = Math.round(window.innerHeight - vv.height);
      const isKeyboardOpen = keyboardHeight > 100;
      const heightChanged = Math.abs(keyboardHeight - lastKeyboardHeight) > 8;
      lastKeyboardHeight = keyboardHeight;

      let nextOffset = 0;
      if (isKeyboardOpen) {
        const rawOffset = Math.max(0, Math.round(keyboardHeight - vv.offsetTop));
        const maxSafeOffset = Math.max(
          0,
          Math.round(window.innerHeight - el.offsetHeight - vv.offsetTop - 12)
        );
        // Only clamp on ultra-short viewports where the sheet is taller than visualViewport
        nextOffset = vv.height < el.offsetHeight + 12 ? Math.min(rawOffset, maxSafeOffset) : rawOffset;
      }

      if (nextOffset !== lastOffset) {
        lastOffset = nextOffset;

        // If iOS is actively panning visualViewport.offsetTop (scroll without keyboard resize),
        // track 1:1 without restarting the 300ms CSS transition to prevent wobble.
        if (isScrollEvent && !heightChanged) {
          el.setAttribute("data-vv-pan", "true");
          if (panClearTimer !== null) window.clearTimeout(panClearTimer);
          panClearTimer = window.setTimeout(() => {
            el.removeAttribute("data-vv-pan");
            panClearTimer = null;
          }, 80);
        } else {
          el.removeAttribute("data-vv-pan");
        }

        el.style.setProperty("--kb-offset", `${nextOffset}px`);
      }

      if (!isKeyboardOpen && (window.scrollY !== 0 || window.scrollX !== 0)) {
        window.scrollTo(0, 0);
      }
    };

    const scheduleResize = () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => updateOffset(false));
    };

    const scheduleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => updateOffset(true));
    };

    updateOffset(false);
    vv.addEventListener("resize", scheduleResize);
    vv.addEventListener("scroll", scheduleScroll);
    window.addEventListener("resize", scheduleResize);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (panClearTimer !== null) window.clearTimeout(panClearTimer);
      el.removeAttribute("data-vv-pan");
      vv.removeEventListener("resize", scheduleResize);
      vv.removeEventListener("scroll", scheduleScroll);
      window.removeEventListener("resize", scheduleResize);
    };
  }, [isOpen, sheetRef]);
}
