import { supabase } from "@/shared/lib/supabase";
import { MINIMUM_AGE, TERMS_VERSION } from "../data/termsContent";

export function hasAcceptedCurrentTerms(user) {
  return user?.user_metadata?.terms_accepted_version === TERMS_VERSION;
}

export async function recordTermsAccepted() {
  const { error } = await supabase.auth.updateUser({ data: { terms_accepted_at: new Date().toISOString(), terms_accepted_version: TERMS_VERSION } });
  if (error) throw error;
}

export function isOldEnough(dob, today = new Date()) {
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return false;
  const cutoff = new Date(today.getFullYear() - MINIMUM_AGE, today.getMonth(), today.getDate());
  return birth <= cutoff;
}
