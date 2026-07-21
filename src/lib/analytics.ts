// Google Analytics 4 helper. Production-only.
export const GA_MEASUREMENT_ID = "G-YLWDM6LYRM";

export const isGAEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  return import.meta.env.PROD === true;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function pageview(path: string, title?: string) {
  if (!isGAEnabled() || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: title ?? document.title,
  });
}

export function trackEvent(
  name: string,
  params: Record<string, unknown> = {},
) {
  if (!isGAEnabled() || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}