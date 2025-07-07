import React from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "flowbite-react";
import Logo from "../components/Logo";
import Chatbot from "../components/Chatbot";

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-sky-50 to-indigo-100 px-4 relative"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Sign Out Button top-right */}
    <div className="absolute top-4 right-4">
        <Button color="gray" size="sm" onClick={handleSignOut}>Sign Out</Button>
      </div>

      <div className="absolute top-4 left-4">
        <Logo />
      </div>

      {/* Welcome Heading */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Your Personal Advisor
        </h1>
        <p className="text-gray-600 text-base">Friendly, personalised guidance</p>
      </div>

      {/* Chatbot Container */}
      <div className="w-full">
            <Chatbot />
      </div>
    </div>
  );
}

export default ChatbotPage;
