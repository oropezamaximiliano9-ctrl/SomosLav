import { useEffect, useLayoutEffect, type RefObject } from "react";

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

function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isTopLevelWindow(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self === window.top;
  } catch {
    // Cross-origin iframe throws SecurityError -> not top-level
    return false;
  }
}

// Remember the exact measured iOS keyboard height once observed in this top-level session
let cachedIosKeyboardHeight: number | null = null;

/**
 * Tracks the mobile virtual keyboard via window.visualViewport and writes
 * concrete `translate3d(0, -Xpx, 0)` transforms directly on the bottom sheet
 * element (avoiding WebKit's intermittent transition-skip bug with CSS custom
 * properties inside `calc()` inside `transform`).
 *
 * On top-level iOS browsers (production iPhone Chrome / Safari, never inside
 * iframes), when the user directly taps an input field, pre-lifts conservatively
 * on frame 0 so even the very first keyboard open rises smoothly in lockstep
 * with the iOS keyboard before WKWebView's delayed visualViewport.resize fires.
 */
export function useKeyboardSheetOffset(
  isOpen: boolean,
  sheetRef: RefObject<HTMLDivElement | null>
) {
  // Synchronously clear inline transform before paint when closing so the CSS
  // closed-state transform (`translate3d(0, calc(100% + 24px), 0)`) transitions
  // smoothly in a single unbroken sweep from the current keyboard position.
  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el || isOpen) return;
    el.style.transform = "";
  }, [isOpen, sheetRef]);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el || typeof window === "undefined") return;

    if (!isOpen) {
      const cleanupTimer = window.setTimeout(() => {
        if (window.scrollY !== 0 || window.scrollX !== 0) {
          window.scrollTo(0, 0);
        }
      }, 320);
      return () => window.clearTimeout(cleanupTimer);
    }

    const vv = window.visualViewport;
    if (!vv) {
      el.style.transform = "";
      return;
    }

    const isIOS = isIOSDevice();
    const canPreLiftIOS = isIOS && isTopLevelWindow();

    let rafId: number | null = null;
    let blurCheckTimer: number | null = null;
    let focusRecheck1: number | null = null;
    let focusRecheck2: number | null = null;
    let preLiftVerifyTimer: number | null = null;
    let lastOffset = 0;
    let dismissingUntil = 0;
    let lastDirectInputTapAt = 0;

    const getClampedOffset = (desiredOffset: number, viewportHeight: number, offsetTop: number) => {
      const rawOffset = Math.max(0, Math.round(desiredOffset));
      const maxSafeOffset = Math.max(
        0,
        Math.round(window.innerHeight - el.offsetHeight - offsetTop - 12)
      );
      return viewportHeight < el.offsetHeight + 12 ? Math.min(rawOffset, maxSafeOffset) : rawOffset;
    };

    const applyOffset = (nextOffset: number, force = false) => {
      const clamped = Math.max(0, Math.round(nextOffset));
      const isMeaningfulChange =
        force ||
        (clamped === 0) !== (lastOffset === 0) ||
        Math.abs(clamped - lastOffset) > 4;

      if (isMeaningfulChange && clamped !== lastOffset) {
        lastOffset = clamped;
        // Write concrete transform value (or clear to fall back to CSS translate3d(0, 0px, 0))
        // so WebKit/iOS Chrome reliably runs the GPU CSS transition every single time.
        el.style.transform = clamped > 0 ? `translate3d(0, ${-clamped}px, 0)` : "";
      }
    };

    const updateFromViewport = () => {
      rafId = null;
      const keyboardHeight = Math.round(window.innerHeight - vv.height);
      const isKeyboardOpen = keyboardHeight > 100;

      // Ignore stale visualViewport frames briefly while iOS keyboard is dismissing
      if (isIOS && Date.now() < dismissingUntil) {
        if (!isKeyboardOpen && (window.scrollY !== 0 || window.scrollX !== 0)) {
          window.scrollTo(0, 0);
        }
        return;
      }

      if (isKeyboardOpen) {
        if (canPreLiftIOS) {
          cachedIosKeyboardHeight = keyboardHeight;
        }
        if (preLiftVerifyTimer !== null) {
          window.clearTimeout(preLiftVerifyTimer);
          preLiftVerifyTimer = null;
        }
        const nextOffset = getClampedOffset(keyboardHeight - vv.offsetTop, vv.height, vv.offsetTop);
        applyOffset(nextOffset);
      } else {
        // Don't cancel an active direct-tap pre-lift before iOS finishes firing visualViewport.resize
        if (canPreLiftIOS && preLiftVerifyTimer !== null) {
          return;
        }
        applyOffset(0);
        if (window.scrollY !== 0 || window.scrollX !== 0) {
          window.scrollTo(0, 0);
        }
      }
    };

    const scheduleUpdate = () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateFromViewport);
    };

    const handleDirectInputTap = (e: Event) => {
      const target = e.target as Element | null;
      if (isTextInputElement(target)) {
        lastDirectInputTapAt = Date.now();
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as Element | null;
      if (!isTextInputElement(target)) return;

      dismissingUntil = 0;
      if (blurCheckTimer !== null) {
        window.clearTimeout(blurCheckTimer);
        blurCheckTimer = null;
      }

      const isDirectUserTap = Date.now() - lastDirectInputTapAt < 450;

      // On top-level iPhone Chrome/Safari, when the user directly taps an input
      // while the keyboard is closed, lift immediately on frame 0 so even the
      // very first keyboard open rises smoothly alongside the iOS keyboard.
      if (canPreLiftIOS && isDirectUserTap && lastOffset === 0) {
        const isLandscape = window.innerWidth > window.innerHeight;
        const estimatedHeight = cachedIosKeyboardHeight ?? (isLandscape ? 180 : 275);
        const estimatedVvHeight = Math.max(200, window.innerHeight - estimatedHeight);
        applyOffset(
          getClampedOffset(estimatedHeight - vv.offsetTop, estimatedVvHeight, vv.offsetTop),
          true
        );

        if (preLiftVerifyTimer !== null) window.clearTimeout(preLiftVerifyTimer);
        preLiftVerifyTimer = window.setTimeout(() => {
          preLiftVerifyTimer = null;
          const actualKb = Math.round(window.innerHeight - vv.height);
          if (actualKb <= 80) {
            applyOffset(0, true);
          } else {
            cachedIosKeyboardHeight = actualKb;
            applyOffset(getClampedOffset(actualKb - vv.offsetTop, vv.height, vv.offsetTop));
          }
        }, 450);
      }

      // Immediately sync and re-check after iOS keyboard animation checkpoints
      scheduleUpdate();
      if (focusRecheck1 !== null) window.clearTimeout(focusRecheck1);
      if (focusRecheck2 !== null) window.clearTimeout(focusRecheck2);
      focusRecheck1 = window.setTimeout(scheduleUpdate, 120);
      focusRecheck2 = window.setTimeout(scheduleUpdate, 280);
    };

    const handleFocusOut = () => {
      if (!isIOS) return;
      if (blurCheckTimer !== null) window.clearTimeout(blurCheckTimer);
      blurCheckTimer = window.setTimeout(() => {
        blurCheckTimer = null;
        const active = document.activeElement;
        if (isTextInputElement(active) && el.contains(active)) return;

        if (preLiftVerifyTimer !== null) {
          window.clearTimeout(preLiftVerifyTimer);
          preLiftVerifyTimer = null;
        }

        // Only lower immediately if a real keyboard offset was actually active
        if (lastOffset > 0) {
          dismissingUntil = Date.now() + 340;
          applyOffset(0, true);
        }
      }, 35);
    };

    updateFromViewport();
    el.addEventListener("touchstart", handleDirectInputTap, { passive: true });
    el.addEventListener("pointerdown", handleDirectInputTap, { passive: true });
    el.addEventListener("focusin", handleFocusIn);
    el.addEventListener("focusout", handleFocusOut);
    vv.addEventListener("resize", scheduleUpdate);
    vv.addEventListener("scroll", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (blurCheckTimer !== null) window.clearTimeout(blurCheckTimer);
      if (focusRecheck1 !== null) window.clearTimeout(focusRecheck1);
      if (focusRecheck2 !== null) window.clearTimeout(focusRecheck2);
      if (preLiftVerifyTimer !== null) window.clearTimeout(preLiftVerifyTimer);
      el.removeEventListener("touchstart", handleDirectInputTap);
      el.removeEventListener("pointerdown", handleDirectInputTap);
      el.removeEventListener("focusin", handleFocusIn);
      el.removeEventListener("focusout", handleFocusOut);
      vv.removeEventListener("resize", scheduleUpdate);
      vv.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [isOpen, sheetRef]);
}
