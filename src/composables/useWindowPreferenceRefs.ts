// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { ref } from "vue";
import {
  defaultMiniOpacityPercent,
  fullWindowSize,
  miniDefaultSize,
  resolveWindowPreferences,
  type WindowPosition,
  type WindowSize,
} from "../lib/window-mode";

export function useWindowPreferenceRefs() {
  const isMiniMode = ref(false);
  const fullSize = ref<WindowSize>({ ...fullWindowSize });
  const miniSize = ref<WindowSize>({ ...miniDefaultSize });
  const miniOpacityPercent = ref(defaultMiniOpacityPercent);
  const mainPosition = ref<WindowPosition | undefined>(undefined);
  const miniPosition = ref<WindowPosition | undefined>(undefined);
  const defaultWindowPreferences = resolveWindowPreferences({});

  const applyLoadedWindowPreferences = (
    windowPreferences: ReturnType<typeof resolveWindowPreferences>,
    options: { restoreMiniMode?: boolean } = {},
  ) => {
    if (options.restoreMiniMode !== false) {
      isMiniMode.value = windowPreferences.isMiniMode;
    }
    fullSize.value = windowPreferences.fullSize;
    miniSize.value = windowPreferences.miniSize;
    miniOpacityPercent.value = windowPreferences.miniOpacityPercent;
    mainPosition.value = windowPreferences.mainPosition;
    miniPosition.value = windowPreferences.miniPosition;
  };

  return {
    applyLoadedWindowPreferences,
    defaultWindowPreferences,
    fullSize,
    isMiniMode,
    mainPosition,
    miniOpacityPercent,
    miniPosition,
    miniSize,
  };
}
