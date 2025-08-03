import React, { useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Chatbot from "../components/Chatbot";
import { MenuBar } from "../components/MenuBar";
import { DashboardNavBar } from "../components/DashboardNavBar";

function ChatbotPage() {
  const { signOut, session } = UserAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-white">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <div className="flex flex-col items-center justify-center px-4 py-12">
        {/* Heading */}
        <h1 className="text-3xl sm:text-5xl font-light text-slate-800 mb-2 text-center">
          Ask anything about your future!
        </h1>

        {/* Chatbot Container */}
        <div className="w-full max-w-6xl min-h-[80vh] bg-white rounded-3xl shadow-xl border border-slate-200 px-4 py-6">
          <Chatbot />
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;
