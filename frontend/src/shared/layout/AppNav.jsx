import { useState } from "react";
import { DashboardNavBar } from "./DashboardNavBar";
import { MenuBar } from "./MenuBar";

export default function AppNav() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <DashboardNavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />
    </>
  );
}
