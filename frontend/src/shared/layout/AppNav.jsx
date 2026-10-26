import { useState } from "react";
import { NavBar } from "./NavBar";
import { MenuDrawer } from "./MenuDrawer";

export default function AppNav() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <NavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
      <MenuDrawer isOpen={isOpen} handleClose={() => setIsOpen(false)} />
    </>
  );
}
