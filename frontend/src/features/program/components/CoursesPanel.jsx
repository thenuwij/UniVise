import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function CoursesPanel({ open, onClose, intro = null, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="courses-overlay"
            className="fixed inset-0 z-40 bg-slate-900/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
            <motion.section
              key="courses-panel"
              role="dialog"
              aria-modal="true"
              aria-label="My courses"
              className="pointer-events-auto flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.22 }}
            >
              <div className="flex items-center justify-end gap-3 px-4 pt-4">
                {intro && <p className="flex-1 pl-1 pt-1 text-base font-semibold leading-snug text-blue-700 md:pl-6 md:text-lg dark:text-blue-300">{intro}</p>}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close My courses"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-10 md:px-10">{children}</div>
            </motion.section>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
