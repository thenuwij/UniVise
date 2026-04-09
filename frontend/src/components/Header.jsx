import { useState } from "react";
import { HiMoon, HiSun } from "react-icons/hi";
import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";

export function Header() {
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

  return (
    <div className="mb-4" id="header">
      <div className="flex items-center justify-between px-6 h-16 backdrop-blur-sm bg-white/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
        <Link to="/" className="flex items-center gap-1">
          <img src={logo} alt="Univise Logo" className="h-12 w-12" />
          <span
            className="whitespace-nowrap text-4xl"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif", fontWeight: 600, letterSpacing: '-0.02em' }}
          >
            Univise
          </span>
        </Link>
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-200"
        >
          {isDark
            ? <HiSun className="w-5 h-5 text-amber-500" />
            : <HiMoon className="w-5 h-5 text-blue-700" />
          }
        </button>
      </div>
    </div>
  );
}
