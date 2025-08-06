import React, { useState, useRef, useEffect } from "react";
import { Textarea, Button, Avatar } from "flowbite-react";
import { IoSend } from "react-icons/io5";
import { supabase } from "../supabaseClient";
import { TbRobot } from "react-icons/tb";
import { UserAuth } from "../context/AuthContext";

export default function ChatWindow({ convId }) {
  const { session } = UserAuth();

  const firstName = (session.user.user_metadata.first_name);
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
        .from("conversation_messages")
        .select("sender, content, created_at")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });
      if (error) console.error(error);
      else setMessages(
        data.map(({ sender, content, created_at }) => ({
          sender,
          text: content,
          created_at,
        }))
      );
    };
    load();
  }, [convId]);

  const sendMessage = async () => {
    const text = input.trim();
    // insert user message
    const { data: userMsg } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: convId,
        sender: "user",
        content: text,
      })
      .single();

    setMessages(m => [...m, {
      sender: "user",
      text,
      created_at: new Date().toISOString(),
    }])

    setInput("");

    if (textAreaRef.current) textAreaRef.current.style.height = "auto";
    const res = await fetch(`http://localhost:8000/chat/conversations/${convId}/reply/stream`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: text }),
    });

    if (!res.ok) throw new Error(await res.text());

    // 1. Create a new “bot” entry with empty text
    setMessages(ms => [
      ...ms,
      { sender: "bot", text: "", created_at: new Date().toISOString() }
    ]);

    // 2. Stream tokens and append to the last message
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunk = decoder.decode(value || new Uint8Array());
      setMessages(ms => {
        const last = ms[ms.length - 1];
        // update its text field
        const updated = { ...last, text: last.text + chunk };
        return [...ms.slice(0, -1), updated];
      });
    }
  }

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
            max-w-[60ch] p-3 text-lg whitespace-pre-wrap break-words
            ${
              isUser
                ? "bg-indigo-600 text-white rounded-bl-2xl rounded-tl-2xl rounded-tr-2xl"
                : "bg-gray-400 text-white rounded-br-2xl rounded-tr-2xl rounded-tl-2xl"
            }
          `}
        >
          {text}
          <div className="text-[14px] text-white mt-3 text-right">
            {new Date(created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    );
  }

return (
    <div className="flex flex-col h-full">
      {/* ─── Scrollable Messages ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-4 space-y-3 h-full mt-5">
          {
            messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-5">
                <p className="text-lg">Hi {firstName}! What would you like to ask me?</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <ChatBubble
                  key={i}
                  sender={msg.sender}
                  text={msg.text}
                  created_at={msg.created_at}
                />
              ))
            )
          }
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ─── Input Bar Pinned to Bottom ─────────────────────────────────────────── */}
      <div className="mt-auto">
        <div className="mx-auto max-w-6xl p-4 flex gap-4 items-center">
          <Textarea
            ref={textAreaRef}
            rows={1}
            placeholder="Ask me anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (loading || input.trim() === "") return;
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
            disabled={loading || input.trim() === ""}
            onClick={sendMessage}
          >
            <IoSend className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
