import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Maximize2, MessageCircle, Plus, X } from "lucide-react";
import ChatWindow from "./ChatWindow";
import { currentPage } from "../utils/pageContext";

const HIDDEN = ["/chat", "/survey", "/quiz", "/roadmap-loading"];

export default function EuniceLauncher() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [convId, setConvId] = useState(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const hidden = HIDDEN.some((path) => pathname.startsWith(path));

  useEffect(() => {
    if (hidden) return;
    document.documentElement.classList.add("has-eunice");
    return () => document.documentElement.classList.remove("has-eunice");
  }, [hidden]);

  if (hidden) return null;

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Ask Eunice"
          className="fixed z-40 bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[26rem] h-[min(40rem,calc(100dvh-8rem))] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-line shadow-2xl overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
            <span className="h-9 w-9 flex-shrink-0 rounded-full inline-flex items-center justify-center bg-blue-100 dark:bg-blue-900/50">
              <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-ink-strong leading-tight">Eunice</p>
              <p className="text-xs text-ink-muted">Your academic and career advisor</p>
            </div>
            {convId && (
              <button
                type="button"
                onClick={() => setConvId(null)}
                aria-label="New chat"
                title="New chat"
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
            <Link
              to={convId ? `/chat/${convId}` : "/chat"}
              aria-label="Open full chat"
              title="Open full chat"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              <Maximize2 className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Eunice"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex-1">
            <ChatWindow compact convId={convId ?? undefined} onCreated={(conversation) => setConvId(conversation.id)} getPage={() => currentPage(pathname)} />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close Eunice" : "Ask Eunice"}
        title={open ? "Close Eunice" : "Ask Eunice"}
        className="fixed z-40 bottom-5 right-4 sm:right-6 h-14 w-14 inline-flex items-center justify-center rounded-full text-white bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-xl shadow-blue-600/30 transition"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
      </button>
    </>
  );
}
