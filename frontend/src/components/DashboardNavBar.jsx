import {
  Avatar,
  Button,
  Dropdown,
  DropdownDivider,
  DropdownHeader,
  DropdownItem,
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
} from "flowbite-react";
import logo from "../assets/logo.svg"; 
import { useState } from "react";
import { LuMenu } from "react-icons/lu";

export function DashboardNavBar({ onMenuClick }) {

  const [isOpen, setIsOpen] = useState(false);
  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <Navbar fluid rounded>
      <LuMenu className="w-10 h-10 ml-4" onClick={onMenuClick}/>
      <NavbarBrand>
        <img src={logo} className="mt-4 h-18 w-18"/>
        <span className="self-center whitespace-nowrap text-4xl font-semibold">Univise</span>
      </NavbarBrand>
      <Dropdown
        arrowIcon={false}
        inline
        label={
          <Avatar alt="User settings" img="https://flowbite.com/docs/images/people/profile-picture-5.jpg" rounded className="mr-5"/>
        }
      >
        <DropdownHeader>
          <span className="block text-sm">Bonnie Green</span>
          <span className="block truncate text-sm font-medium">name@flowbite.com</span>
        </DropdownHeader>
        <DropdownItem>Settings</DropdownItem>
        <DropdownDivider />
        <DropdownItem>Sign out</DropdownItem>
      </Dropdown>
    </Navbar>
  );
}