import { useState } from "react";
import { Button, Modal, ModalBody, ModalHeader, TextInput } from "flowbite-react";
import { Database, Download, Trash2 } from "lucide-react";
import { card } from "@/shared/ui/cardStyles";
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
    <section className={`${card} p-6`}>
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink-strong">
        <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        Your data
      </h2>
      <p className="mt-2 text-[15px] text-ink-muted">Get a copy of everything UniVise stores about you, or delete your account.</p>
      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={downloadData}
          disabled={downloading}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-blue-800 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/60 border-2 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {downloading ? "Preparing your data..." : "Download my data"}
        </button>
        {downloadError && <p className="text-sm text-red-600 dark:text-red-400">{downloadError}</p>}
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-red-700 dark:text-red-300 bg-white dark:bg-slate-900 border-2 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Delete my account
        </button>
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
    </section>
  );
}
