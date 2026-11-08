import { useNavigate } from "react-router-dom";
import { PlayCircle } from "lucide-react";
import { UserAuth } from "@/app/AuthContext";
import { isDemoUser } from "../utils/demo";

export default function DemoBanner() {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();

  if (!isDemoUser(session?.user)) return null;

  const createAccount = async () => {
    // Leave the signed-in pages first, or the sign-in guard sends the visitor to /login.
    navigate("/register", { replace: true });
    await signOut();
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-sm">
        <PlayCircle className="h-4 w-4 flex-shrink-0" aria-hidden />
        <span>
          <span className="font-semibold">You're exploring a demo.</span> Sample student data, deleted when you sign out.
        </span>
        <button type="button" onClick={createAccount} className="font-semibold underline underline-offset-2 hover:no-underline">
          Create your own account
        </button>
      </div>
    </div>
  );
}
