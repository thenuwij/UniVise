
import { Navbar, NavbarBrand, NavbarCollapse, NavbarLink, NavbarToggle } from "flowbite-react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.svg"

export function Header() {
  return (
    <div className="mb-4">
      <Navbar fluid >
        <NavbarBrand href="https://flowbite-react.com" className="flex items-center">
          <img src={logo} alt="Univise Logo" className="mt-3"/>
          <span className="self-center whitespace-nowrap text-5xl font-semibold dark:text-sky-950">Univise</span>
        </NavbarBrand>
        <NavbarToggle />
      </Navbar>
    </div>
  );
}
