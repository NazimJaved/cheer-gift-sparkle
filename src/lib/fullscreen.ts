/** Cross-browser fullscreen helpers with mobile landscape orientation lock. */

type AnyEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  webkitEnterFullscreen?: () => void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type AnyDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

export function isFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  const d = document as AnyDoc;
  return !!(d.fullscreenElement || d.webkitFullscreenElement);
}

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1024px)").matches || "ontouchstart" in window;
}

async function lockLandscape() {
  if (!isMobile()) return;
  try {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (o: string) => Promise<void>;
    };
    await orientation?.lock?.("landscape");
  } catch {
    /* unsupported (iOS Safari) — ignore */
  }
}

function unlockOrientation() {
  try {
    screen.orientation?.unlock?.();
  } catch {
    /* ignore */
  }
}

export async function enterFullscreen(el: HTMLElement | null) {
  if (!el) return;
  const target = el as AnyEl;
  try {
    if (target.requestFullscreen) await target.requestFullscreen({ navigationUI: "hide" });
    else if (target.webkitRequestFullscreen) await target.webkitRequestFullscreen();
    else if (target.msRequestFullscreen) await target.msRequestFullscreen();
    else {
      // iOS Safari: only the video element itself can go fullscreen
      const iframe = target.querySelector("iframe") as AnyEl | null;
      iframe?.webkitEnterFullscreen?.();
      return;
    }
  } catch {
    return;
  }
  await lockLandscape();
}

export async function exitFullscreen() {
  const d = document as AnyDoc;
  try {
    if (d.exitFullscreen) await d.exitFullscreen();
    else if (d.webkitExitFullscreen) await d.webkitExitFullscreen();
    else if (d.msExitFullscreen) await d.msExitFullscreen();
  } catch {
    /* ignore */
  }
  unlockOrientation();
}

export async function toggleFullscreen(el: HTMLElement | null) {
  if (isFullscreen()) await exitFullscreen();
  else await enterFullscreen(el);
}
