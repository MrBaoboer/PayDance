// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { trayEventNames } from "../lib/app-events";

type UnlistenFn = () => void;

type TrayEventWindow = {
  listen: <T>(
    event: string,
    handler: (event: { payload: T }) => void,
  ) => Promise<UnlistenFn>;
};

export async function registerTrayActions(
  appWindow: TrayEventWindow,
  actions: {
    openSettings: () => Promise<void> | void;
    toggleAlwaysOnTop: () => Promise<void> | void;
    toggleMiniMode: () => Promise<void> | void;
  },
) {
  const unlisteners: UnlistenFn[] = [];

  unlisteners.push(
    await appWindow.listen(trayEventNames.openSettings, () => {
      void actions.openSettings();
    }),
  );

  unlisteners.push(
    await appWindow.listen(trayEventNames.toggleAlwaysOnTop, () => {
      void actions.toggleAlwaysOnTop();
    }),
  );

  unlisteners.push(
    await appWindow.listen(trayEventNames.toggleMiniMode, () => {
      void actions.toggleMiniMode();
    }),
  );

  return unlisteners;
}
