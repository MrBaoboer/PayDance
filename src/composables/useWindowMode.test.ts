import { ref } from "vue";
import { describe, expect, it } from "vitest";
import { miniDefaultSize } from "../lib/window-mode";
import { useWindowMode } from "./useWindowMode";

const createManagedWindow = () => {
  const alwaysOnTopCalls: boolean[] = [];

  return {
    alwaysOnTopCalls,
    window: {
      setAlwaysOnTop: async (value: boolean) => {
        alwaysOnTopCalls.push(value);
      },
      setMinSize: async () => {},
      setResizable: async () => {},
      setSize: async () => {},
    },
  };
};

const lastCall = (calls: boolean[]) => calls[calls.length - 1];

describe("useWindowMode", () => {
  it("keeps the full-window topmost preference when mini mode applies topmost", async () => {
    const managedWindow = createManagedWindow();
    const isMiniMode = ref(false);
    const miniSize = ref({ ...miniDefaultSize });
    const alwaysOnTop = ref(false);
    const { applyWindowMode } = useWindowMode(
      managedWindow.window,
      isMiniMode,
      miniSize,
      alwaysOnTop,
    );

    isMiniMode.value = true;
    await applyWindowMode();

    expect(lastCall(managedWindow.alwaysOnTopCalls)).toBe(true);
    expect(alwaysOnTop.value).toBe(false);

    isMiniMode.value = false;
    await applyWindowMode();

    expect(lastCall(managedWindow.alwaysOnTopCalls)).toBe(false);
  });

  it("updates full-window topmost preference from mini mode while keeping mini mode topmost", async () => {
    const managedWindow = createManagedWindow();
    const isMiniMode = ref(true);
    const miniSize = ref({ ...miniDefaultSize });
    const alwaysOnTop = ref(true);
    const { setAlwaysOnTop } = useWindowMode(
      managedWindow.window,
      isMiniMode,
      miniSize,
      alwaysOnTop,
    );

    await setAlwaysOnTop(false);

    expect(alwaysOnTop.value).toBe(false);
    expect(lastCall(managedWindow.alwaysOnTopCalls)).toBe(true);
  });
});
