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
      // Wait for the sheet's exit transition to finish before zeroing --kb-offset
      // so closing while the keyboard is open glides out in a single fluid motion.
      const resetTimer = window.setTimeout(() => {
        el.style.setProperty("--kb-offset", "0px");
        if (window.scrollY !== 0 || window.scrollX !== 0) {
          window.scrollTo(0, 0);
        }
      }, 320);
      return () => window.clearTimeout(resetTimer);
    }

    const vv = window.visualViewport;
    if (!vv) {
      el.style.setProperty("--kb-offset", "0px");
      return;
    }

    let rafId: number | null = null;
    let lastOffset = -1;

    const updateOffset = () => {
      rafId = null;
      const keyboardHeight = Math.round(window.innerHeight - vv.height);
      const isKeyboardOpen = keyboardHeight > 100;

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

      // Ignore tiny <=4px visualViewport jitter while open so the CSS glide never stutters
      const isMeaningfulChange =
        lastOffset === -1 ||
        nextOffset === 0 !== (lastOffset === 0) ||
        Math.abs(nextOffset - lastOffset) > 4;

      if (isMeaningfulChange && nextOffset !== lastOffset) {
        lastOffset = nextOffset;
        el.style.setProperty("--kb-offset", `${nextOffset}px`);
      }

      if (!isKeyboardOpen && (window.scrollY !== 0 || window.scrollX !== 0)) {
        window.scrollTo(0, 0);
      }
    };

    const scheduleUpdate = () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateOffset);
    };

    updateOffset();
    vv.addEventListener("resize", scheduleUpdate);
    vv.addEventListener("scroll", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      vv.removeEventListener("resize", scheduleUpdate);
      vv.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [isOpen, sheetRef]);
}
