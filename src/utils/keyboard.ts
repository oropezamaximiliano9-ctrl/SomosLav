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
 * Smoothly resets Safari/iOS viewport scroll after keyboard dismissal to prevent
 * the classic ghost gap strip at the bottom of the screen.
 */
let safariScrollFallbackTimer: number | null = null;

export function resetSafariViewportScroll() {
  if (typeof window === "undefined") return;
  if (window.scrollY !== 0 || window.scrollX !== 0) {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
  }
  if (safariScrollFallbackTimer !== null) {
    window.clearTimeout(safariScrollFallbackTimer);
  }
  safariScrollFallbackTimer = window.setTimeout(() => {
    safariScrollFallbackTimer = null;
    if (window.scrollY !== 0 || window.scrollX !== 0) {
      window.scrollTo(0, 0);
    }
  }, 150);
}

/**
 * Reference-counted background scroll lock so overlapping bottom sheets
 * (e.g., DatePicker -> Registration) never momentarily unlock body scroll.
 */
let bodyScrollLockCount = 0;

export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    bodyScrollLockCount += 1;
    document.body.classList.add("sheet-scroll-locked");

    return () => {
      bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
      if (bodyScrollLockCount === 0) {
        document.body.classList.remove("sheet-scroll-locked");
      }
    };
  }, [isOpen]);
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
 * Tracks the mobile virtual keyboard via window.visualViewport ("resize" & "scroll")
 * and moves a dedicated GPU wrapper (`kbLayerRef`) strictly via `translate3d(0, Y, 0)`
 * with Apple's native 280ms cubic-bezier(0.32, 0.72, 0, 1) curve.
 *
 * - Dynamically clamps sheet `max-height` to `visualViewport.height`.
 * - Expands the sheet smoothly upward on input focus without animating `height` or `bottom`.
 * - Smoothly resets Safari viewport scroll when the keyboard closes or an input blurs.
 */
