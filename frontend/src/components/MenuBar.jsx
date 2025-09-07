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

import { useState } from "react";

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

export function MenuBar({ isOpen, handleClose }) {
  const [showPathways, setShowPathways] = useState(false);
  const navigate = useNavigate();

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
                   <SidebarItem onClick={() => navigate("/planner")} icon={HiBriefcase}>
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
