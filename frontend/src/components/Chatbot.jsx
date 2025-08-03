import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { session } = UserAuth();
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem("chatbot_history")) || [];
    if (storedMessages.length === 0) {
      const welcome = {
        sender: "bot",
        text: "Hi, I’m Eunice, your personal academic advisor! How may I help?",
      };
      setMessages([welcome]);
      localStorage.setItem("chatbot_history", JSON.stringify([welcome]));
    } else {
      setMessages(storedMessages);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chatbot_history", JSON.stringify(messages));
  }, [messages]);

  const fetchBotReply = async (userMessage) => {
    const { data: sessionData, error } = await supabase.auth.getSession();
    if (error || !sessionData?.session?.access_token) {
      throw new Error("User not authenticated");
    }

    const token = sessionData.session.access_token;

    const res = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!res.ok) throw new Error("Error from chatbot API");

    const data = await res.json();
    return data.reply;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const botReply = await fetchBotReply(userMessage);
      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[75vh] sm:h-[80vh] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden relative border">

      {/* Chat Window */}
      <div className="flex-grow overflow-y-auto p-5 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.sender === "bot" ? (
              <div className="flex items-end space-x-2 max-w-lg">
                <img
                  src="/src/assets/eunice-avatar.png"
                  alt="Eunice Avatar"
                  className="w-9 h-9 rounded-full object-cover border border-sky-300"
                />
                <div className="relative">
                  {/* Tail triangle */}
                  <div
                    className="absolute left-[-10px] bottom-2"
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: "10px solid white",
                      borderLeft: "10px solid transparent",
                      borderRight: "10px solid transparent",
                    }}
                  />
                  <div className="px-4 py-3 rounded-2xl shadow-sm bg-white text-gray-800 border border-gray-200">
                    <span style={{ whiteSpace: "pre-wrap" }}>{msg.text}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ml-auto px-4 py-3 max-w-lg bg-gradient-to-br from-sky-500 to-sky-700 text-white rounded-2xl shadow-sm">
                <span style={{ whiteSpace: "pre-wrap" }}>{msg.text}</span>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-center space-x-2 pl-1">
            <img
              src="/src/assets/eunice-avatar.png"
              alt="Eunice Avatar"
              className="w-9 h-9 rounded-full object-cover border border-sky-300"
            />
            <div className="flex space-x-1 text-sky-600 text-2xl">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div className="flex items-center gap-3 p-4 border-t bg-white">
        <input
          className="flex-grow border border-gray-300 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Ask Eunice anything about degrees, majors, or careers..."
        />
        <button
          className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
          onClick={sendMessage}
          disabled={loading}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
