import React, { useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";

export default function ChatbotPage() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { conversationId } = useParams();

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

 return (
  <div className="flex flex-col h-screen">
    {/* ─── Top navbars ───────────────────────────────────────── */}
    <div>
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
    </div>

    {/* ─── Two-column chat layout ───────────────────────────────── */}
    <div className="flex flex-1 bg-gray-200 w-full overflow-hidden">
      {/* Sidebar takes 1/3 */}
      <div className="w-1/5 max-w-140 overflow-auto">
        <ChatSidebar />
      </div>

      {/* Chat window takes remaining 2/3 */}
      <div className="flex-1 overflow-hidden">
          {conversationId
            ? <ChatWindow convId={conversationId} />
            : <div className="h-full flex items-center justify-center text-gray-500">
                Select or create a conversation to begin.
              </div>
          }
        </div>
    </div>
  </div>
);

}
