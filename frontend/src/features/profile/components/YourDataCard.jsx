import { useState } from "react";
import { Button, Modal, ModalBody, ModalHeader, TextInput } from "flowbite-react";
import { HiOutlineCircleStack } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "@/app/AuthContext";
import { apiFetch } from "@/shared/lib/api";
import { supabase } from "@/shared/lib/supabase";

const CONFIRM_WORD = "DELETE";

export default function YourDataCard() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const downloadData = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      const res = await apiFetch("/user/me/export", { token: session?.access_token });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `univise-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setDownloadError("Could not prepare your data. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const closeDelete = () => {
    if (deleting) return;
    setShowDelete(false);
    setConfirmText("");
    setDeleteError("");
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await apiFetch("/user/me", { method: "DELETE", token: session?.access_token });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error(err);
      setDeleteError("Could not delete your account. Please try again.");
      setDeleting(false);
      return;
    }
    await supabase.auth.signOut({ scope: "local" });
    navigate("/", { replace: true });
  };

  return (
    <div className="card-glass-spotlight">
      <div />
      <div className="relative p-6">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineCircleStack className="h-5 w-5 text-slate-500" />
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Your data</h2>
        </div>
        <div className="space-y-3">
          <Button pill size="sm" color="light" className="w-full" onClick={downloadData} disabled={downloading}>
            {downloading ? "Preparing your data..." : "Download my data"}
          </Button>
          {downloadError && <p className="text-sm text-red-600 dark:text-red-400">{downloadError}</p>}
          <Button pill size="sm" color="red" outline className="w-full" onClick={() => setShowDelete(true)}>
            Delete my account
          </Button>
        </div>
      </div>

      <Modal show={showDelete} size="md" onClose={closeDelete} popup>
        <ModalHeader>
          <p className="text-lg font-medium p-4">Delete your account?</p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              This permanently deletes your account and everything UniVise stores about you: your survey answers,
              roadmaps, chats, saved items and completed courses. It can't be undone.
            </p>
            <div>
              <label htmlFor="confirmDelete" className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                Type {CONFIRM_WORD} to confirm
              </label>
              <TextInput
                id="confirmDelete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
                disabled={deleting}
              />
            </div>
            {deleteError && <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>}
            <div className="flex justify-end gap-2">
              <Button color="gray" pill onClick={closeDelete} disabled={deleting}>
                Cancel
              </Button>
              <Button color="red" pill onClick={deleteAccount} disabled={confirmText !== CONFIRM_WORD || deleting}>
                {deleting ? "Deleting..." : "Delete account"}
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
