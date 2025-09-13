import React, { useState, useRef, useEffect } from "react";
import { Textarea, Button, Avatar } from "flowbite-react";
import { IoSend } from "react-icons/io5";
import { supabase } from "../supabaseClient";
import { TbRobot } from "react-icons/tb";
import { UserAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatWindow({ convId }) {
  const { session } = UserAuth();

  const firstName = (session.user.user_metadata.first_name);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [streamStarted, setStreamStarted] = useState(false);
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

    setLoading(true);
    setStreamStarted(false)
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

    if (!res.ok) {
      setLoading(false);
      throw new Error(await res.text());
    }

    // 1. Create a new "bot" entry with empty text
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
      setLoading(false);

      if (chunk && !streamStarted) {
        setStreamStarted(true);
      }
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
        <div
          className={`
            max-w-[60ch] p-4 text-base break-words transition-all duration-200
            ${
              isUser
                ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-br-md ml-12"
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-md mr-12 border border-gray-200 dark:border-gray-700 shadow-sm"
            }
          `}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // strip default <p> margin
              p: ({ node, ...props }) => (
                <p className="m-0 leading-snug" {...props} />
              ),
              // tighten headings
              h1: ({ ...props }) => (
                <h1 className="m-0 text-xl font-semibold" {...props} />
              ),
              h2: ({ ...props }) => (
                <h2 className="m-0 text-lg font-semibold" {...props} />
              ),
              // lists: no top/bottom margin, small indent
              ul: ({ ...props }) => (
                <ul className="list-disc ml-4 my-1" {...props} />
              ),
              ol: ({ ...props }) => (
                <ol className="list-decimal ml-4 my-1" {...props} />
              ),
              li: ({ ...props }) => <li className="ml-2" {...props} />,
              // code blocks / inline code
              code: ({ inline, ...props }) =>
                inline ? (
                  <code className="bg-gray-700 px-1 rounded" {...props} />
                ) : (
                  <pre className="bg-gray-700 p-2 rounded overflow-auto" {...props} />
                ),
            }}
          >
            {text}
          </ReactMarkdown>

          <div className="text-[14px] mt-2 text-white text-right">
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
    <div className="flex flex-col h-full relative">
      {/* ─── Scrollable Messages (Full Height) ───────────────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-y-auto scrollbar-hide">
        <div className="mx-auto max-w-4xl p-4 space-y-3 mt-5 pb-32">
          {
            messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-5">
                <p className="text-md">Hi {firstName}! What would you like to ask me?</p>
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
          {loading && (
            <div className="flex justify-start mt-4">
              <TbRobot className="animate-bounce w-10 h-10 text-gray-500" />
            </div>
          )}
          {/* Scroll to bottom */}
          <div className="h-0.5" />
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ─── Floating Input Bar ─────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-100 via-gray-100 to-transparent dark:from-gray-900 dark:via-gray-900 dark:to-transparent pt-8 pb-4">
        <div className="mx-auto max-w-3xl px-4">
          <div className="relative flex items-end bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-500 shadow-xl backdrop-blur-sm">
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
                flex-1 resize-none overflow-y-auto max-h-40 min-h-[80px]
                text-md p-6 pr-16 rounded-2xl border-0 focus:ring-0 focus:outline-none
                bg-transparent placeholder-gray-500 scrollbar-hide
              "
            />
            <Button
              size="lg"
              className="
                absolute right-3 bottom-3 w-12 h-12 p-0 
                bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
                rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center
              "
              disabled={loading || input.trim() === ""}
              onClick={sendMessage}
            >
              <IoSend className="w-5 h-5 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}