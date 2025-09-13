import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, SidebarItem, SidebarItemGroup, SidebarItems, SidebarLogo } from 'flowbite-react';
import { TbMessageChatbotFilled, TbChevronLeft, TbChevronRight } from 'react-icons/tb';
import { Button } from 'flowbite-react';
import { UserAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import Conversation from './Conversation';

function ChatSidebar({ isCollapsed = false, onToggleCollapse }) {

  const { session } = UserAuth();
  const [showModal, setShowModal] = useState(false);
  const [conversations, setConversations] = useState([]);
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
          <div className="border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Button
              size="sm"
              color="gray"
              onClick={() => onToggleCollapse?.(!isCollapsed)}
              className="w-full"
            >
              {isCollapsed ? <TbChevronRight className="h-5 w-5" /> : <TbChevronLeft className="h-5 w-5" />}
            </Button>
          </div>

          {/* New chat button section */}
          <SidebarItemGroup className="flex-shrink-0">
            {isCollapsed ? (
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => setShowModal(true)}
                title="New chat"
              >
                <TbMessageChatbotFilled className="h-6 w-6" />
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="w-full" 
                onClick={() => setShowModal(true)}
              >
                <TbMessageChatbotFilled className="mr-3 h-8 w-8" />
                New chat
              </Button>
            )}
          </SidebarItemGroup>
          
          {/* Scrollable chats section */}
          <SidebarItemGroup className='flex-1 overflow-y-auto'>
            {!isCollapsed && (
              <h1 className='text-md ml-2 text-slate-800 dark:text-slate-300 mb-2'>Chats</h1>
            )}
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <SidebarItem 
                  key={conversation.id} 
                  onClick={() => navigate(`/chat/${conversation.id}`)} 
                  className={`flex items-center ${isCollapsed ? 'h-12 justify-center' : 'h-14'}`}
                  title={isCollapsed ? (conversation.title || 'Untitled Conversation') : ''}
                >
                  {isCollapsed ? (
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {(conversation.title || 'U').charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <span className="truncate">
                      {conversation.title || 'Untitled Conversation'}
                    </span>
                  )}
                </SidebarItem>
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