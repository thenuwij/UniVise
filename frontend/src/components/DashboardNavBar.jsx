import {
  Avatar,
  Dropdown,
  DropdownDivider,
  DropdownHeader,
  DropdownItem,
  Navbar,
  NavbarBrand
} from "flowbite-react";
import { useEffect, useState } from "react";
import { HiMoon, HiSun } from "react-icons/hi";
import { LuMenu } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

export function DashboardNavBar({ onMenuClick, isMenuOpen = false }) {

  const [displayName, setDisplayName] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");
  const { signOut } = UserAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(
    localStorage.getItem("color-theme") === "dark" ||
    document.documentElement.classList.contains("dark")
  );

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.setItem("color-theme", "light");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      localStorage.setItem("color-theme", "dark");
      setIsDark(true);
    }
  };

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
        <button onClick={onMenuClick} className="flex items-center gap-1.5 ml-4 mb-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:scale-105 transition-all duration-200">
          <LuMenu className={`w-10 h-10 transition-transform duration-300 ${isMenuOpen ? "rotate-90" : "rotate-0"}`} />
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
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-200 mb-4 flex-shrink-0"
          >
            {isDark
              ? <HiSun className="w-5 h-5 text-amber-500" />
              : <HiMoon className="w-5 h-5 text-blue-700" />
            }
          </button>
          <Dropdown
            arrowIcon={false}
            inline
            label={
              <Avatar alt="User settings"
              rounded
            className="mr-3 mb-4 rounded-full [&_svg]:text-slate-600 dark:[&_svg]:text-slate-300"/>
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