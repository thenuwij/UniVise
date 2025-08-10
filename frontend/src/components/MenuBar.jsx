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
                    <SidebarItem href="/chatbot" icon={TbMessageChatbotFilled}>
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


                    {/* Collapsible UNSW Pathways Section */}
                    <div
                      onClick={() => setShowPathways(!showPathways)}
                      className="flex items-center justify-between px-4 py-2 cursor-pointer rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center space-x-3 text-gray-700">
                        <HiCollection className="w-5 h-5" />
                        <span className="text-sm font-medium">UNSW Pathways</span>
                      </div>
                      <div className="text-gray-500">
                        {showPathways ? <HiChevronDown className="w-4 h-4" /> : <HiChevronRight className="w-4 h-4" />}
                      </div>
                    </div>


                    {showPathways && (
                      <div className="ml-6 space-y-1">
                        <SidebarItem href="/explore-by-degree" icon={HiCollection}>
                          Degrees
                        </SidebarItem>
                        <SidebarItem href="/explore-by-major" icon={HiUsers}>
                          Majors
                        </SidebarItem>
                        <SidebarItem href="/explore-by-course" icon={HiClipboard}>
                          Courses
                        </SidebarItem>
                      </div>
                    )}
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
