import React from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "flowbite-react";
import Logo from "../components/Logo";
import Chatbot from "../components/Chatbot";
import { MenuBar } from "../components/MenuBar";
import { useState } from "react";
import { DashboardNavBar } from "../components/DashboardNavBar";

function ChatbotPage() {
  const { signOut, session } = UserAuth();
  const navigate = useNavigate();

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  return (
    <div>
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      <div className="flex flex-col justify-center h-full mx-20">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-4xl font-semibold text-gray-700 mt-5">
            Ask me anything about your future!
          </h1>
        </div>

        <div className="w-full">
              <Chatbot />
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;