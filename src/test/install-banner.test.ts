import { describe, expect, it } from "vitest";
import { isDismissed, isIosSafari } from "@/lib/install-banner";

describe("banner de instalação", () => {
  const now = Date.UTC(2026, 10, 18);
  it("fica escondido por 7 dias após dispensar", () => {
    expect(isDismissed(String(now - 6 * 86400000), now)).toBe(true);
    expect(isDismissed(String(now - 8 * 86400000), now)).toBe(false);
    expect(isDismissed(null, now)).toBe(false);
  });
  it("detecta Safari no iPhone, mas não Chrome no iPhone nem Android", () => {
    expect(isIosSafari("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1")).toBe(true);
    expect(isIosSafari("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) CriOS/120 Mobile Safari/604.1")).toBe(false);
    expect(isIosSafari("Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile Safari/537.36")).toBe(false);
  });
});
