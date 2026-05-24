import { miniResizeEdgeSize } from "../lib/window-mode";

type DraggableWindow = {
  startDragging: () => Promise<void>;
};

export function useMiniWindowDrag(appWindow: DraggableWindow) {
  let clearMiniDragListeners: (() => void) | undefined;

  const clearMiniDrag = () => {
    clearMiniDragListeners?.();
    clearMiniDragListeners = undefined;
  };

  const isNearResizeEdge = (event: PointerEvent) => {
    const target = event.currentTarget as HTMLElement | null;
    const rect = target?.getBoundingClientRect();
    if (!rect) return false;

    return (
      event.clientX - rect.left <= miniResizeEdgeSize ||
      rect.right - event.clientX <= miniResizeEdgeSize ||
      event.clientY - rect.top <= miniResizeEdgeSize ||
      rect.bottom - event.clientY <= miniResizeEdgeSize
    );
  };

  const startMiniDrag = (event: PointerEvent) => {
    if (event.button !== 0 || event.detail > 1) return;
    if (isNearResizeEdge(event)) return;

    const startX = event.screenX;
    const startY = event.screenY;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const distance = Math.hypot(moveEvent.screenX - startX, moveEvent.screenY - startY);
      if (distance < 4) return;

      clearMiniDrag();
      void appWindow.startDragging();
    };

    const handlePointerEnd = () => clearMiniDrag();

    clearMiniDrag();
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd, { once: true });
    window.addEventListener("pointercancel", handlePointerEnd, { once: true });

    clearMiniDragListeners = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  };

  return {
    clearMiniDrag,
    startMiniDrag,
  };
}
