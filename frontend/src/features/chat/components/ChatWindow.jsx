import { useState, useRef, useEffect } from "react";
import { Textarea } from "flowbite-react";
import { MessageCircle, SendHorizontal } from "lucide-react";
import { v4 as uuid } from "uuid";
import { supabase } from "@/shared/lib/supabase";
import { UserAuth } from "@/app/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiFetch } from "@/shared/lib/api";
import { readStreamText, withCutOffNote } from "../utils/streamText";

const TITLE_MAX = 60;

function titleFrom(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= TITLE_MAX) return clean;
  const cut = clean.slice(0, TITLE_MAX);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 30 ? cut.lastIndexOf(" ") : TITLE_MAX)}…`;
}

export default function ChatWindow({ convId, onCreated, compact = false, getPage }) {
  const { session } = UserAuth();

  const firstName = session?.user?.user_metadata?.first_name;
  const userType = session?.user?.user_metadata?.student_type;
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [streamStarted, setStreamStarted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const chatEndRef              = useRef(null);
  const textAreaRef             = useRef(null);
  const skipLoadRef             = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // load history
  useEffect(() => {
    if (!convId) {
      setMessages([]);
      return;
    }
    if (convId === skipLoadRef.current) {
      skipLoadRef.current = null;
      return;
    }
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

  const sendMessage = async (preset) => {
    const text = (preset ?? input).trim();
    if (!text || loading) return;

    setLoading(true);
    setStreamStarted(false)

    let id = convId;
    if (!id) {
      id = uuid();
      const now = new Date().toISOString();
      const { data: created, error: createError } = await supabase
        .from("conversations")
        .insert({ id, user_id: session.user.id, title: titleFrom(text), created_at: now, updated_at: now })
        .select()
        .single();
      if (createError) {
        console.error(createError);
        setLoading(false);
        setMessages(ms => [...ms, { sender: "bot", text: "Your chat couldn't be started. Please try again.", created_at: new Date().toISOString() }]);
        return;
      }
      skipLoadRef.current = id;
      onCreated?.(created);
    }

    // insert user message
    const { error: saveError } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: id,
        sender: "user",
        content: text,
      });

    if (saveError) {
      setLoading(false);
      setMessages(ms => [...ms, { sender: "bot", text: "Your message wasn't sent. Please try again.", created_at: new Date().toISOString() }]);
      return;
    }

    setMessages(m => [...m, {
      sender: "user",
      text,
      created_at: new Date().toISOString(),
    }])

    setInput("");

    if (textAreaRef.current) textAreaRef.current.style.height = "auto";

    let res;
    try {
      res = await apiFetch(`/chat/conversations/${id}/reply/stream`, {
        method: "POST",
        token: session?.access_token,
        body: { content: text, page: getPage?.() || null },
      });
    } catch {
      setLoading(false);
      setMessages(ms => [...ms, { sender: "bot", text: "Sorry, something went wrong. Please try again.", created_at: new Date().toISOString() }]);
      return;
    }

    if (!res.ok) {
      setLoading(false);
      setMessages(ms => [...ms, { sender: "bot", text: "Sorry, I couldn't process your message. Please try again.", created_at: new Date().toISOString() }]);
      return;
    }

    // 1. Create a new "bot" entry with empty text
    setMessages(ms => [
      ...ms,
      { sender: "bot", text: "", created_at: new Date().toISOString() }
    ]);

    // 2. Stream tokens and replace the last message's text
    const showReply = (replyText) =>
      setMessages(ms => [...ms.slice(0, -1), { ...ms[ms.length - 1], text: replyText }]);

    let raw = "";
    let cutOff = false;
    try {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value || new Uint8Array(), { stream: !done });
        raw += chunk;
        setLoading(false);

        if (chunk && !streamStarted) {
          setStreamStarted(true);
        }
        showReply(readStreamText(raw, done).text);
      }
    } catch {
      cutOff = true;
    }

    const reply = readStreamText(raw, true);
    setLoading(false);
    if (cutOff || reply.cutOff) showReply(withCutOffNote(reply.text));
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
            max-w-[60ch] break-words transition-all duration-200 ${compact ? "p-3 text-[15px]" : "p-4 text-base"}
            ${
              isUser
                ? `bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-br-md ${compact ? "ml-8" : "ml-12"}`
                : `bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-bl-md border border-slate-200 dark:border-slate-700 shadow-sm ${compact ? "mr-4" : "mr-12"}`
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
              pre: ({ children }) => <>{children}</>,
              // code blocks / inline code
              code: ({ className, children, ...props }) =>
                !/language-/.test(className || "") && !String(children).includes("\n") ? (
                  <code className={`px-1 rounded text-sm ${isUser ? "bg-white/20" : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100"}`} {...props}>{children}</code>
                ) : (
                  <pre className={`p-2 rounded overflow-auto text-sm ${isUser ? "bg-white/15" : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100"}`}><code {...props}>{children}</code></pre>
                ),
            }}
          >
            {text}
          </ReactMarkdown>

          <div className={`text-[11px] mt-2 text-right ${isUser ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}>
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
        <div className={`mx-auto max-w-4xl space-y-3 ${compact ? "p-3 pb-40" : "p-4 mt-5 pb-32"}`}>
          {
            messages.length === 0 ? (
              <div className={`flex flex-col items-center justify-center h-full text-center ${compact ? "py-6 px-2" : "py-20 px-6"}`}>
                <div className={`rounded-full bg-blue-100 dark:bg-blue-900/40 ${compact ? "p-3 mb-3" : "p-4 mb-5"}`}>
                  <MessageCircle className={`text-blue-600 dark:text-blue-400 ${compact ? "w-7 h-7" : "w-10 h-10"}`} />
                </div>
                <h2 className={`font-bold text-ink-strong mb-1 ${compact ? "text-lg" : "text-2xl"}`}>Hi{firstName ? ` ${firstName}` : ""}, I'm Eunice</h2>
                <p className={`text-ink-muted max-w-md ${compact ? "text-sm mb-5" : "text-base mb-8"}`}>
                  {compact
                    ? "Ask about your courses, what's left in your degree, or this page."
                    : "Your academic and career advisor. Ask me anything about your courses, career paths or university life, or pick a question to start."}
                </p>
                <div className={`grid gap-3 max-w-lg w-full ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
                  {(userType === "high_school" ? [
                    "What degrees suit my interests?",
                    "How do I improve my ATAR?",
                    "What subjects should I pick?",
                    "Tell me about my recommendations",
                  ] : compact ? [
                    "How many courses do I have left?",
                    "Which courses should I take next?",
                    "Explain this page for me",
                  ] : [
                    "What careers suit my profile?",
                    "How can I improve my WAM?",
                    "What electives should I pick?",
                    "Tell me about my recommendations",
                  ]).map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      disabled={loading}
                      className="text-left px-4 py-3 rounded-xl text-sm font-semibold text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
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
            <div className="flex justify-start mt-2 ml-1">
              <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          {/* Scroll to bottom */}
          <div className="h-0.5" />
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ─── Floating Input Bar ─────────────────────────────────────────── */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t to-transparent dark:to-transparent ${compact ? "from-white via-white/90 dark:from-slate-900 dark:via-slate-900/90 pt-6 pb-3" : "from-slate-100 via-slate-100/90 dark:from-slate-950 dark:via-slate-950/90 pt-8 pb-4"}`}>
        <div className={`mx-auto max-w-3xl ${compact ? "px-3" : "px-4"}`}>
          <div className="relative flex items-end bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-xl backdrop-blur-sm">
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
                  sendMessage();
                }
              }}
              className={`
                flex-1 resize-none overflow-y-auto max-h-40 rounded-2xl border-0 focus:ring-0 focus:outline-none
                bg-transparent placeholder-slate-400 dark:placeholder-slate-500 scrollbar-hide
                ${compact ? "min-h-[56px] text-[15px] p-4 pr-14" : "min-h-[80px] text-md p-6 pr-16"}
              `}
            />
            <button
              type="button"
              aria-label="Send"
              className={`absolute inline-flex items-center justify-center rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${compact ? "right-2 bottom-2 w-10 h-10" : "right-3 bottom-3 w-12 h-12"}`}
              disabled={loading || input.trim() === ""}
              onClick={() => sendMessage()}
            >
              <SendHorizontal className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-ink-muted">
            {compact
              ? "Eunice can make mistakes. Check important details in the Handbook."
              : "Enter to send, Shift + Enter for a new line. Eunice can make mistakes, so check important details in the Handbook."}
          </p>
        </div>
      </div>
    </div>
  );
}