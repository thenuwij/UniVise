import {
  Avatar,
  DarkThemeToggle,
  Dropdown,
  DropdownDivider,
  DropdownHeader,
  DropdownItem,
  Navbar,
  NavbarBrand
} from "flowbite-react";
import { useEffect, useState } from "react";
import { LuMenu } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

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
        
          const firstName = user.user_metadata.first_name || user.user_metadata.full_name?.split(" ")[0] || '';
          const lastName = user.user_metadata.last_name || user.user_metadata.full_name?.split(" ")[1] || '';
          setDisplayName(`${firstName} ${lastName}`.trim());
          setDisplayEmail(user.email);
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    fetchUser();
  }, []);

  return (
    <div id="header" className="relative">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 dark:via-blue-500/30 to-transparent" />
      <Navbar fluid className="h-16 border-b border-white/20 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
        <button onClick={onMenuClick} className="flex items-center gap-1.5 ml-4 mb-4 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:scale-105 transition-all duration-200">
          <LuMenu className="w-5 h-5" />
          <span>Menu</span>
        </button>
        <NavbarBrand
          className="cursor-pointer"
          onClick={() => {navigate('/dashboard')}}
        >
          <img src={logo} className="h-14 w-14 mb-1"/>
          <span className="self-center whitespace-nowrap text-4xl mb-3" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif", fontWeight: 600, letterSpacing: '-0.02em' }}>Univise</span>
        </NavbarBrand>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center mb-4 mr-2">
            <DarkThemeToggle className="transition-all duration-300 ease-in-out hover:scale-105"/>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Theme</span>
          </div>
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
            <DropdownItem onClick={() => navigate("/profile")}>My Account</DropdownItem>
            <DropdownItem onClick={signOut}>Sign out</DropdownItem>
          </Dropdown>
        </div>
      </Navbar>
    </div>
  );
}