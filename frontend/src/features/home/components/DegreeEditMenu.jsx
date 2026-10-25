import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Ellipsis } from "lucide-react";

export default function DegreeEditMenu({ degreeCode, canChangeSpecialisation }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!wrapper.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="dashboard-edit" ref={wrapper}>
      <button
        type="button"
        className="dashboard-edit-toggle"
        aria-label="Edit degree"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Ellipsis aria-hidden="true" />
      </button>
      {open && (
        <div className="dashboard-edit-menu" role="menu">
          <Link to="/roadmap" role="menuitem">
            Change program
          </Link>
          {canChangeSpecialisation && (
            <Link to={`/roadmap?program=${degreeCode}`} role="menuitem">
              Change specialisation
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
