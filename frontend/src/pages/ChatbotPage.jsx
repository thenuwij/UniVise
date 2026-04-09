import { useState } from "react";
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
  <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
    {/*  Top navbars */}
    <div>
      <DashboardNavBar onMenuClick={openDrawer} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
    </div>

    {/* Two-column chat layout */}
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
            : <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                  <TbRobot className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm font-medium">Select or start a new chat to begin</p>
              </div>
          }
        </div>
    </div>
  </div>
);

}