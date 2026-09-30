import { HiBookmark } from "react-icons/hi";
import { Link } from "react-router-dom";

export default function ShortlistLink() {
  return (
    <div className="flex justify-end mb-3">
      <Link
        to="/saved"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:underline"
      >
        <HiBookmark className="w-4 h-4" />
        My shortlist
      </Link>
    </div>
  );
}
