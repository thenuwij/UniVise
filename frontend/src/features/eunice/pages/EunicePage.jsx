import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppNav from "@/shared/layout/AppNav";
import { UserAuth } from "@/app/AuthContext";
import { listConversations, removeConversation } from "../api";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";

const startsCollapsed = () => typeof window !== "undefined" && window.innerWidth < 768;

export default function EunicePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(startsCollapsed);
  const [conversations, setConversations] = useState([]);
  const { conversationId } = useParams();
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    listConversations(userId)
      .then(({ data, error }) => {
        if (error) console.error("Error fetching conversations:", error);
        else setConversations(data || []);
      });
  }, [userId]);

  const deleteConversation = async (id) => {
    if (!confirm("Delete this chat? This can't be undone.")) return;
    const { error } = await removeConversation(id);
    if (error) {
      console.error("Error deleting conversation:", error);
      return;
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === conversationId) navigate("/chat");
  };

  return (
    <div className="flex flex-col h-screen app-page">
      <AppNav />

      <div className="flex overflow-hidden flex-1">
        <div className={`${sidebarCollapsed ? "w-16" : "w-64"} flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden`}>
          <ChatSidebar
            conversations={conversations}
            activeId={conversationId}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={setSidebarCollapsed}
            onDelete={deleteConversation}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            convId={conversationId}
            onCreated={(conversation) => {
              setConversations((prev) => [conversation, ...prev]);
              navigate(`/chat/${conversation.id}`, { replace: true });
            }}
          />
        </div>
      </div>
    </div>
  );
}
