// src/components/pathway/SavedItemCard.jsx
import { useEffect, useState } from "react";
import {
  HiAcademicCap,
  HiBriefcase,
  HiClipboard,
  HiPencil,
  HiTrash,
  HiUsers,
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

  const isDegree = item.item_type === "degree";
  const snapshot = item.item_data || {};


  // Fetch degree data from Supabase
  useEffect(() => {
    if (!isDegree) return;

    const fetchDegree = async () => {
      setLoadingDegree(true);

      console.log("DEBUG - item.item_id:", item.item_id);

      // Check if item_id is a UUID (has dashes) or a degree_code (numeric string)
      const isUUID = item.item_id.includes('-');

      let data, error;

      if (isUUID) {
        // Query by id
        const result = await supabase
          .from("unsw_degrees_final")
          .select("*")
          .eq("id", item.item_id)
          .maybeSingle();
        data = result.data;
        error = result.error;
      } else {
        // Query by degree_code
        const result = await supabase
          .from("unsw_degrees_final")
          .select("*")
          .eq("degree_code", item.item_id)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

      console.log("DEBUG - Query result data:", data);
      console.log("DEBUG - Query result error:", error);

      if (error) {
        console.error("Degree fetch error:", error);
      } else if (data) {
        setDegreeData(data);
      } else {
        // Fallback: Use item_data if no degree found
        console.log("No degree found, using item_data as fallback");
        const parsedItemData = typeof item.item_data === 'string' 
          ? JSON.parse(item.item_data) 
          : item.item_data;
        setDegreeData(parsedItemData);
      }

      setLoadingDegree(false);
    };

    fetchDegree();
  }, [item, isDegree]);

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
        return <HiAcademicCap className="w-5 h-5 text-blue-600" />;
      case "major":
        return <HiAcademicCap className="w-5 h-5 text-blue-600" />;
      case "minor":
        return <HiAcademicCap className="w-5 h-5 text-purple-600" />;
      case "specialisation":
        return <HiAcademicCap className="w-5 h-5 text-amber-600" />;
      case "course":
        return <HiClipboard className="w-5 h-5 text-purple-600" />;
      case "society":
        return <HiUsers className="w-5 h-5 text-pink-600" />;
      case "internship":
        return <HiBriefcase className="w-5 h-5 text-indigo-600" />;
      case "career_path":
        return <HiBriefcase className="w-5 h-5 text-green-600" />;
      default:
        return <HiAcademicCap className="w-5 h-5 text-gray-600" />;
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

  const handleSaveNotes = async () => {
    const { error } = await supabase
      .from("user_saved_items")
      .update({ personal_notes: notes })
      .eq("id", item.id);

    if (!error) {
      setShowNotes(false);
    }
  };

  // MAIN CARD WRAPPER
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all">
      
      {/* HEADER - FOR ALL TYPES */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
          {getIcon()}
        </div>

        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {item.item_type === "degree"
              ? degreeData?.program_name || "Loading..."
              : item.item_name}
          </h3>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {item.item_type === "society" ? "Community" : item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Saved {formatDate(item.saved_at)}
          </p>
        </div>
      </div>

      {/* DEGREE CONTENT */}
      {item.item_type === "degree" && (
        <>
          {loadingDegree && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading degree…</p>
          )}

          {degreeData && (
            <div
              className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
              onClick={gotoDetails}
            >
              <div className="space-y-2 text-sm">
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Faculty:</strong> {degreeData.faculty}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Code:</strong> {degreeData.degree_code}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>UOC:</strong> {degreeData.minimum_uoc}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Duration:</strong> {degreeData.duration} years
                </p>

                {degreeData.lowest_atar && (
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>ATAR:</strong> {degreeData.lowest_atar}
                  </p>
                )}
              </div>

              {degreeData.overview_description && (
                <p className="text-sm mt-3 text-slate-600 dark:text-slate-400 line-clamp-3">
                  {degreeData.overview_description}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* SPECIALISATION CONTENT (Major/Minor/Honours) */}
      {(item.item_type === "major" || item.item_type === "minor" || item.item_type === "specialisation" || item.item_type === "honours") && (
        <div className="mt-3">
          <SpecialisationCard data={snapshot} itemType={item.item_type} />
        </div>
      )}
      
      {/* COURSE CONTENT */}
      {item.item_type === "course" && (
        <div className="mt-3">
          <CourseCard data={snapshot} />
        </div>
      )}

      {/* INTERNSHIP CONTENT */}
      {item.item_type === "internship" && (
        <div className="mt-3">
          <InternshipCard data={snapshot} />
        </div>
      )}

      {/* CAREER PATH CONTENT */}
      {item.item_type === "career_path" && (
        <div className="mt-3">
          <CareerPathCard data={snapshot} />
        </div>
      )}

      {/* SOCIETY/COMMUNITY CONTENT */}
      {item.item_type === "society" && (
        <div className="mt-3">
          <CommunityCard data={snapshot} />
        </div>
      )}

      {/* ACTION BUTTONS - COMMON FOR ALL TYPES */}
      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          <HiPencil className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            if (confirm("Remove this item?")) onRemove(item.id);
          }}
          className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition"
        >
          <HiTrash className="w-4 h-4" />
        </button>
      </div>

      {/* NOTES TEXTAREA */}
      {showNotes && (
        <div className="mt-3">
          <textarea
            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your notes..."
          />
          <button
            onClick={handleSaveNotes}
            className="mt-2 px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition"
          >
            Save Notes
          </button>
        </div>
      )}
    </div>
  );
}