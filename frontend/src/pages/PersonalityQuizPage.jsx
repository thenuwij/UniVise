import PersonalityQuizForm from "../components/PersonalityQuizForm";
import { Button } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import { motion } from "framer-motion"; // ✅ Add animation support

const PersonalityQuizPage = () => {
  const { session, signOut } = UserAuth();
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
    <motion.div
      className="min-h-screen bg-gradient-to-br from-white via-sky-100 to-indigo-200 flex flex-col items-center relative"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* Sign Out Button */}
      <div className="absolute top-4 sm:top-8 right-2 sm:right-4">
        <Button color="gray" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>

      {/* Logo */}
      <div className="absolute top-4 left-4 sm:left-6 lg:left-8">
        <Logo />
      </div>

      {/* Welcome Text */}
      <div className="mt-12 sm:mt-16 md:mt-20 text-center px-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600 mb-8 leading-tight">
          Discover Your Personality
        </h1>
      </div>

      {/* Quiz Form Section */}
      <div className="flex-grow w-full flex items-center justify-center px-4 pb-20">
        <PersonalityQuizForm />
      </div>
    </motion.div>
  );
};

export default PersonalityQuizPage;
