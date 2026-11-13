import { describe, expect, it } from "vitest";
import { satisfactionEnabled, satisfactionResponseSchema, satisfactionSettingsSchema, googleUrlSchema, showGoogleInvitation } from "@/lib/satisfaction";
const companyId = "00000000-0000-4000-8000-000000000001";
describe("pesquisa Premium", () => {
  it("uses the requested default of 30 points", () => expect(satisfactionSettingsSchema.parse({ companyId, url: "" }).points).toBe(30));
  it("only enables active Premium stores", () => { expect(satisfactionEnabled("premium",true)).toBe(true); expect(satisfactionEnabled("pro",true)).toBe(false); expect(satisfactionEnabled("basic",true)).toBe(false); expect(satisfactionEnabled("premium",false)).toBe(false); });
  it("accepts every score from 1 to 5", () => { for (const rating of [1,2,3,4,5]) expect(satisfactionResponseSchema.safeParse({ companyId, rating }).success).toBe(true); expect(satisfactionResponseSchema.safeParse({ companyId, rating: 0 }).success).toBe(false); expect(satisfactionResponseSchema.safeParse({ companyId, rating: 6 }).success).toBe(false); });
  it("accepts Google links but rejects unsafe or lookalike hosts", () => { expect(googleUrlSchema.safeParse("https://g.page/r/example/review").success).toBe(true); for (const url of ["javascript:alert(1)", "https://google.com.evil.test", "https://google.com@evil.test"]) expect(googleUrlSchema.safeParse(url).success).toBe(false); });
  it("keeps Google optional after any submitted score", () => { expect(showGoogleInvitation(true,"https://g.page/r/example/review")).toBe(true); expect(showGoogleInvitation(false,"https://g.page/r/example/review")).toBe(false); expect(showGoogleInvitation(true,null)).toBe(false); });
});
