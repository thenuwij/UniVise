import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";

const startsCollapsed = () => typeof window !== "undefined" && window.innerWidth < 768;

export default function ChatbotPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(startsCollapsed);
  const [conversations, setConversations] = useState([]);
  const { conversationId } = useParams();
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("Error fetching conversations:", error);
        else setConversations(data || []);
      });
  }, [userId]);

  const deleteConversation = async (id) => {
    if (!confirm("Delete this chat? This can't be undone.")) return;
    await supabase.from("conversation_messages").delete().eq("conversation_id", id);
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) {
      console.error("Error deleting conversation:", error);
      return;
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === conversationId) navigate("/chat");
  };

  return (
    <div className="flex flex-col h-screen app-page">
      <DashboardNavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />

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
