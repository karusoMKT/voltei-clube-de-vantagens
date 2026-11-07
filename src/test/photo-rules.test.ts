import { describe, expect, it } from "vitest";
import { MAX_PHOTO_BYTES, photoDimensions, validatePhotoFile } from "@/lib/photo-rules";

describe("photo image rules", () => {
  it("accepts only JPG, PNG and WebP", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) expect(() => validatePhotoFile({ size: 100, type })).not.toThrow();
    expect(() => validatePhotoFile({ size: 100, type: "image/gif" })).toThrow();
  });
  it("accepts 8 MB and rejects larger files", () => {
    expect(MAX_PHOTO_BYTES).toBe(8388608);
    expect(() => validatePhotoFile({ size: 8388608, type: "image/png" })).not.toThrow();
    expect(() => validatePhotoFile({ size: 8388609, type: "image/png" })).toThrow();
  });
  it("reduces the longest side to 1600 without enlarging", () => {
    expect(photoDimensions(3200, 2400)).toEqual({ width: 1600, height: 1200 });
    expect(photoDimensions(1200, 2400)).toEqual({ width: 800, height: 1600 });
    expect(photoDimensions(800, 600)).toEqual({ width: 800, height: 600 });
  });
});