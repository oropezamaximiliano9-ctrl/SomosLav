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

// Remember the exact measured iOS keyboard height across opens and reloads (per screen & orientation)
let cachedIosKeyboardHeight: number | null = null;

function getIosKbStorageKey(): string {
  const isLandscape = window.innerWidth > window.innerHeight;
  return `ios_kb_h_${window.screen.width}x${window.screen.height}_${isLandscape ? "L" : "P"}`;
}

function getEstimatedIosKeyboardHeight(): number {
  if (cachedIosKeyboardHeight !== null) return cachedIosKeyboardHeight;
  try {
    const stored = window.localStorage.getItem(getIosKbStorageKey());
    if (stored) {
      const parsed = Number(stored);
      if (Number.isFinite(parsed) && parsed >= 140 && parsed <= 460) {
        cachedIosKeyboardHeight = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors in private mode
  }
  const isLandscape = window.innerWidth > window.innerHeight;
  if (isLandscape) return 185;
  const screenH = Math.max(window.screen.height, window.screen.width);
  if (screenH >= 890) return 346;
  if (screenH >= 800) return 336;
  return 260;
}

function saveMeasuredIosKeyboardHeight(height: number) {
  if (!Number.isFinite(height) || height < 140 || height > 460) return;
  cachedIosKeyboardHeight = height;
  try {
    window.localStorage.setItem(getIosKbStorageKey(), String(height));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Tracks the mobile virtual keyboard via window.visualViewport and drives a
 * dedicated always-promoted GPU wrapper (`kbLayerRef`) with concrete
 * `translate3d(0, -Xpx, 0)` values, completely decoupled from the inner
 * sheet's open/close animation.
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
      // Wait for the inner sheet's 260ms slide+fade exit to finish before silently
      // resetting the outer keyboard wrapper so closing never double-animates.
      const cleanupTimer = window.setTimeout(() => {
        kbLayer.style.transform = "translate3d(0, 0px, 0)";
        if (window.scrollY !== 0 || window.scrollX !== 0) {
          window.scrollTo(0, 0);
        }
      }, 280);
      return () => window.clearTimeout(cleanupTimer);
    }

    const vv = window.visualViewport;
    if (!vv) {
      kbLayer.style.transform = "translate3d(0, 0px, 0)";
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

    // Ensure concrete baseline transform is always present on the GPU wrapper
    kbLayer.style.transform = "translate3d(0, 0px, 0)";

    const getClampedOffset = (desiredOffset: number, viewportHeight: number, offsetTop: number) => {
      const rawOffset = Math.max(0, Math.round(desiredOffset));
      const maxSafeOffset = Math.max(
        0,
        Math.round(window.innerHeight - sheet.offsetHeight - offsetTop - 12)
      );
      return viewportHeight < sheet.offsetHeight + 12 ? Math.min(rawOffset, maxSafeOffset) : rawOffset;
    };

    const applyOffset = (nextOffset: number, force = false) => {
      const clamped = Math.max(0, Math.round(nextOffset));
      const isMeaningfulChange =
        force ||
        (clamped === 0) !== (lastOffset === 0) ||
        Math.abs(clamped - lastOffset) > 4;

      if (isMeaningfulChange && clamped !== lastOffset) {
        lastOffset = clamped;
        kbLayer.style.transform = `translate3d(0, ${-clamped}px, 0)`;
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
          saveMeasuredIosKeyboardHeight(keyboardHeight);
        }
        if (preLiftVerifyTimer !== null) {
          window.clearTimeout(preLiftVerifyTimer);
          preLiftVerifyTimer = null;
        }
        const nextOffset = getClampedOffset(keyboardHeight - vv.offsetTop, vv.height, vv.offsetTop);
        applyOffset(nextOffset);
      } else {
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

      // On top-level iPhone Chrome/Safari, lift immediately on frame 0 when the
      // user directly taps an input so even the very first keyboard open rises
      // in lockstep with the native iOS keyboard before WKWebView's late resize.
      if (canPreLiftIOS && isDirectUserTap && lastOffset === 0) {
        const estimatedHeight = getEstimatedIosKeyboardHeight();
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
            saveMeasuredIosKeyboardHeight(actualKb);
            applyOffset(getClampedOffset(actualKb - vv.offsetTop, vv.height, vv.offsetTop));
          }
        }, 450);
      }

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
        if (isTextInputElement(active) && sheet.contains(active)) return;

        if (preLiftVerifyTimer !== null) {
          window.clearTimeout(preLiftVerifyTimer);
          preLiftVerifyTimer = null;
        }

        if (lastOffset > 0) {
          dismissingUntil = Date.now() + 340;
          applyOffset(0, true);
        }
      }, 35);
    };

    updateFromViewport();
    sheet.addEventListener("touchstart", handleDirectInputTap, { passive: true });
    sheet.addEventListener("pointerdown", handleDirectInputTap, { passive: true });
    sheet.addEventListener("focusin", handleFocusIn);
    sheet.addEventListener("focusout", handleFocusOut);
    vv.addEventListener("resize", scheduleUpdate);
    vv.addEventListener("scroll", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (blurCheckTimer !== null) window.clearTimeout(blurCheckTimer);
      if (focusRecheck1 !== null) window.clearTimeout(focusRecheck1);
      if (focusRecheck2 !== null) window.clearTimeout(focusRecheck2);
      if (preLiftVerifyTimer !== null) window.clearTimeout(preLiftVerifyTimer);
      sheet.removeEventListener("touchstart", handleDirectInputTap);
      sheet.removeEventListener("pointerdown", handleDirectInputTap);
      sheet.removeEventListener("focusin", handleFocusIn);
      sheet.removeEventListener("focusout", handleFocusOut);
      vv.removeEventListener("resize", scheduleUpdate);
      vv.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [isOpen, kbLayerRef, sheetRef]);
}
