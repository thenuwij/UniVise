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

export function MenuBar({ isOpen, handleClose }) {
  const [showPathways, setShowPathways] = useState(false);

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
                    <SidebarItem href="/chat" icon={TbMessageChatbotFilled}>
                      Ask Eunice
                    </SidebarItem>
                  </SidebarItemGroup>
                  <SidebarItemGroup>
                    <SidebarItem href="/dashboard" icon={MdDashboard}>
                      Dashboard
                    </SidebarItem>
                    <SidebarItem icon={FaFingerprint}>
                      My Traits
                    </SidebarItem>
                    <SidebarItem href="/roadmap-entryload" icon={RiGuideFill}>
                      My Roadmap
                    </SidebarItem>
                   <SidebarItem href="/planner" icon={HiBriefcase}>
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
