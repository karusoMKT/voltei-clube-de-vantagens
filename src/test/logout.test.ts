import type { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signOut } } }));
import { signOutAndLeave, type GoToEntrar } from "@/lib/logout";

function fakeQueryClient(order: string[]) {
  const cancelQueries = vi.fn(async () => { order.push("cancelQueries"); });
  const clear = vi.fn(() => { order.push("clear"); });
  return { queryClient: { cancelQueries, clear } as unknown as QueryClient, cancelQueries, clear };
}

describe("sair", () => {
  it("stops queries, clears cache, ends the session and opens /entrar", async () => {
    const order: string[] = [];
    const { queryClient, cancelQueries, clear } = fakeQueryClient(order);
    signOut.mockImplementation(async () => { order.push("signOut"); });
    const navigate = vi.fn<GoToEntrar>(() => { order.push("navigate"); });

    await signOutAndLeave({ queryClient, navigate });

    expect(order).toEqual(["cancelQueries", "clear", "signOut", "navigate"]);
    expect(cancelQueries).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith({ to: "/entrar", replace: true });
  });

  it("still opens /entrar when Supabase fails to end the session", async () => {
    const order: string[] = [];
    const { queryClient } = fakeQueryClient(order);
    signOut.mockImplementation(async () => { order.push("signOut"); throw new Error("network down"); });
    const navigate = vi.fn<GoToEntrar>(() => { order.push("navigate"); });

    await expect(signOutAndLeave({ queryClient, navigate })).rejects.toThrow("network down");

    expect(order).toEqual(["cancelQueries", "clear", "signOut", "navigate"]);
    expect(navigate).toHaveBeenCalledWith({ to: "/entrar", replace: true });
  });
});
