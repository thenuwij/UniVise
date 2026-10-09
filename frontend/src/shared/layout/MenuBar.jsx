import { Drawer } from "flowbite-react";
import { useEffect, useState } from "react";
import { Bookmark, BookOpen, LayoutDashboard, LogOut, Map, MessageCircle, Network, Repeat, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import logo from "@/assets/logo.svg";

const GROUPS = [
  {
    label: "Your plan",
    items: [
      { path: "/dashboard", label: "Dashboard", hint: "Your program at a glance", icon: LayoutDashboard },
      { path: "/roadmap-entryload", label: "Roadmap", hint: "Your degree step by step", icon: Map },
      { path: "/coursemesh", label: "CourseMesh", hint: "What you can take next", icon: Network },
    ],
  },
  {
    label: "Explore",
    items: [
      { path: "/handbook", label: "Handbook", hint: "Degrees, majors and courses", icon: BookOpen },
      { path: "/progress", label: "Compare programs", hint: "See what transfers to another program", icon: Repeat, universityOnly: true },
    ],
  },
  {
    label: "Help",
    items: [{ path: "/chat", label: "Ask Eunice", hint: "Your AI study and career advisor", icon: MessageCircle }],
  },
];

const drawerTheme = {
  root: {
    base: "fixed z-40 overflow-y-auto transition-transform bg-white dark:bg-slate-900 border-r border-line shadow-2xl",
    position: {
      left: {
        on: "transform-none",
        off: "-translate-x-full",
      },
    },
  },
};

const initialsOf = (name, email) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .join("")
    .slice(0, 2) || (email || "?")[0].toUpperCase();

export function MenuBar({ isOpen, handleClose }) {
  const [userType, setUserType] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = UserAuth();

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserType(user.user_metadata?.student_type || null);
      const firstName = user.user_metadata.first_name || user.user_metadata.full_name?.split(" ")[0] || "";
      const lastName = user.user_metadata.last_name || user.user_metadata.full_name?.split(" ")[1] || "";
      setDisplayName(`${firstName} ${lastName}`.trim());
      setDisplayEmail(user.email || "");
    };
    loadUser();
  }, []);

  const isActive = (path) => {
    if (path === "/roadmap-entryload") {
      return location.pathname === "/roadmap-entryload" || location.pathname === "/roadmap" || location.pathname.startsWith("/roadmap/");
    }
    if (path === "/handbook") {
      return ["/handbook", "/degrees/", "/course/", "/specialisation/"].some((p) => location.pathname.startsWith(p));
    }
    if (path === "/chat") return location.pathname.startsWith("/chat");
    return location.pathname === path;
  };

  const go = (path) => {
    navigate(path);
    handleClose();
  };

  return (
    <Drawer open={isOpen} onClose={handleClose} theme={drawerTheme} className="w-80 p-0">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-5 h-14 border-b border-line">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-7 w-7" />
            <span className="font-heading text-xl font-bold text-ink-strong">UniVise</span>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close menu"
            className="h-9 w-9 inline-flex items-center justify-center rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pt-3">
          <button
            onClick={() => go("/profile")}
            className="w-full flex items-center gap-3 rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/50 dark:to-slate-900 px-3 py-2 text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <span className="flex-shrink-0 h-9 w-9 rounded-full inline-flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-blue-600 to-indigo-600">
              {initialsOf(displayName, displayEmail)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-ink-strong">{displayName || "Your profile"}</span>
              <span className="block truncate text-xs text-ink-muted">{displayEmail}</span>
                          </span>
          </button>
        </div>

        <nav aria-label="Main menu" className="flex-1 overflow-y-auto px-4 pt-3 pb-4 space-y-3">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">{group.label}</p>
              <ul className="space-y-0.5">
                {group.items
                  .filter((item) => !(item.universityOnly && userType === "high_school"))
                  .map(({ path, label, hint, icon: Icon }) => {
                    const active = isActive(path);
                    return (
                      <li key={path}>
                        <button
                          onClick={() => go(path)}
                          aria-current={active ? "page" : undefined}
                          className={`group w-full flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors ${
                            active
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-600/25"
                              : "hover:bg-blue-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span
                            className={`flex-shrink-0 h-8 w-8 rounded-lg inline-flex items-center justify-center ${
                              active ? "bg-white/20 text-white" : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-white dark:group-hover:bg-slate-900"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className={`block text-[15px] font-semibold leading-tight ${active ? "text-white" : "text-ink-strong"}`}>{label}</span>
                            <span className={`block truncate text-xs leading-tight ${active ? "text-blue-100" : "text-ink-muted"}`}>{hint}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-line space-y-0.5">
          <button
            onClick={() => go("/saved")}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-semibold transition-colors ${
              isActive("/saved") ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-slate-800" : "text-ink hover:bg-blue-50 dark:hover:bg-slate-800"
            }`}
          >
            <Bookmark className="h-[18px] w-[18px] text-blue-600 dark:text-blue-400" />
            My shortlist
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-semibold text-ink hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300 transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </div>
      </div>
    </Drawer>
  );
}
