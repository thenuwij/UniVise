import { useNavigate } from "react-router-dom";
import { MessageCircle, PanelLeftClose, PanelLeftOpen, Plus, Trash2 } from "lucide-react";

function ChatSidebar({ conversations, activeId, isCollapsed = false, onToggleCollapse, onDelete }) {
  const navigate = useNavigate();

  return (
    <aside className="h-full flex flex-col gap-3 p-3 border-r border-line bg-white/70 dark:bg-slate-900/80 backdrop-blur-md">
      <div className={`flex ${isCollapsed ? "justify-center" : "justify-end"}`}>
        <button
          type="button"
          onClick={() => onToggleCollapse?.(!isCollapsed)}
          aria-label={isCollapsed ? "Show chats" : "Hide chats"}
          title={isCollapsed ? "Show chats" : "Hide chats"}
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
        >
          {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      <button
        type="button"
        onClick={() => navigate("/chat")}
        title="New chat"
        className={`inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors ${isCollapsed ? "h-10 w-10 self-center" : "w-full px-4 py-2.5"}`}
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
        {!isCollapsed && "New chat"}
      </button>

      <nav aria-label="Your chats" className="flex-1 overflow-y-auto scrollbar-hide">
        {!isCollapsed && <p className="px-2 mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Chats</p>}
        {conversations.length > 0 ? (
          <ul className="space-y-0.5">
            {conversations.map((conversation) => {
              const active = conversation.id === activeId;
              const title = conversation.title || "Untitled chat";
              return (
                <li key={conversation.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => navigate(`/chat/${conversation.id}`)}
                    aria-current={active ? "page" : undefined}
                    title={title}
                    className={`w-full flex items-center gap-2.5 rounded-lg text-left text-sm transition-colors ${
                      isCollapsed ? "h-10 justify-center" : "pl-2.5 pr-10 py-2"
                    } ${
                      active
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-semibold"
                        : "text-ink hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <MessageCircle className={`h-4 w-4 flex-shrink-0 ${active ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                    {!isCollapsed && <span className="truncate">{title}</span>}
                  </button>
                  {!isCollapsed && (
                    <button
                      type="button"
                      onClick={() => onDelete(conversation.id)}
                      aria-label={`Delete ${title}`}
                      title="Delete chat"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          !isCollapsed && <p className="px-2 text-sm text-ink-muted">No chats yet. Ask Eunice anything to start one.</p>
        )}
      </nav>
    </aside>
  );
}

export default ChatSidebar;
