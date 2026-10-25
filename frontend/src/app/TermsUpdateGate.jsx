import { useState } from "react";
import { TermsAgreement } from "@/features/auth/components/TermsAgreement";
import { hasAcceptedCurrentTerms, recordTermsAccepted } from "@/features/auth/utils/terms";
import { UserAuth } from "./AuthContext";

export default function TermsUpdateGate({ children }) {
  const { session, signOut } = UserAuth();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (hasAcceptedCurrentTerms(session?.user)) return children;

  const accept = async () => {
    setSaving(true);
    setError("");
    try {
      await recordTermsAccepted();
    } catch {
      setError("We couldn't save that. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 app-page">
      <div className="max-w-md w-full rounded-2xl p-8 shadow-2xl card-glass-spotlight">
        <h1 className="text-2xl font-bold text-ink-strong mb-2">We've updated our Terms</h1>
        <p className="text-sm text-ink-muted mb-6">
          Please read and accept the new Terms and conditions to keep using UniVise. You can still download or delete your data from My account.
        </p>
        <div className="flex items-start gap-3 mb-6">
          <TermsAgreement id="terms-update" checked={agreed} onChange={setAgreed} />
        </div>
        {error && <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={accept}
            disabled={!agreed || saving}
            className="button-primary flex-1 px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Saving..." : "Continue"}
          </button>
          <button
            type="button"
            onClick={signOut}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-ink-muted hover:text-ink-strong"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
