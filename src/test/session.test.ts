import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, getSession, from, maybeSingle } = vi.hoisted(() => ({
  getUser: vi.fn(), getSession: vi.fn(), from: vi.fn(), maybeSingle: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser, getSession }, from },
}));
import { getSessionInfo, isStaff } from "@/lib/session";

describe("protected roles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ data: { session: { access_token: "tok" } } });
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle }) }) });
  });
  it("reads roles from the protected table, not profiles", async () => {
    maybeSingle.mockResolvedValue({ data: { role: "dono", company_id: "company-1" }, error: null });
    expect(await getSessionInfo()).toEqual({ userId: "user-1", role: "dono", companyId: "company-1" });
    expect(from).toHaveBeenCalledWith("user_roles");
  });
  it("denies access when role lookup fails", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: "denied" } });
    expect(await getSessionInfo()).toBeNull();
  });
  it("denies access without a login", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await getSessionInfo()).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });
  it("stays on the login screen when there is no stored session", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    expect(await getSessionInfo()).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });
  it("stays on the login screen when Supabase rejects the token", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "invalid token" } });
    expect(await getSessionInfo()).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });
  it("stays on the login screen when the session check throws", async () => {
    getSession.mockRejectedValue(new Error("offline"));
    expect(await getSessionInfo()).toBeNull();
  });
  it("only funcionario and dono are store staff", () => {
    expect(isStaff("funcionario")).toBe(true);
    expect(isStaff("dono")).toBe(true);
    expect(isStaff("cliente")).toBe(false);
    expect(isStaff("admin")).toBe(false);
  });
});
import { homeFor } from "@/lib/session";
describe("home after sign-in", () => {
  it("admin goes to /admin", () => expect(homeFor("admin")).toBe("/admin"));
  it("owner goes to /empresa", () => expect(homeFor("dono")).toBe("/empresa"));
  it("cashier goes to /caixa", () => expect(homeFor("funcionario")).toBe("/caixa"));
  it("customer goes to /cliente", () => expect(homeFor("cliente")).toBe("/cliente"));
});
