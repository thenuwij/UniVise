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
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export function MenuBar({ isOpen, handleClose }) {
  const [showPathways, setShowPathways] = useState(false);
    const [userType, setUserType] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    const loadType = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log("No user found");
        return;
      }

      const type = user.user_metadata?.student_type; // ⭐ correct field
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
  };


  console.log("Current userType in MenuBar:", userType);

  return (
    <>
      <Drawer open={isOpen} onClose={handleClose}>
        <DrawerHeader title="MENU" titleIcon={() => <></>} />
        <DrawerItems>
          <Sidebar
            aria-label="Sidebar with multi-level dropdown example"
            className="[&>div]:bg-transparent [&>div]:p-0"
          >
            <div className="flex h-full flex-col justify-between py-2">
              <div>
                <form className="pb-3 md:hidden">
                  <TextInput icon={HiSearch} type="search" placeholder="Search" required size={32} />
                </form>
                <SidebarItems>
                  <SidebarItemGroup>
                    <SidebarItem onClick={() => navigate("/chat")} icon={TbMessageChatbotFilled}>
                      Ask Eunice
                    </SidebarItem>
                  </SidebarItemGroup>
                  <SidebarItemGroup>
                    <SidebarItem onClick={() => navigate("/dashboard")} icon={MdDashboard}>
                      Dashboard
                    </SidebarItem>
                    <SidebarItem onClick={() => navigate("/traits")} icon={FaFingerprint}>
                      My Traits
                    </SidebarItem>
                    <SidebarItem onClick={() => navigate("/roadmap-entryload")} icon={RiGuideFill}>
                      My Roadmap
                    </SidebarItem>
                    <SidebarItem onClick={handlePlannerClick} icon={HiBriefcase}>
                      My Planner
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
