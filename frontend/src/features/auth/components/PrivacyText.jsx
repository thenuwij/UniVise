import { PRIVACY_SECTIONS, PRIVACY_SUMMARY, PRIVACY_UPDATED } from "../data/privacyContent";
import { LegalDocument } from "./LegalDocument";

export function PrivacyText({ scrollable = true }) {
  return (
    <LegalDocument
      id="privacy"
      title="UniVise Privacy Policy"
      meta={`Last updated ${PRIVACY_UPDATED}`}
      summary={PRIVACY_SUMMARY}
      sections={PRIVACY_SECTIONS}
      scrollable={scrollable}
    />
  );
}
