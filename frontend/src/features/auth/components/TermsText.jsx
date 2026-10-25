import { TERMS_SECTIONS, TERMS_SUMMARY, TERMS_UPDATED, TERMS_VERSION } from "../data/termsContent";
import { LegalDocument } from "./LegalDocument";

export function TermsText({ scrollable = true }) {
  return (
    <LegalDocument
      id="terms"
      title="UniVise Terms and Conditions"
      meta={`Version ${TERMS_VERSION} · Last updated ${TERMS_UPDATED}`}
      summary={TERMS_SUMMARY}
      sections={TERMS_SECTIONS}
      scrollable={scrollable}
    />
  );
}
