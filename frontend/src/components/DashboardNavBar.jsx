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
import { DarkThemeToggle } from "flowbite-react";
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
    <div id="header">
      <Navbar fluid className="h-16 border-2">
        <LuMenu className="w-8 h-8 ml-4 mb-4 hover:transform hover:scale-114 transition-transform duration-200" onClick={onMenuClick}/>
        <NavbarBrand
          className="cursor-pointer"
          onClick={() => {navigate('/dashboard')}}
        >
          <img src={logo} className="h-14 w-14 mb-1"/>
          <span className="self-center whitespace-nowrap text-3xl mb-3">Univise</span>
        </NavbarBrand>
        <div className="flex items-center gap-4"> 
          <DarkThemeToggle className="mb-4 mr-4 transition-all duration-300 ease-in-out hover:scale-105"/>
          <Dropdown
            arrowIcon={false}
            inline
            label={
              <Avatar alt="User settings"  
              rounded 
            className="mr-3 mb-4 hover:ring-3 hover:ring-gray-300 dark:hover:ring-gray-500 rounded-full"/>
            }
            >
            <DropdownHeader>
              <span className="block font-bold text-sm">{displayName}</span>
              <span className="block truncate text-sm font-medium">{displayEmail}</span>
            </DropdownHeader>
            <DropdownDivider />
            <DropdownItem onClick={() => navigate("/profile")} >My Account</DropdownItem>
            <DropdownItem onClick={signOut}>Sign out</DropdownItem>
          </Dropdown>
        </div>
      </Navbar>
    </div>
  );
}