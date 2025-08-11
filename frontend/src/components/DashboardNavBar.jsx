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
import { useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export function DashboardNavBar({ onMenuClick }) {

  const [displayName, setDisplayName] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");
  const { signOut } = UserAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error fetching user:", userError);
          return null; // or handle the error appropriately
        }
        
          const firstName = user.user_metadata.first_name || '';
          const lastName = user.user_metadata.last_name || '';
          setDisplayName(`${firstName} ${lastName}`.trim());
          setDisplayEmail(user.email);
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    fetchUser();
  }, []);

  return (
    <Navbar fluid className="bg-white dark: bg-gradient-to-l from-sky-500 to-indigo-600 h-16">
      <LuMenu className="w-7 h-7 ml-4 mb-4 text-white" onClick={onMenuClick}/>
      <NavbarBrand>
        <img src={logo} className="h-14 w-14 mt-1"/>
        <span className="self-center whitespace-nowrap text-3xl text-white font-semibold mb-2">Univise</span>
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
          <span className="block font-bold text-sm">{displayName}</span>
          <span className="block truncate text-sm font-medium">{displayEmail}</span>
        </DropdownHeader>
        <DropdownDivider />
        <DropdownItem href="/profile" >My Account</DropdownItem>
        <DropdownItem onClick={signOut}>Sign out</DropdownItem>
      </Dropdown>
    </Navbar>
  );
}