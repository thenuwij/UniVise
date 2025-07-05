import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { PiRobotLight } from "react-icons/pi"; // Robot icon as placeholder animated character

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { session } = UserAuth();
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    const { data: { session: currentSession } } = await supabase.auth.getSession();

    const res = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentSession.access_token}`
      },
      body: JSON.stringify({ message: userMessage })
    });

    const data = await res.json();
    const botReply = data.reply;

    setMessages(prev => [...prev, { sender: "bot", text: botReply }]);
    setLoading(false);

    await supabase.from("user_chatbot_sessions").insert([
      {
        user_id: session.user.id,
        message: userMessage,
        response: botReply
      }
    ]);
  };

  return (
    <div className="w-full h-[500px] sm:h-[600px] md:h-[700px] flex flex-col bg-gray-100 rounded-2xl shadow-lg overflow-hidden relative">
      
      {/* Chat Window */}
      <div className="flex-grow overflow-y-scroll p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-2 max-w-xs rounded-lg ${
              msg.sender === "user" ? "bg-sky-500 text-white" : "bg-white text-gray-900 border"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Character Illustration */}
      <div className="absolute bottom-20 left-4 animate-bounce hidden sm:block">
        <PiRobotLight size={40} className="text-sky-500" />
      </div>

      {/* Input Bar */}
      <div className="flex p-3 border-t bg-white">
        <input
          className="flex-grow border border-gray-300 p-2 rounded-lg mr-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button
          className="bg-sky-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
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
