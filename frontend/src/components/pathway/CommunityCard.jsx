// src/components/pathway/CommunityCard.jsx
import { Award, Calendar, Heart, Users } from "lucide-react";

function CommunityCard({ data }) {
  return (
    <div className="space-y-4">
      {/* WHY JOIN */}
      {data.why_join && (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {data.why_join}
        </p>
      )}

      {/* CATEGORY & PROFESSIONAL AFFILIATION */}
      <div className="flex flex-wrap gap-2 items-center">
        {data.category && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-pink-100 dark:bg-pink-900/30 border border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300">
            <Users className="h-3 w-3" />
            {data.category}
          </span>
        )}

        {data.professional_affiliation && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300">
            <Award className="h-3 w-3" />
            {data.professional_affiliation}
          </span>
        )}
      </div>

      {/* RELEVANCE */}
      {data.relevance && (
        <div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-700">
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <strong className="text-pink-700 dark:text-pink-300">Why it's relevant: </strong>
            {data.relevance}
          </p>
        </div>
      )}

      {/* KEY ACTIVITIES */}
      {data.key_activities?.length > 0 && (
        <div>
          <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Key Activities
          </p>

          <div className="flex flex-wrap gap-2">
            {data.key_activities.map((activity, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-xs font-semibold text-blue-700 dark:text-blue-300"
              >
                {activity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* MEMBERSHIP BENEFITS */}
      {data.membership_benefits && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700">
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2">
            <Heart className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                Member Benefits:
              </strong>{" "}
              {data.membership_benefits}
            </span>
          </p>
        </div>
      )}

      {/* MEETING TIMES */}
      {data.meeting_times && (
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Calendar className="h-3 w-3" />
          <span>
            <strong>Meets:</strong> {data.meeting_times}
          </span>
        </div>
      )}

      {/* CONTACT INFO */}
      {data.contact_info && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <strong>Contact: </strong>
            {data.contact_info}
          </p>
        </div>
      )}

      {/* WEBSITE / LINK */}
      {data.website && (
        <a
          href={data.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 underline"
        >
          Visit Website →
        </a>
      )}
    </div>
  );
}

export default CommunityCard;
