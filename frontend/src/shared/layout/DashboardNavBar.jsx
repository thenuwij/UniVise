import {
  Dropdown,
  DropdownDivider,
  DropdownHeader,
  DropdownItem,
} from "flowbite-react";
import { useState } from "react";
import {
  Bookmark,
  BookOpen,
  Compass,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.svg";
import { roadmapViewUrl } from "@/features/roadmap/utils/roadmapSteps";
import { UserAuth } from "@/app/AuthContext";
import { isNavigationActive } from "./navigation";
import "./navigation.css";

export function DashboardNavBar({ onMenuClick, isMenuOpen = false }) {
  const { session, signOut } = UserAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  const user = session?.user;
  const metadata = user?.user_metadata || {};
  const displayName =
    [metadata.first_name, metadata.last_name].filter(Boolean).join(" ") ||
    metadata.full_name ||
    metadata.name ||
    "Your account";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  const avatarUrl = metadata.avatar_url || metadata.picture;

  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("color-theme", nextDark ? "dark" : "light");
    setIsDark(nextDark);
  };
  const navClass = (section) =>
    `app-nav-link${isNavigationActive(section, pathname) ? " is-active" : ""}`;

  return (
    <header id="header" className="app-navigation app-header-surface" data-tour="app-navigation">
      <div className="app-nav-inner">
        <button
          type="button"
          className="app-nav-mobile-menu"
          onClick={onMenuClick}
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
          data-tour="menu"
        >
          <Menu aria-hidden="true" />
        </button>
        <Link
          to="/dashboard"
          className="app-nav-brand"
          aria-label="UniVise home"
        >
          <img src={logo} alt="" />
          <span>UniVise</span>
        </Link>
        <nav className="app-nav-links" aria-label="Main navigation">
          {[
            ["dashboard", "Home", "/dashboard"],
            ["roadmap", "My Program", "/roadmap-entryload"],
            ["careers", "My Career", roadmapViewUrl("careers")],
          ].map(([key, label, path]) => (
            <Link
              key={key}
              to={path}
              className={navClass(key)}
              aria-current={
                isNavigationActive(key, pathname) ? "page" : undefined
              }
            >
              {label}
            </Link>
          ))}
          <Dropdown
            arrowIcon={false}
            inline
            placement="bottom-start"
            className="app-nav-dropdown"
            renderTrigger={() => (
              <button
                type="button"
                className={navClass("explore")}
                aria-current={
                  isNavigationActive("explore", pathname) ? "page" : undefined
                }
              >
                Explore
              </button>
            )}
          >
            <DropdownItem icon={BookOpen} onClick={() => navigate("/handbook")}>
              Search the Handbook
            </DropdownItem>
            <DropdownItem icon={Compass} onClick={() => navigate("/roadmap")}>
              Explore other programs
            </DropdownItem>
            <DropdownItem icon={MessageCircle} onClick={() => navigate("/chat")}>
              Ask Eunice
            </DropdownItem>
          </Dropdown>
        </nav>
        <div className="app-nav-actions">
          <Link
            to="/saved"
            className={`app-nav-shortlist${pathname === "/saved" ? " is-active" : ""}`}
            aria-label="My shortlist"
            aria-current={pathname === "/saved" ? "page" : undefined}
          >
            <Bookmark aria-hidden="true" />
            <span>Shortlist</span>
          </Link>
          <Dropdown
            arrowIcon={false}
            inline
            placement="bottom-end"
            className="app-nav-dropdown"
            renderTrigger={() => (
              <button
                type="button"
                className="app-nav-account"
                aria-label="Account menu"
              >
                {avatarUrl && !avatarFailed ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <span className="app-nav-avatar" aria-hidden="true">
                    {initials}
                  </span>
                )}
                <span className="app-nav-account-label">Account</span>
              </button>
            )}
          >
            <DropdownHeader>
              <span className="block font-semibold">{displayName}</span>
              <span className="block truncate text-sm">{user?.email}</span>
            </DropdownHeader>
            <DropdownItem icon={User} onClick={() => navigate("/profile")}>
              My account
            </DropdownItem>
            <DropdownItem icon={Bookmark} onClick={() => navigate("/saved")}>
              My shortlist
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem icon={isDark ? Sun : Moon} onClick={toggleTheme}>
              {isDark ? "Switch to light mode" : "Switch to dark mode"}
            </DropdownItem>
            <DropdownItem icon={LogOut} onClick={signOut}>
              Sign out
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
