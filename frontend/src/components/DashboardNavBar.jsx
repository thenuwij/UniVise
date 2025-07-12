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
import { UserAuth } from "../context/AuthContext";

export function DashboardNavBar({ onMenuClick }) {

  const { signOut } = UserAuth();

  return (
    <Navbar fluid className="bg-white dark: bg-gradient-to-l from-sky-500 to-indigo-600 h-20">
      <LuMenu className="w-10 h-10 ml-4 mb-4 text-white" onClick={onMenuClick}/>
      <NavbarBrand>
        <img src={logo} className="h-18 w-18 mt-1"/>
        <span className="self-center whitespace-nowrap text-4xl text-white font-semibold mb-2">Univise</span>
      </NavbarBrand>
      <Dropdown
        arrowIcon={false}
        inline
        label={
          <Avatar alt="User settings"  
        rounded 
        className="mr-4 mb-3"/>
        }
      >
        <DropdownHeader>
          <span className="block text-sm">Bonnie Green</span>
          <span className="block truncate text-sm font-medium">name@flowbite.com</span>
        </DropdownHeader>
        <DropdownItem>Settings</DropdownItem>
        <DropdownDivider />
        <DropdownItem onClick={signOut}>Sign out</DropdownItem>
      </Dropdown>
    </Navbar>
  );
}