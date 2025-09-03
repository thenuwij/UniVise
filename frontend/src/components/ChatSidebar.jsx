import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, SidebarItem, SidebarItemGroup, SidebarItems, SidebarLogo } from 'flowbite-react';
import { TbMessageChatbotFilled } from 'react-icons/tb';
import { Button } from 'flowbite-react';
import { UserAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import Conversation from './Conversation';

function ChatSidebar() {

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
      <Sidebar className="w-full rounded-4xl">
        <SidebarItems>
          <SidebarItemGroup>
            <Button size="lg" className="w-full bg-gradient-to-br from-purple-600 to-blue-500 text-white hover:bg-gradient-to-bl" onClick={() => setShowModal(true)}>
              <TbMessageChatbotFilled className="mr-3 h-8 w-8" />
              New chat
            </Button>
          </SidebarItemGroup>
          
          <SidebarItemGroup className='overflow-y-auto h-[calc(100vh-200px)]'>
            <h1 className='text-md ml-2 text-slate-800 dark:text-slate-300'>Chats</h1>
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <SidebarItem key={conversation.id} onClick={() => navigate(`/chat/${conversation.id}`)} className="flex items-center h-14">
                  {conversation.title || 'Untitled Conversation'}
                </SidebarItem>
              ))
            ) : (
              <h1 className='text-center font-semibold'>No conversations yet</h1>
            )}
          </SidebarItemGroup>

        </SidebarItems>
      </Sidebar>
    </>
  );
}

export default ChatSidebar;
