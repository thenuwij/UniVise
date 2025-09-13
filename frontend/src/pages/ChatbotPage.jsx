import React, { useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import { TbRobot } from "react-icons/tb";

export default function ChatbotPage() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { conversationId } = useParams();

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

 return (
  <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
    {/* ─── Top navbars ───────────────────────────────────────── */}
    <div>
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
    </div>

    {/* ─── Two-column chat layout ───────────────────────────────── */}
    <div className="flex overflow-hidden flex-1">
      {/* Dynamic Sidebar - changes width based on collapse state */}
      <div className={`${sidebarCollapsed ? 'w-24' : 'w-64'} flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden`}>
        <ChatSidebar 
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={setSidebarCollapsed}
        />
      </div>

      {/* Chat window takes remaining space */}
      <div className="flex-1 overflow-hidden">
          {conversationId
            ? <ChatWindow convId={conversationId} />
            : <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <TbRobot className="inline-block mb-2 w-20 h-20 text-gray-400 animate-bounce"/>
                Select or create a new chat to begin.
              </div>
          }
        </div>
    </div>
  </div>
);

}