// src/components/pathway/EmptyState.jsx
import { HiOutlineBookmark } from "react-icons/hi";

export default function EmptyState() {
  return (
    <div className="text-center py-20 opacity-70">
      <HiOutlineBookmark className="w-12 h-12 mx-auto mb-4 text-primary" />
      <h3 className="text-lg font-semibold text-primary">
        Nothing saved yet
      </h3>
      <p className="text-secondary text-sm mt-2">
        Explore degrees, courses, societies, and internships — then save the ones you like.
      </p>
    </div>
  );
}
