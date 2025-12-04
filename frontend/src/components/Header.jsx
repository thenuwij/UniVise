
import { DarkThemeToggle, Navbar, NavbarBrand, NavbarToggle } from "flowbite-react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";

export function Header() {
  return (
    <div className="mb-4" id="header">
      <Navbar fluid className="backdrop-blur-sm h-16 ">
        <NavbarBrand as={Link} to="/" className="flex items-center">
          <img src={logo} alt="Univise Logo"/>
          <span className="self-center whitespace-nowrap text-3xl mb-3">
            Univise
          </span>
        </NavbarBrand>
        <NavbarToggle />
        <DarkThemeToggle className="mb-4 transition-all duration-300 ease-in-out hover:scale-105"/>
      </Navbar>
    </div>
  );
}
