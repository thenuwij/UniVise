import {
  Drawer,
  DrawerHeader,
  DrawerItems,
  Sidebar,
  SidebarItem,
  SidebarItemGroup,
  SidebarItems,
  TextInput,
} from "flowbite-react";
import { useState, useEffect } from "react";
import {
  HiClipboard,
  HiCollection,
  HiSearch,
  HiUsers,
  HiChevronDown,
  HiChevronRight,
  HiBriefcase,
} from "react-icons/hi";
import { TbMessageChatbotFilled } from "react-icons/tb";
import { MdDashboard } from "react-icons/md";
import { FaFingerprint } from "react-icons/fa";
import { RiGuideFill } from "react-icons/ri";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

export function MenuBar({ isOpen, handleClose }) {
  const [showPathways, setShowPathways] = useState(false);
  const [userType, setUserType] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadType = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found");
        return;
      }
      const type = user.user_metadata?.student_type;
      console.log("Loaded student_type:", type);
      setUserType(type || null);
    };
    loadType();
  }, []);

  const handlePlannerClick = () => {
    console.log("Planner clicked — userType:", userType);
    if (userType === "high_school") {
      navigate("/planner/school");
    } else {
      navigate("/planner");
    }
    handleClose();
  };

  // Check if a path is active
  const isActive = (path) => {
    if (path === "/planner") {
      return (
        location.pathname === "/planner" ||
        location.pathname === "/planner/school"
      );
    }
    if (path === "/roadmap-entryload") {
      return (
        location.pathname === "/roadmap-entryload" ||
        location.pathname === "/roadmap" ||
        location.pathname.startsWith("/roadmap/")
      );
    }
    return location.pathname === path;
  };

  console.log("Current userType in MenuBar:", userType);

  // Custom theme for active state
  const customSidebarTheme = {
    root: {
      inner: "h-full overflow-y-auto overflow-x-hidden rounded bg-transparent px-3 py-4",
    },
    item: {
      base: "flex items-center justify-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 group transition-colors duration-200",
      active: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
      content: {
        base: "flex-1 whitespace-nowrap px-3 text-base",
      },
      icon: {
        base: "h-6 w-6 flex-shrink-0 text-gray-500 transition duration-200 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white",
        active: "text-white dark:text-white",
      },
    },
  };

  return (
    <>
      <Drawer open={isOpen} onClose={handleClose}>
        <DrawerHeader title="MENU" titleIcon={() => <></>} />
        <DrawerItems>
          <Sidebar
            aria-label="Sidebar with multi-level dropdown example"
            className="[&>div]:bg-transparent [&>div]:p-0"
            theme={customSidebarTheme}
          >
            <div className="flex h-full flex-col justify-between py-2">
              <div>
                <form className="pb-3 md:hidden">
                  <TextInput
                    icon={HiSearch}
                    type="search"
                    placeholder="Search"
                    required
                    size={32}
                  />
                </form>
                <SidebarItems>
                  <SidebarItemGroup>
                    <SidebarItem
                      onClick={() => {
                        navigate("/chat");
                        handleClose();
                      }}
                      icon={TbMessageChatbotFilled}
                      active={isActive("/chat")}
                      className={
                        isActive("/chat")
                          ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                          : ""
                      }
                    >
                      <span className={isActive("/chat") ? "font-semibold" : ""}>
                        Ask Eunice
                      </span>
                    </SidebarItem>
                  </SidebarItemGroup>
                  <SidebarItemGroup>
                    <SidebarItem
                      onClick={() => {
                        navigate("/dashboard");
                        handleClose();
                      }}
                      icon={MdDashboard}
                      active={isActive("/dashboard")}
                      className={
                        isActive("/dashboard")
                          ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                          : ""
                      }
                    >
                      <span className={isActive("/dashboard") ? "font-semibold" : ""}>
                        Dashboard
                      </span>
                    </SidebarItem>
                    <SidebarItem
                      onClick={() => {
                        navigate("/traits");
                        handleClose();
                      }}
                      icon={FaFingerprint}
                      active={isActive("/traits")}
                      className={
                        isActive("/traits")
                          ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                          : ""
                      }
                    >
                      <span className={isActive("/traits") ? "font-semibold" : ""}>
                        My Traits
                      </span>
                    </SidebarItem>
                    <SidebarItem
                      onClick={() => {
                        navigate("/roadmap-entryload");
                        handleClose();
                      }}
                      icon={RiGuideFill}
                      active={isActive("/roadmap-entryload")}
                      className={
                        isActive("/roadmap-entryload")
                          ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                          : ""
                      }
                    >
                      <span className={isActive("/roadmap-entryload") ? "font-semibold" : ""}>
                        My Roadmap
                      </span>
                    </SidebarItem>
                    <SidebarItem
                      onClick={handlePlannerClick}
                      icon={HiBriefcase}
                      active={isActive("/planner")}
                      className={
                        isActive("/planner")
                          ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                          : ""
                      }
                    >
                      <span className={isActive("/planner") ? "font-semibold" : ""}>
                        My Planner
                      </span>
                    </SidebarItem>
                  </SidebarItemGroup>
                </SidebarItems>
              </div>
            </div>
          </Sidebar>
        </DrawerItems>
      </Drawer>
    </>
  );
}