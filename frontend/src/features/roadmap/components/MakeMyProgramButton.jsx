import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, ModalBody, ModalHeader } from "flowbite-react";
import { GraduationCap } from "lucide-react";
import { bandButton } from "@/shared/ui/cardStyles";
import { UserAuth } from "@/app/AuthContext";
import { changeEnrolledProgram } from "@/features/transfer/utils/enrolledProgram";

export default function MakeMyProgramButton({ degreeCode, programName, label = "Make this my program", className = bandButton, onBeforeChange }) {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const userId = session?.user?.id;

  const close = () => {
    if (saving) return;
    setOpen(false);
    setError("");
  };

  const confirm = async () => {
    setSaving(true);
    setError("");
    try {
      if (onBeforeChange) await onBeforeChange();
      await changeEnrolledProgram(userId, { degree_code: degreeCode, program_name: programName });
    } catch (err) {
      console.error("Changing program failed:", err);
      setError("Couldn't change your program. Please try again.");
      setSaving(false);
      return;
    }
    navigate("/roadmap-entryload");
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <GraduationCap className="h-4 w-4" />
        {label}
      </button>

      <Modal show={open} size="md" onClose={close} popup>
        <ModalHeader>
          <p className="text-lg font-medium p-4">Set {programName} as your program?</p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Your ticked courses stay. Majors are chosen per program.
            </p>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold text-blue-800 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/60 border-2 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={saving || !userId}
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : label}
              </button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </>
  );
}
