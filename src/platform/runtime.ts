export const payDanceTarget =
  import.meta.env.MODE === "web" || import.meta.env.VITE_PAYDANCE_TARGET === "web"
    ? "web"
    : "desktop";

export const isWebPreview = payDanceTarget === "web";
