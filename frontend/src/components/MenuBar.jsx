import {
  Drawer,
  DrawerHeader,
  DrawerItems,
  Sidebar,
  SidebarItem,
  SidebarItemGroup,
  SidebarItems,
} from "flowbite-react";
import { useEffect, useState } from "react";
import { FaFingerprint } from "react-icons/fa";
import { HiBriefcase, HiOutlineLogout } from "react-icons/hi";
import { HiOutlineUserCircle } from "react-icons/hi2";
import { MdDashboard } from "react-icons/md";
import { RiGuideFill } from "react-icons/ri";
import { TbMessageChatbotFilled } from "react-icons/tb";
import { useLocation, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

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

  const handlePlannerClick = () => {
    navigate(userType === "high_school" ? "/planner/school" : "/planner");
    handleClose();
  };

  const isActive = (path) => {
    if (path === "/planner") {
      return location.pathname === "/planner" || location.pathname === "/planner/school";
    }
    if (path === "/roadmap-entryload") {
      return location.pathname === "/roadmap-entryload" || location.pathname === "/roadmap" || location.pathname.startsWith("/roadmap/");
    }
    return location.pathname === path;
  };

  const activeClass = "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700";

  const customSidebarTheme = {
    root: {
      inner: "h-full overflow-y-auto overflow-x-hidden rounded bg-transparent px-3 py-4",
    },
    item: {
      base: "flex items-center justify-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 group transition-colors duration-200",
      active: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
      content: { base: "flex-1 whitespace-nowrap px-3 text-base" },
      icon: {
        base: "h-6 w-6 flex-shrink-0 text-gray-500 transition duration-200 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white",
        active: "text-white dark:text-white",
      },
    },
  };

  return (
    <Drawer open={isOpen} onClose={handleClose}>
      <DrawerHeader title="MENU" titleIcon={() => <></>} />
      <DrawerItems>
        {/* User info header */}
        <button
          onClick={() => { navigate("/profile"); handleClose(); }}
          className="w-full px-4 py-3 mb-2 border-b border-slate-200 dark:border-slate-700 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 flex items-center gap-3"
        >
          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-600 flex items-center justify-center">
            <HiOutlineUserCircle className="h-6 w-6 text-slate-500 dark:text-slate-300" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{displayName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{displayEmail}</p>
          </div>
        </button>

        <Sidebar
          aria-label="Navigation menu"
          className="[&>div]:bg-transparent [&>div]:p-0"
          theme={customSidebarTheme}
        >
          <div className="flex h-full flex-col justify-between py-2">
            <div>
              <SidebarItems>
                <SidebarItemGroup>
                  <SidebarItem onClick={() => { navigate("/dashboard"); handleClose(); }} icon={MdDashboard} active={isActive("/dashboard")} className={isActive("/dashboard") ? activeClass : ""}>
                    <span className={isActive("/dashboard") ? "font-semibold" : ""}>Dashboard</span>
                  </SidebarItem>
                  <SidebarItem onClick={() => { navigate("/chat"); handleClose(); }} icon={TbMessageChatbotFilled} active={isActive("/chat")} className={isActive("/chat") ? activeClass : ""}>
                    <span className={isActive("/chat") ? "font-semibold" : ""}>Ask Eunice</span>
                  </SidebarItem>
                  <SidebarItem onClick={() => { navigate("/roadmap-entryload"); handleClose(); }} icon={RiGuideFill} active={isActive("/roadmap-entryload")} className={isActive("/roadmap-entryload") ? activeClass : ""}>
                    <span className={isActive("/roadmap-entryload") ? "font-semibold" : ""}>My Roadmap</span>
                  </SidebarItem>
                  <SidebarItem onClick={handlePlannerClick} icon={HiBriefcase} active={isActive("/planner")} className={isActive("/planner") ? activeClass : ""}>
                    <span className={isActive("/planner") ? "font-semibold" : ""}>My Planner</span>
                  </SidebarItem>
                  <SidebarItem onClick={() => { navigate("/traits"); handleClose(); }} icon={FaFingerprint} active={isActive("/traits")} className={isActive("/traits") ? activeClass : ""}>
                    <span className={isActive("/traits") ? "font-semibold" : ""}>My Traits</span>
                  </SidebarItem>
                </SidebarItemGroup>

                <SidebarItemGroup>
                  <SidebarItem onClick={signOut} icon={HiOutlineLogout}>
                    Sign Out
                  </SidebarItem>
                </SidebarItemGroup>
              </SidebarItems>
            </div>
          </div>
        </Sidebar>
      </DrawerItems>
    </Drawer>
  );
}
