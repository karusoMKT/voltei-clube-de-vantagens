import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, signInWithPassword, updateUser } = vi.hoisted(() => ({ getUser: vi.fn(), signInWithPassword: vi.fn(), updateUser: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser, signInWithPassword, updateUser } } }));
import { changePin, changePinSchema } from "@/lib/pin";

const input = { currentPin: "111111", newPin: "222222", confirmation: "222222" };
beforeEach(() => {
  vi.resetAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "self", email: "self@example.test" } }, error: null });
  signInWithPassword.mockResolvedValue({ data: { user: { id: "self" } }, error: null });
  updateUser.mockResolvedValue({ error: null });
});
describe("troca de PIN compartilhada", () => {
  it("exige PIN atual numérico de seis dígitos", () => {
    expect(changePinSchema.safeParse({ ...input, currentPin: "" }).success).toBe(false);
    expect(changePinSchema.safeParse({ ...input, currentPin: "12345" }).success).toBe(false);
    expect(changePinSchema.safeParse({ ...input, currentPin: "abcdef" }).success).toBe(false);
  });
  it("novo PIN tem exatamente seis números", () => {
    expect(changePinSchema.safeParse(input).success).toBe(true);
    for (const newPin of ["12345", "1234567", "abcdef"]) expect(changePinSchema.safeParse({ ...input, newPin, confirmation: newPin }).success).toBe(false);
  });
  it("confirmação deve coincidir com o novo PIN", () => {
    expect(changePinSchema.safeParse({ ...input, confirmation: "333333" }).success).toBe(false);
  });
  it("PIN atual incorreto impede alteração", async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: "invalid" } });
    await expect(changePin(input)).rejects.toThrow("PIN atual incorreto");
    expect(updateUser).not.toHaveBeenCalled();
  });
  it("reautentica a conta atual antes de salvar novo PIN, sem depender de papel", async () => {
    await changePin(input);
    expect(signInWithPassword).toHaveBeenCalledWith({ email: "self@example.test", password: "111111" });
    expect(updateUser).toHaveBeenCalledWith({ password: "222222" });
    expect(signInWithPassword.mock.invocationCallOrder[0]).toBeLessThan(updateUser.mock.invocationCallOrder[0] ?? 0);
  });
  it("sem sessão válida não altera o PIN", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "expired" } });
    await expect(changePin(input)).rejects.toThrow("Entre novamente");
    expect(signInWithPassword).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });
});