export function useKeyboardSheetOffset(
  isOpen: boolean,
  kbLayerRef: RefObject<HTMLDivElement | null>,
  sheetRef: RefObject<HTMLDivElement | null>,
  contentRef?: RefObject<HTMLDivElement | null>
) {
  // Position kbLayer at compact resting offset before first paint when opening
  useLayoutEffect(() => {
    const kbLayer = kbLayerRef.current;
    const sheet = sheetRef.current;
    if (!isOpen || !kbLayer || !sheet || typeof window === "undefined") return;

    const vv = window.visualViewport;
    if (vv) {
      sheet.style.maxHeight = `${Math.max(220, Math.round(vv.height - 16))}px`;
    }

    const active = document.activeElement;
    const alreadyFocused = Boolean(isTextInputElement(active) && sheet.contains(active));
    if (alreadyFocused) return;

    const contentEl = contentRef?.current;
    const naturalHeight = contentEl ? contentEl.offsetHeight + 64 : sheet.offsetHeight;
    const restingY = Math.max(0, Math.round(sheet.offsetHeight - naturalHeight));

    kbLayer.style.transition = "none";
    kbLayer.style.transform = `translate3d(0, ${restingY}px, 0)`;
    void kbLayer.offsetHeight; // commit resting position before opening transition starts
    kbLayer.style.transition = "";
  }, [isOpen, kbLayerRef, sheetRef, contentRef]);

  useEffect(() => {
    const kbLayer = kbLayerRef.current;
    const sheet = sheetRef.current;
    if (!kbLayer || !sheet || typeof window === "undefined") return;

    if (!isOpen) {
      // Wait for the inner sheet's 280ms slide-down exit to finish before resetting the outer wrapper
      const cleanupTimer = window.setTimeout(() => {
        kbLayer.style.transition = "none";
        kbLayer.style.transform = "translate3d(0, 0px, 0)";
        void kbLayer.offsetHeight;
        kbLayer.style.transition = "";
        sheet.style.maxHeight = "";
        resetSafariViewportScroll();
      }, 300);
      return () => window.clearTimeout(cleanupTimer);
    }

    const vv = window.visualViewport;
    const isIOS = isIOSDevice();
    const canPreLiftIOS = isIOS && isTopLevelWindow();

    let rafId: number | null = null;
    let blurCheckTimer: number | null = null;
    let focusRecheck1: number | null = null;
    let focusRecheck2: number | null = null;
    let preLiftVerifyTimer: number | null = null;

    let isInputFocused = Boolean(
      isTextInputElement(document.activeElement) && sheet.contains(document.activeElement)
    );
    let lastKeyboardOffset = 0;
    let lastAppliedY: number | null = null;
    let dismissingUntil = 0;
    let lastDirectInputTapAt = 0;

    const getRestingY = (): number => {
      const contentEl = contentRef?.current;
      if (!contentEl) return 0;
      const naturalHeight = contentEl.offsetHeight + 64;
      return Math.max(0, Math.round(sheet.offsetHeight - naturalHeight));
    };

    const applyTranslateY = (nextY: number, force = false) => {
      const rounded = Math.round(nextY);
      const isMeaningfulChange =
        force ||
        lastAppliedY === null ||
        (rounded <= 0) !== (lastAppliedY <= 0) ||
        Math.abs(rounded - lastAppliedY) > 4;

      if (isMeaningfulChange && rounded !== lastAppliedY) {
        lastAppliedY = rounded;
        kbLayer.style.transform = `translate3d(0, ${rounded}px, 0)`;
      }
    };

    const syncMaxHeight = (viewportHeight: number) => {
      const availableHeight = Math.max(220, Math.round(viewportHeight - 16));
      sheet.style.maxHeight = `${availableHeight}px`;
    };

    const updateFromViewport = () => {
      rafId = null;

      if (!vv) {
        sheet.style.maxHeight = "90dvh";
        applyTranslateY(isInputFocused ? 0 : getRestingY());
        return;
      }

      syncMaxHeight(vv.height);

      // Exact real keyboard displacement formula (handles iOS Safari/Chrome offsetTop panning & Android resizes-content)
      const keyboardOffset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      const rawViewportDelta = Math.max(0, Math.round(window.innerHeight - vv.height));
      const isKeyboardOpen = rawViewportDelta > 100 || keyboardOffset > 80;

      // Ignore stale visualViewport frames briefly while iOS keyboard is animating down
      if (isIOS && Date.now() < dismissingUntil) {
        if (!isKeyboardOpen) {
          resetSafariViewportScroll();
        }
        return;
      }

      if (isKeyboardOpen) {
        if (canPreLiftIOS && rawViewportDelta > 100) {
          saveMeasuredIosKeyboardHeight(rawViewportDelta);
        }
        if (preLiftVerifyTimer !== null) {
          window.clearTimeout(preLiftVerifyTimer);
          preLiftVerifyTimer = null;
        }
        lastKeyboardOffset = keyboardOffset;
        applyTranslateY(-keyboardOffset);
      } else {
        if (canPreLiftIOS && preLiftVerifyTimer !== null) {
          return;
        }
        const wasKeyboardOpen = lastKeyboardOffset > 0;
        lastKeyboardOffset = 0;
        applyTranslateY(isInputFocused ? 0 : getRestingY());
        if (wasKeyboardOpen) {
          resetSafariViewportScroll();
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

      isInputFocused = true;
      dismissingUntil = 0;
      if (blurCheckTimer !== null) {
        window.clearTimeout(blurCheckTimer);
        blurCheckTimer = null;
      }

      const isDirectUserTap = Date.now() - lastDirectInputTapAt < 450;

      if (canPreLiftIOS && isDirectUserTap && lastKeyboardOffset === 0 && vv) {
        // Pre-lift immediately on frame 0 in lockstep with Apple's native keyboard animation
        const estimatedHeight = getEstimatedIosKeyboardHeight();
        const estimatedOffset = Math.max(0, Math.round(estimatedHeight - vv.offsetTop));
        lastKeyboardOffset = estimatedOffset;
        applyTranslateY(-estimatedOffset, true);

        if (preLiftVerifyTimer !== null) window.clearTimeout(preLiftVerifyTimer);
        preLiftVerifyTimer = window.setTimeout(() => {
          preLiftVerifyTimer = null;
          const actualOffset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
          const actualDelta = Math.max(0, Math.round(window.innerHeight - vv.height));
          syncMaxHeight(vv.height);
          if (actualDelta <= 80 && actualOffset <= 80) {
            lastKeyboardOffset = 0;
            applyTranslateY(isInputFocused ? 0 : getRestingY(), true);
          } else {
            if (actualDelta > 100) saveMeasuredIosKeyboardHeight(actualDelta);
            lastKeyboardOffset = actualOffset;
            applyTranslateY(-actualOffset);
          }
        }, 450);
      } else if (lastKeyboardOffset === 0) {
        // Expand sheet upward smoothly on input focus (Android Chrome / iframe / desktop)
        applyTranslateY(0, true);
      }

      scheduleUpdate();
      if (focusRecheck1 !== null) window.clearTimeout(focusRecheck1);
      if (focusRecheck2 !== null) window.clearTimeout(focusRecheck2);
      focusRecheck1 = window.setTimeout(scheduleUpdate, 120);
      focusRecheck2 = window.setTimeout(scheduleUpdate, 300);
    };

    const handleFocusOut = () => {
      if (blurCheckTimer !== null) window.clearTimeout(blurCheckTimer);
      blurCheckTimer = window.setTimeout(() => {
        blurCheckTimer = null;
        const active = document.activeElement;
        if (isTextInputElement(active) && sheet.contains(active)) return;

        isInputFocused = false;
        if (preLiftVerifyTimer !== null) {
          window.clearTimeout(preLiftVerifyTimer);
          preLiftVerifyTimer = null;
        }

        const hadKeyboard = lastKeyboardOffset > 0;
        lastKeyboardOffset = 0;
        if (isIOS && hadKeyboard) {
          dismissingUntil = Date.now() + 340;
        }

        if (vv) {
          syncMaxHeight(vv.height);
        }
        applyTranslateY(getRestingY(), true);
        resetSafariViewportScroll();
      }, 45);
    };

    // Observe resting content height changes (e.g., error banner, verifying, registered state)
    let contentResizeObserver: ResizeObserver | null = null;
    if (contentRef?.current && typeof ResizeObserver !== "undefined") {
      contentResizeObserver = new ResizeObserver(() => {
        if (!isInputFocused && lastKeyboardOffset === 0) {
          applyTranslateY(getRestingY());
        }
      });
      contentResizeObserver.observe(contentRef.current);
    }

    updateFromViewport();
    sheet.addEventListener("touchstart", handleDirectInputTap, { passive: true });
    sheet.addEventListener("pointerdown", handleDirectInputTap, { passive: true });
    sheet.addEventListener("focusin", handleFocusIn);
    sheet.addEventListener("focusout", handleFocusOut);
    vv?.addEventListener("resize", scheduleUpdate);
    vv?.addEventListener("scroll", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (blurCheckTimer !== null) window.clearTimeout(blurCheckTimer);
      if (focusRecheck1 !== null) window.clearTimeout(focusRecheck1);
      if (focusRecheck2 !== null) window.clearTimeout(focusRecheck2);
      if (preLiftVerifyTimer !== null) window.clearTimeout(preLiftVerifyTimer);
      contentResizeObserver?.disconnect();
      sheet.removeEventListener("touchstart", handleDirectInputTap);
      sheet.removeEventListener("pointerdown", handleDirectInputTap);
      sheet.removeEventListener("focusin", handleFocusIn);
      sheet.removeEventListener("focusout", handleFocusOut);
      vv?.removeEventListener("resize", scheduleUpdate);
      vv?.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [isOpen, kbLayerRef, sheetRef, contentRef]);
}
