import { Link } from "react-router-dom";

const MESSAGES = {
  general: "UniVise is an independent planning tool, not an official UNSW service.",
  planning: "Your UniVise plan is for guidance only. Confirm course requirements and enrolment decisions with UNSW.",
  comparison: "These are planning estimates, not an official UNSW credit assessment or transfer decision. Confirm credit and program changes with UNSW.",
  enrolment: "UniVise is an independent planning tool, not an official UNSW service. This changes your UniVise plan only and has no effect on your official UNSW enrolment or study plan.",
  eunice: "Eunice is UniVise’s AI assistant, not an official UNSW adviser. Check important details with UNSW and the official Handbook.",
};

export default function IndependenceNotice({ variant = "general", className = "text-xs leading-relaxed text-ink-muted", showTermsLink = true }) {
  return (
    <p className={className}>
      {MESSAGES[variant] || MESSAGES.general}
      {variant === "general" && showTermsLink && (
        <>
          {" "}<Link to="/terms" className="ml-1 whitespace-nowrap text-link underline underline-offset-2">Terms and conditions</Link>
          {" · "}<Link to="/privacy" className="whitespace-nowrap text-link underline underline-offset-2">Privacy Policy</Link>
        </>
      )}
    </p>
  );
}
