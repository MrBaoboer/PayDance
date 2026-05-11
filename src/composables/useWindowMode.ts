import { LogicalSize } from "@tauri-apps/api/dpi";
import type { Ref } from "vue";
import {
  fullWindowMinSize,
  fullWindowSize,
  miniMinSize,
  normalizeMiniSize,
  type WindowSize,
} from "../lib/window-mode";

type ManagedWindow = {
  setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<void>;
  setMinSize: (size: LogicalSize) => Promise<void>;
  setResizable: (resizable: boolean) => Promise<void>;
  setSize: (size: LogicalSize) => Promise<void>;
};

export function useWindowMode(
  appWindow: ManagedWindow,
  isMiniMode: Ref<boolean>,
  miniSize: Ref<WindowSize>,
  alwaysOnTop: Ref<boolean>,
) {
  const applyWindowMode = async () => {
    await appWindow.setResizable(true);

    if (isMiniMode.value) {
      const size = normalizeMiniSize(miniSize.value);
      miniSize.value = size;
      await appWindow.setMinSize(new LogicalSize(miniMinSize.width, miniMinSize.height));
      await appWindow.setSize(new LogicalSize(size.width, size.height));
      await appWindow.setAlwaysOnTop(true);
      return;
    }

    await appWindow.setMinSize(
      new LogicalSize(fullWindowMinSize.width, fullWindowMinSize.height),
    );
    await appWindow.setSize(new LogicalSize(fullWindowSize.width, fullWindowSize.height));
    await appWindow.setAlwaysOnTop(alwaysOnTop.value);
  };

  const setAlwaysOnTop = async (value: boolean) => {
    alwaysOnTop.value = value;
    await appWindow.setAlwaysOnTop(isMiniMode.value ? true : alwaysOnTop.value);
  };

  return {
    applyWindowMode,
    setAlwaysOnTop,
  };
}
