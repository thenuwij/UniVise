import React, { useState, useRef, useEffect } from "react";
import { Textarea, Button, Avatar } from "flowbite-react";
import { IoSend } from "react-icons/io5";

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const chatEndRef              = useRef(null);
  const textAreaRef             = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // load history
  useEffect(() => {
    if (!convId) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });
      if (error) console.error(error);
      else setMessages(data);
    };
    load();
  }, [convId]);

  const sendMessage = async (text) => {
    // insert user message
    const { data: userMsg } = await supabase
      .from("messages")
      .insert({
        conversation_id: convId,
        sender: "user",
        content: text,
      })
      .single();

    setMessages(m => [...m, userMsg]);

    // call backend /chat/conversations/:convId/messages
    const { reply } = await fetch(`/chat/conversations/${convId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ content: text }),
    }).then(r => r.json());

    // insert bot reply
    const { data: botMsg } = await supabase
      .from("messages")
      .insert({
        conversation_id: convId,
        sender: "bot",
        content: reply,
      })
      .single();
    setMessages(m => [...m, botMsg]);
  };


  // ─── ChatBubble in same file ─────────────────────────────
  function ChatBubble({ sender, text, created_at }) {
    const isUser = sender === "user";

    return (
      <div
        className={`flex items-end mb-4 ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >


        {/* Bubble with ch-based max width */}
        <div
          className={`
            max-w-[60ch] p-3 text-base whitespace-pre-wrap break-words
            ${
              isUser
                ? "bg-gray-400 text-white rounded-bl-2xl rounded-tl-2xl rounded-tr-2xl"
                : "bg-gray-400 text-white rounded-br-2xl rounded-tr-2xl rounded-tl-2xl"
            }
          `}
        >
          {text}
          <div className="text-[10px] text-gray-400 mt-1 text-right">
            {new Date(created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {/* User avatar */}
        {isUser && (
          <Avatar
            rounded
            size="md"
            className="ml-2"
          />
        )}
      </div>
    );
  }

return (
    <div className="flex flex-col h-full">
      {/* ─── Scrollable Messages ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-4 space-y-3">
          {messages.map((msg, i) => (
            <ChatBubble key={i} {...msg} />
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ─── Input Bar Pinned to Bottom ─────────────────────────────────────────── */}
      <div className="mt-auto">
        <div className="mx-auto max-w-6xl p-4 flex gap-4 items-center">
          <Textarea
            ref={textAreaRef}
            rows={1}
            placeholder="Type your message…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="
              flex-1 resize-none overflow-y-auto max-h-48
              text-lg p-4 rounded-2xl focus:ring-2 focus:ring-blue-300
            "
          />
          <Button
            size="lg" pill
            className="
              w-24 bg-gradient-to-br from-purple-600 to-blue-500
              text-white hover:bg-gradient-to-bl rounded-2xl
            "
            disabled={loading}
            onClick={sendMessage}
          >
            <IoSend className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
