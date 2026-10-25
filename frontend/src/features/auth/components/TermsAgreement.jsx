import { Modal, ModalBody, ModalHeader } from "flowbite-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { TermsText } from "./TermsText";
import { footerLink } from "./authStyles";

export function TermsAgreement({ id, checked, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-line accent-blue-600 cursor-pointer"
      />
      <label htmlFor={id} className="text-sm text-ink">
        I agree to the{" "}
        <button type="button" className={footerLink} onClick={() => setOpen(true)}>
          Terms and conditions
        </button>{" "}
        and have read the{" "}
        <Link to="/privacy" target="_blank" rel="noopener" className={footerLink}>
          Privacy Policy
        </Link>
      </label>
      <Modal show={open} onClose={() => setOpen(false)}>
        <ModalHeader>Terms & Conditions</ModalHeader>
        <ModalBody>
          <TermsText />
        </ModalBody>
      </Modal>
    </>
  );
}
