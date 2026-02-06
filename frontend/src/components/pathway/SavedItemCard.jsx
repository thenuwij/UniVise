// src/components/pathway/SavedItemCard.jsx
import { useEffect, useState, useRef } from "react";
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

export default function SavedItemCard({ item, onRemove }) {
  const navigate = useNavigate();

  const [degreeData, setDegreeData] = useState(null);
  const [loadingDegree, setLoadingDegree] = useState(false);

  const [notes, setNotes] = useState(item.personal_notes || "");
  const [showNotes, setShowNotes] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved'
  const debounceRef = useRef(null);

  const isDegree = item.item_type === "degree";
  const snapshot = item.item_data || {};

  // Fetch degree data from Supabase
  useEffect(() => {
    if (!isDegree) return;

    const fetchDegree = async () => {
      setLoadingDegree(true);

      const isUUID = item.item_id.includes('-');
      let data, error;

      if (isUUID) {
        const result = await supabase
          .from("unsw_degrees_final")
          .select("*")
          .eq("id", item.item_id)
          .maybeSingle();
        data = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from("unsw_degrees_final")
          .select("*")
          .eq("degree_code", item.item_id)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("Degree fetch error:", error);
      } else if (data) {
        setDegreeData(data);
      } else {
        const parsedItemData = typeof item.item_data === 'string' 
          ? JSON.parse(item.item_data) 
          : item.item_data;
        setDegreeData(parsedItemData);
      }

      setLoadingDegree(false);
    };

    fetchDegree();
  }, [item, isDegree]);

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
        setTimeout(() => setSaveStatus(null), 2000);
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [notes, item.id, item.personal_notes]);

  const formatDate = (dt) => {
    if (!dt) return "";
    const date = new Date(dt);
    const now = new Date();
    const diff = Math.floor((now - date) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return date.toLocaleDateString();
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
    if (item.item_type === "degree" && degreeData) {
      navigate(`/degrees/${degreeData.id}`);
    }
    if (item.item_type === "course") {
      navigate(`/courses/${item.item_id}`);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all">
      
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-900/30">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight truncate">
            {item.item_type === "degree"
              ? degreeData?.program_name || "Loading..."
              : item.item_name}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {item.item_type === "society" ? "Community" : item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1).replace('_', ' ')}
            <span className="mx-1.5">•</span>
            Saved {formatDate(item.saved_at)}
          </p>
        </div>
      </div>

      {/* Degree Content */}
      {item.item_type === "degree" && (
        <>
          {loadingDegree && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="w-4 h-4 border-2 border-slate-200 border-t-sky-600 rounded-full animate-spin" />
              Loading degree…
            </div>
          )}

          {degreeData && (
            <div
              className="mt-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              onClick={gotoDetails}
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400">Faculty:</span> {degreeData.faculty}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400">Code:</span> {degreeData.degree_code}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400">UOC:</span> {degreeData.minimum_uoc}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400">Duration:</span> {degreeData.duration} years
                </p>
                {degreeData.lowest_atar && (
                  <p className="text-slate-700 dark:text-slate-300 col-span-2">
                    <span className="text-slate-500 dark:text-slate-400">ATAR:</span> {degreeData.lowest_atar}
                  </p>
                )}
              </div>

              {degreeData.overview_description && (
                <p className="text-sm mt-3 text-slate-600 dark:text-slate-400 line-clamp-2">
                  {degreeData.overview_description}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Specialisation Content */}
      {(item.item_type === "major" || item.item_type === "minor" || item.item_type === "specialisation" || item.item_type === "honours") && (
        <div className="mt-3">
          <SpecialisationCard data={snapshot} itemType={item.item_type} />
        </div>
      )}
      
      {/* Course Content */}
      {item.item_type === "course" && (
        <div className="mt-3">
          <CourseCard data={snapshot} />
        </div>
      )}

      {/* Internship Content */}
      {item.item_type === "internship" && (
        <div className="mt-3">
          <InternshipCard data={snapshot} />
        </div>
      )}

      {/* Career Path Content */}
      {item.item_type === "career_path" && (
        <div className="mt-3">
          <CareerPathCard data={snapshot} />
        </div>
      )}

      {/* Society/Community Content */}
      {item.item_type === "society" && (
        <div className="mt-3">
          <CommunityCard data={snapshot} />
        </div>
      )}

      {/* Notes Section */}
      {showNotes && (
        <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Personal Notes
            </p>
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <HiCheck className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}
            </div>
          </div>
          <textarea
            className="w-full p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none resize-none transition"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your personal notes here..."
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Notes auto-save as you type
            </p>
            <button
              onClick={() => setShowNotes(false)}
              className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
        {!showNotes && (
          <button
            onClick={() => setShowNotes(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
          >
            <HiPencil className="w-4 h-4" />
            <span>{notes ? "View Notes" : "Add Notes"}</span>
          </button>
        )}

        {notes && !showNotes && (
          <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <HiCheck className="w-3 h-3 text-emerald-500" />
            Notes saved
          </span>
        )}

        <button
          onClick={() => {
            if (confirm("Remove this item?")) onRemove(item.id);
          }}
          className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition ${showNotes ? "" : "ml-auto"}`}
        >
          <HiTrash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}