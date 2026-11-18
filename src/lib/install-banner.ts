export const DISMISS_KEY = "voltei-install-dismissed";
export const DISMISS_DAYS = 7;

export function isDismissed(value: string | null, now = Date.now()) {
  const at = Number(value);
  return Number.isFinite(at) && at > 0 && now - at < DISMISS_DAYS * 86400000;
}

export function isIosSafari(ua: string) {
  const ios = /iphone|ipad|ipod/i.test(ua);
  const otherBrowser = /crios|fxios|edgios|opios/i.test(ua);
  return ios && /safari/i.test(ua) && !otherBrowser;
}
