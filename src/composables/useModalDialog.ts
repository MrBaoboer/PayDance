// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { nextTick, onBeforeUnmount, watch, type Ref } from "vue";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const isElementVisible = (element: HTMLElement) => {
  if (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-hidden") === "true"
  ) {
    return false;
  }
  if (element.closest("[hidden], [inert]")) return false;
  if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return false;
  }
  return true;
};

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [];
  return [...container.querySelectorAll<HTMLElement>(focusableSelector)].filter(
    isElementVisible,
  );
};

export function useModalDialog({
  containerRef,
  isOpen,
  onEscape,
}: {
  containerRef: Ref<HTMLElement | null>;
  isOpen: Ref<boolean>;
  onEscape?: () => void;
}) {
  let previousFocus: HTMLElement | null = null;
  let pendingFocusObserver: MutationObserver | null = null;

  const stopPendingFocusObserver = () => {
    pendingFocusObserver?.disconnect();
    pendingFocusObserver = null;
  };

  const focusFirstIfNeeded = () => {
    const container = containerRef.value;
    if (!container || !isOpen.value) return false;
    if (container.contains(document.activeElement)) return true;

    const [first] = getFocusableElements(container);
    if (!first) return false;

    first.focus({ preventScroll: true });
    return true;
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (!isOpen.value) return;

    if (event.key === "Escape") {
      if (!onEscape) return;
      event.preventDefault();
      event.stopPropagation();
      onEscape();
      return;
    }

    if (event.key !== "Tab") return;

    const focusables = getFocusableElements(containerRef.value);
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (!active || active === first || !containerRef.value?.contains(active)) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      }
      return;
    }

    if (!active || active === last || !containerRef.value?.contains(active)) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  };

  watch(
    isOpen,
    async (open, wasOpen) => {
      if (typeof document === "undefined") return;

      stopPendingFocusObserver();

      if (open) {
        previousFocus =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        window.addEventListener("keydown", handleKeydown, true);
        await nextTick();
        if (!isOpen.value) return;
        if (focusFirstIfNeeded()) return;

        // Async dialog chunks (defineAsyncComponent) may finish mounting after the first
        // tick; watch the dialog host until its first focusable control appears.
        if (containerRef.value && typeof MutationObserver !== "undefined") {
          pendingFocusObserver = new MutationObserver(() => {
            if (focusFirstIfNeeded()) {
              stopPendingFocusObserver();
            }
          });
          pendingFocusObserver.observe(containerRef.value, {
            childList: true,
            subtree: true,
          });
        }
        return;
      }

      window.removeEventListener("keydown", handleKeydown, true);
      if (wasOpen && previousFocus?.isConnected) {
        await nextTick();
        previousFocus.focus({ preventScroll: true });
      }
      previousFocus = null;
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    stopPendingFocusObserver();
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKeydown, true);
    }
  });
}
