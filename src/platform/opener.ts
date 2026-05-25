import { isWebPreview } from "./runtime";

export const openExternalUrl = async (url: string) => {
  if (isWebPreview) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  const { openUrl } = await import("@tauri-apps/plugin-opener");
  await openUrl(url);
};
