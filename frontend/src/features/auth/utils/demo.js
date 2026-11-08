import { supabase } from "@/shared/lib/supabase";
import { apiJson } from "@/shared/lib/api";
import { recordTermsAccepted } from "./terms";

export const isDemoUser = (user) => user?.app_metadata?.demo === true;

// Creates a private demo student on the backend, then signs the browser in as it.
export async function startDemo() {
  const { token_hash: tokenHash } = await apiJson("/demo/session", { method: "POST" });
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (error) throw error;
  await recordTermsAccepted();
  await supabase.auth.refreshSession();
}
