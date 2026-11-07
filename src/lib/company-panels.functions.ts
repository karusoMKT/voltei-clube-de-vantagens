import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { rateSchema, rewardSchema, summarySchema } from "./company-panels";

const companySchema = z.object({ companyId: z.string().uuid() });
export const getCompanyRewards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: staff } = await context.supabase.rpc("is_staff_of", { _company: data.companyId });
    if (!staff) throw new Error("Você não tem acesso a esta loja.");
    const { data: company, error } = await context.supabase.from("companies").select("id,name,points_per_real").eq("id", data.companyId).single();
    if (error) throw new Error("Não conseguimos carregar a loja agora.");
    const { data: rewards, error: rewardError } = await context.supabase.from("rewards").select("id,name,cost_reais,cost_points,active").eq("company_id",data.companyId).order("cost_points");
    if (rewardError) throw new Error("Não conseguimos carregar os prêmios agora.");
    return { company, rewards };
  });
export const saveCompanyRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companySchema.extend({ rate: rateSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("salvar_regra_pontos", { _company_id: data.companyId, _points_per_real: data.rate });
    return error ? { ok: false, message: error.message } : { ok: true, message: "Regra de pontos salva!" };
  });
export const createCompanyReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => rewardSchema.merge(companySchema).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("criar_premio", { _company_id: data.companyId, _name: data.name, _cost_reais: data.costReais, _cost_points: data.costPoints });
    return error ? { ok: false, message: error.message } : { ok: true, message: "Prêmio criado!" };
  });
export const toggleCompanyReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ rewardId: z.string().uuid(), active: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("ativar_premio", { _reward_id: data.rewardId, _active: data.active });
    return error ? { ok: false, message: error.message } : { ok: true, message: data.active ? "Prêmio ativado!" : "Prêmio desativado." };
  });
export const getCompanySummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: summary, error } = await context.supabase.rpc("resumo_empresa", { _company_id: data.companyId });
    if (error) throw new Error(error.message);
    const { data: company } = await context.supabase.from("companies").select("name").eq("id",data.companyId).single();
    return { ...summarySchema.parse(summary), companyName: company?.name ?? "" };
  });