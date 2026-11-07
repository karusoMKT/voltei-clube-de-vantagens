import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, from, maybeSingle } = vi.hoisted(() => ({
  getUser: vi.fn(), from: vi.fn(), maybeSingle: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser }, from } }));
import { getSessionInfo, isStaff } from "@/lib/session";

describe("protected roles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
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
    getUser.mockResolvedValue({ data: { user: null } });
    expect(await getSessionInfo()).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });
  it("only funcionario and dono are store staff", () => {
    expect(isStaff("funcionario")).toBe(true);
    expect(isStaff("dono")).toBe(true);
    expect(isStaff("cliente")).toBe(false);
    expect(isStaff("admin")).toBe(false);
  });
});