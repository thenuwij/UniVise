import { useState } from "react";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import PageHeader from "@/shared/layout/PageHeader";
import { card } from "@/shared/ui/cardStyles";
import { useBackToHandbook } from "../hooks/useBackToHandbook";

export default function DetailLoading({ failed, what }) {
  const [isOpen, setIsOpen] = useState(false);
  const goBack = useBackToHandbook();

  return (
    <div className="min-h-screen app-page">
      <DashboardNavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />
      <PageHeader
        back={{ label: "Back", onClick: goBack }}
        eyebrow={failed ? "Something went wrong" : `Loading ${what}`}
        title={failed ? `This ${what} couldn't be loaded` : null}
        subtitle={failed ? "Check your connection and try again, or go back to the Handbook." : null}
      />
      <main className="max-w-[1440px] mx-auto px-5 md:px-10 py-8">
        {failed ? (
          <button onClick={() => window.location.reload()} className="button-primary px-5 py-2.5 rounded-xl text-sm font-bold">
            Try again
          </button>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 rounded-2xl border border-line bg-surface animate-pulse" />
              ))}
            </div>
            <div className={`${card} w-full lg:w-80 h-48 animate-pulse`} />
          </div>
        )}
      </main>
    </div>
  );
}
