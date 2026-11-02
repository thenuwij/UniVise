import { supabase } from "@/shared/lib/supabase";
import { TERMS_VERSION } from "../data/termsContent";

export function hasAcceptedCurrentTerms(user) {
  return user?.user_metadata?.terms_accepted_version === TERMS_VERSION;
}

export async function recordTermsAccepted() {
  const { error } = await supabase.auth.updateUser({ data: { terms_accepted_at: new Date().toISOString(), terms_accepted_version: TERMS_VERSION } });
  if (error) throw error;
}
