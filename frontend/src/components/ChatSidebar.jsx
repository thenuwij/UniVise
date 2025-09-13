import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, SidebarItem, SidebarItemGroup, SidebarItems, SidebarLogo } from 'flowbite-react';
import { TbMessageChatbotFilled, TbChevronLeft, TbChevronRight, TbTrash } from 'react-icons/tb';
import { Button } from 'flowbite-react';
import { UserAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import Conversation from './Conversation';

function ChatSidebar({ isCollapsed = false, onToggleCollapse }) {

  const { session } = UserAuth();
  const [showModal, setShowModal] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [hoveredConversation, setHoveredConversation] = useState(null);
  const navigate = useNavigate();


  const handleCreate = async ({ title, conversationId }) => {

    const { data, error } = await supabase
      .from("conversations")
      .insert(
        { id: conversationId, 
          user_id: session.user.id, 
          title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString() })
    if (error) {
      console.error(error);
      return;
    }
    setShowModal(false);
    setConversations([...conversations, data[0]]);
    navigate(`/chat/${conversationId}`);
  };

  const deleteConversation = async (conversationId, e) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      // Delete all messages in the conversation first
      await supabase
        .from("conversation_messages")
        .delete()
        .eq("conversation_id", conversationId);

      // Then delete the conversation
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) {
        console.error("Error deleting conversation:", error);
        return;
      }

      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Navigate away if currently viewing deleted conversation
      const currentPath = window.location.pathname;
      if (currentPath.includes(conversationId)) {
        navigate('/chat');
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
    }
  };

  useEffect(() => {
    const fetchConversations = async () => {
      const response = await supabase.from('conversations').select('*')
        .eq('user_id', session?.user.id)
        .order('created_at', { ascending: false });

      if (response.error) {
        console.error('Error fetching conversations:', response.error);
      } else {
        setConversations(response.data);
      }
    }

    fetchConversations();
  }, [conversations, session]);

  return (
    <>
      <Conversation
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleCreate}
      />
      <Sidebar className="w-full h-screen">
        <SidebarItems className="h-full flex flex-col">
          {/* Toggle button */}
          <div className=" border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Button
              size="sm"
              pill
              color="gray"
              onClick={() => onToggleCollapse?.(!isCollapsed)}
              className="w-full justify-center"
            >
              {isCollapsed ? <TbChevronRight className="h-6 w-6" /> : <TbChevronLeft className="h-6 w-6" />}
            </Button>
          </div>

          {/* New chat button section */}
          <SidebarItemGroup className="flex-shrink-0">
            {isCollapsed ? (
              <Button 
                size="sm"
                pill
                className="w-full"
                onClick={() => setShowModal(true)}
                title="New chat"
              >
                <TbMessageChatbotFilled className="h-6 w-6" />
              </Button>
            ) : (
              <Button 
                size="md" 
                className="w-full" 
                onClick={() => setShowModal(true)}
              >
                <TbMessageChatbotFilled className="mr-3 h-6 w-6" />
                New chat
              </Button>
            )}
          </SidebarItemGroup>
          
          {/* Scrollable chats section */}
          <SidebarItemGroup className='flex-1 overflow-y-auto scrollbar-hide'>
            {!isCollapsed && (
              <h1 className='text-md ml-2 text-slate-800 dark:text-slate-300 mb-2'>Chats</h1>
            )}
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <div 
                  key={conversation.id}
                  className="relative"
                  onMouseEnter={() => setHoveredConversation(conversation.id)}
                  onMouseLeave={() => setHoveredConversation(null)}
                >
                  <SidebarItem 
                    onClick={() => navigate(`/chat/${conversation.id}`)} 
                    className={`flex items-center ${isCollapsed ? 'h-12 justify-center' : 'h-14'} group cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                    title={isCollapsed ? (conversation.title || 'Untitled Conversation') : ''}
                  >
                    {isCollapsed ? (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {(conversation.title || 'U').charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate flex-1">
                          {conversation.title || 'Untitled Conversation'}
                        </span>
                        {hoveredConversation === conversation.id && (
                          <Button
                            size="sm"
                            color="failure"
                            className="ml-2 p-1 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => deleteConversation(conversation.id, e)}
                            title="Delete conversation"
                          >
                            <TbTrash className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </SidebarItem>
                </div>
              ))
            ) : (
              !isCollapsed && (
                <h1 className='text-center font-semibold'>No conversations yet</h1>
              )
            )}
          </SidebarItemGroup>

        </SidebarItems>
      </Sidebar>
    </>
  );
}

export default ChatSidebar;