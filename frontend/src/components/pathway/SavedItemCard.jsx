// src/components/pathway/SavedItemCard.jsx
import { useEffect, useRef, useState } from "react";
import {
  HiAcademicCap,
  HiBriefcase,
  HiCheck,
  HiClipboard,
  HiPencil,
  HiTrash,
  HiUsers,
  HiX,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import CareerPathCard from "./CareerPathCard";
import CommunityCard from "./CommunityCard";
import CourseCard from "./CourseCard";
import InternshipCard from "./InternshipCard";
import SpecialisationCard from "./SpecialisationCard";

const MAX_CHARS = 600;

export default function SavedItemCard({ item, onRemove }) {
  const navigate = useNavigate();

  const [degreeData, setDegreeData] = useState(null);
  const [loadingDegree, setLoadingDegree] = useState(false);

  const [notes, setNotes] = useState(item.personal_notes || "");
  const [showNotes, setShowNotes] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved'
  const [lastSaved, setLastSaved] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const debounceRef = useRef(null);
  const textareaRef = useRef(null);
  const confirmTimeout = useRef(null);

  const isDegree = item.item_type === "degree";
  const snapshot = item.item_data || {};
  const hasNotes = notes.trim().length > 0;
  const charsLeft = MAX_CHARS - notes.length;

  // Fetch degree data
  useEffect(() => {
    if (!isDegree) return;
    const fetchDegree = async () => {
      setLoadingDegree(true);
      const isUUID = item.item_id.includes('-');
      let data, error;
      if (isUUID) {
        ({ data, error } = await supabase.from("unsw_degrees_final").select("*").eq("id", item.item_id).maybeSingle());
      } else {
        ({ data, error } = await supabase.from("unsw_degrees_final").select("*").eq("degree_code", item.item_id).maybeSingle());
      }
      if (error) console.error("Degree fetch error:", error);
      else if (data) setDegreeData(data);
      else {
        const parsed = typeof item.item_data === 'string' ? JSON.parse(item.item_data) : item.item_data;
        setDegreeData(parsed);
      }
      setLoadingDegree(false);
    };
    fetchDegree();
  }, [item, isDegree]);

  // Auto-focus textarea when notes panel opens
  useEffect(() => {
    if (showNotes) textareaRef.current?.focus();
  }, [showNotes]);

  // Auto-save notes with debounce
  useEffect(() => {
    if (notes === (item.personal_notes || "")) return;
    setSaveStatus('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from("user_saved_items")
        .update({ personal_notes: notes })
        .eq("id", item.id);
      if (!error) {
        setSaveStatus('saved');
        setLastSaved(new Date());
        setTimeout(() => setSaveStatus(null), 2500);
      }
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [notes, item.id, item.personal_notes]);

  // Reset confirm delete after 3s of no action
  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      confirmTimeout.current = setTimeout(() => setConfirmDelete(false), 3000);
    } else {
      clearTimeout(confirmTimeout.current);
      onRemove(item.id);
    }
  };

  useEffect(() => () => {
    clearTimeout(confirmTimeout.current);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const formatDate = (dt) => {
    if (!dt) return "";
    const date = new Date(dt);
    const diff = Math.floor((Date.now() - date) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff}d ago`;
    return date.toLocaleDateString();
  };

  const formatTime = (dt) => {
    if (!dt) return "";
    const diff = Math.floor((Date.now() - new Date(dt)) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const getIcon = () => {
    switch (item.item_type) {
      case "degree":
      case "major":
      case "minor":
      case "specialisation":
        return <HiAcademicCap className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case "course":
        return <HiClipboard className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case "society":
        return <HiUsers className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case "internship":
      case "career_path":
        return <HiBriefcase className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      default:
        return <HiAcademicCap className="w-5 h-5 text-slate-500" />;
    }
  };

  const gotoDetails = () => {
    if (item.item_type === "degree" && degreeData) navigate(`/degrees/${degreeData.id}`);
    if (item.item_type === "course") navigate(`/course/${item.item_id}`);
  };

  const typeLabel = item.item_type === "society"
    ? "Community"
    : item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1).replace('_', ' ');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col">

      {/* Card Header */}
      <div className="p-5 flex-1">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight truncate">
              {isDegree ? degreeData?.program_name || "Loading..." : item.item_name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {typeLabel}
              <span className="mx-1.5">·</span>
              Saved {formatDate(item.saved_at)}
            </p>
          </div>
        </div>

        {/* Type-specific content */}
        {isDegree && (
          <>
            {loadingDegree && (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <div className="w-4 h-4 border-2 border-slate-200 border-t-sky-600 rounded-full animate-spin" />
                Loading…
              </div>
            )}
            {degreeData && (
              <div
                className="mt-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                onClick={gotoDetails}
              >
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-slate-700 dark:text-slate-300"><span className="text-slate-500 dark:text-slate-400">Faculty: </span>{degreeData.faculty}</p>
                  <p className="text-slate-700 dark:text-slate-300"><span className="text-slate-500 dark:text-slate-400">Code: </span>{degreeData.degree_code}</p>
                  <p className="text-slate-700 dark:text-slate-300"><span className="text-slate-500 dark:text-slate-400">UOC: </span>{degreeData.minimum_uoc}</p>
                  <p className="text-slate-700 dark:text-slate-300"><span className="text-slate-500 dark:text-slate-400">Duration: </span>{degreeData.duration}y</p>
                  {degreeData.lowest_atar && (
                    <p className="text-slate-700 dark:text-slate-300 col-span-2"><span className="text-slate-500 dark:text-slate-400">ATAR: </span>{degreeData.lowest_atar}</p>
                  )}
                </div>
                {degreeData.overview_description && (
                  <p className="text-sm mt-3 text-slate-600 dark:text-slate-400 line-clamp-2">{degreeData.overview_description}</p>
                )}
              </div>
            )}
          </>
        )}

        {(item.item_type === "major" || item.item_type === "minor" || item.item_type === "specialisation" || item.item_type === "honours") && (
          <div className="mt-3"><SpecialisationCard data={snapshot} itemType={item.item_type} /></div>
        )}
        {item.item_type === "course" && <div className="mt-3"><CourseCard data={snapshot} /></div>}
        {item.item_type === "internship" && <div className="mt-3"><InternshipCard data={snapshot} /></div>}
        {item.item_type === "career_path" && <div className="mt-3"><CareerPathCard data={snapshot} /></div>}
        {item.item_type === "society" && <div className="mt-3"><CommunityCard data={snapshot} /></div>}

        {/* Note preview — shown when notes exist and panel is closed */}
        {hasNotes && !showNotes && (
          <button
            onClick={() => setShowNotes(true)}
            className="mt-4 w-full text-left p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition group"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <HiPencil className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Note</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {notes}
            </p>
          </button>
        )}

        {/* Notes editor */}
        {showNotes && (
          <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 overflow-hidden">
            {/* Notes toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-amber-200 dark:border-amber-800 bg-amber-100/60 dark:bg-amber-900/30">
              <div className="flex items-center gap-1.5">
                <HiPencil className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Personal Note</span>
              </div>
              <div className="flex items-center gap-3">
                {saveStatus === 'saving' && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <div className="w-2.5 h-2.5 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
                    Saving…
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <HiCheck className="w-3 h-3" />
                    Saved
                  </span>
                )}
                {saveStatus === null && lastSaved && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Edited {formatTime(lastSaved)}
                  </span>
                )}
                <button
                  onClick={() => setShowNotes(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              className="w-full px-4 py-3 bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
              rows={5}
              maxLength={MAX_CHARS}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your thoughts, reminders, or reasons for saving this…"
            />

            {/* Notes footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-amber-200 dark:border-amber-800 bg-amber-100/40 dark:bg-amber-900/20">
              <span className={`text-[11px] ${charsLeft < 60 ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}`}>
                {charsLeft} characters left
              </span>
              <div className="flex items-center gap-2">
                {hasNotes && (
                  <button
                    onClick={() => setNotes("")}
                    className="text-[11px] text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition"
                  >
                    Clear note
                  </button>
                )}
                <button
                  onClick={() => setShowNotes(false)}
                  className="text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
        {!showNotes && (
          <button
            onClick={() => setShowNotes(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              hasNotes
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            <HiPencil className="w-3.5 h-3.5" />
            {hasNotes ? "Edit Note" : "Add Note"}
          </button>
        )}

        <button
          onClick={handleDeleteClick}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            confirmDelete
              ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
              : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
          }`}
        >
          <HiTrash className="w-3.5 h-3.5" />
          {confirmDelete ? "Confirm remove?" : "Remove"}
        </button>
      </div>
    </div>
  );
}
