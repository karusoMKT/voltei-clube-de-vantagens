CREATE INDEX IF NOT EXISTS referral_codes_referrer_idx ON public.referral_codes(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_referred_idx ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals(referrer_id);