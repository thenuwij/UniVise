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
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-100 to-indigo-200 flex flex-col items-center relative"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Sign Out Button top-right */}
      <div className="absolute top-4 sm:top-8 right-2 sm:right-4">
        <Button color="gray" size="sm" onClick={handleSignOut}>Sign Out</Button>
      </div>

      <div className="absolute top-4 left-4 sm:left-6 lg:left-8">
        <Logo />
      </div>

      {/* Welcome Heading */}
      <div className="mt-12 sm:mt-16 md:mt-20 text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600 mb-4 leading-tight">
          UniVise AI Chat
        </h1>
        <p className="text-gray-700 text-lg">Ask questions, get guidance, explore your pathways.</p>
      </div>

      {/* Chatbot Container */}
      <div className="flex flex-col items-center justify-center flex-grow w-full">
        <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl p-6 sm:p-8 lg:p-12 border border-gray-200 flex flex-col items-center justify-center mb-12">
          <div className="w-full max-w-2xl px-4 sm:px-0">
            <Chatbot />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;
