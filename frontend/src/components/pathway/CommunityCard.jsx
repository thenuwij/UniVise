// src/components/pathway/CommunityCard.jsx
import { Award, Calendar, Heart, Users } from "lucide-react";

function CommunityCard({ data }) {
  return (
    <div className="space-y-4">
      
      {/* Why Join */}
      {data?.why_join && (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {data.why_join}
        </p>
      )}

      {/* Category & Professional Affiliation */}
      <div className="flex flex-wrap gap-2 items-center">
        {data?.category && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
            <Users className="h-3 w-3" />
            {data.category}
          </span>
        )}

        {data?.professional_affiliation && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            <Award className="h-3 w-3" />
            {data.professional_affiliation}
          </span>
        )}
      </div>

      {/* Relevance */}
      {data?.relevance && (
        <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800">
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <strong className="text-sky-700 dark:text-sky-300">Why it's relevant: </strong>
            {data.relevance}
          </p>
        </div>
      )}

      {/* Key Activities */}
      {Array.isArray(data?.key_activities) && data.key_activities.length > 0 && (
        <div>
          <p className="text-xs uppercase font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5 tracking-wide">
            <Calendar className="h-3 w-3" />
            Key Activities
          </p>
          <div className="flex flex-wrap gap-2">
            {data.key_activities.map((activity, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-900/30 text-xs font-medium text-sky-700 dark:text-sky-300"
              >
                {activity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Membership Benefits */}
      {data?.membership_benefits && (
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2">
            <Heart className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-900 dark:text-white uppercase tracking-wide text-[10px]">
                Member Benefits:
              </strong>{" "}
              {data.membership_benefits}
            </span>
          </p>
        </div>
      )}

      {/* Meeting Times */}
      {data?.meeting_times && (
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Calendar className="h-3 w-3 text-sky-600 dark:text-sky-400" />
          <span>
            <strong>Meets:</strong> {data.meeting_times}
          </span>
        </div>
      )}

      {/* Contact Info */}
      {data?.contact_info && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <strong>Contact: </strong>
            {data.contact_info}
          </p>
        </div>
      )}

      {/* Website Link */}
      {data?.website && (
        <a
          href={data.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
        >
          Visit Website →
        </a>
      )}
    </div>
  );
}

export default CommunityCard;
