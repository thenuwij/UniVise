import { Button } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import { HiSwitchHorizontal } from "react-icons/hi";

export default function ProgramTransferCard() {
  const navigate = useNavigate();

  return (
    <div className="card-glass-spotlight w-full h-full">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(420px_200px_at_90%_-20%,rgba(56,189,248,0.18),transparent),radial-gradient(380px_220px_at_0%_-10%,rgba(99,102,241,0.16),transparent)]" />
      <div className="relative p-6 md:p-7 flex flex-col h-full">
        <div className="flex items-center justify-end">
          <HiSwitchHorizontal className="h-8 w-8 text-blue-500 dark:text-cyan-400 opacity-60" />
        </div>

        <h3 className="mt-4 text-2xl font-semibold tracking-tight">
          Thinking of switching degrees?
        </h3>
        <p className="mt-2 text-sm font-normal text-slate-600 dark:text-slate-400">
          Compare your program against any UNSW degree and see exactly which courses transfer,
          which won't, and what's left to complete.
        </p>

        <div className="mt-auto pt-6">
          <Button onClick={() => navigate("/progress")} pill className="button-primary w-full">
            <HiSwitchHorizontal className="mr-2 h-4 w-4" />
            Program Transfer
          </Button>
        </div>
      </div>
    </div>
  );
}
