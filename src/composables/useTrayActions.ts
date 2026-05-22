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
    await appWindow.listen("tray-open-settings", () => {
      void actions.openSettings();
    }),
  );

  unlisteners.push(
    await appWindow.listen("tray-toggle-always-on-top", () => {
      void actions.toggleAlwaysOnTop();
    }),
  );

  unlisteners.push(
    await appWindow.listen("tray-toggle-mini-mode", () => {
      void actions.toggleMiniMode();
    }),
  );

  return unlisteners;
}
