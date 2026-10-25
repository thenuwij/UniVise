import { useState } from "react";
import { HiMoon, HiSun } from "react-icons/hi";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.svg";
import IndependenceBanner from "@/shared/ui/IndependenceBanner";
import "./navigation.css";

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
    <header id="header" className="app-navigation app-header-surface">
      <div className="app-nav-inner">
        <Link to="/" className="app-nav-brand" aria-label="UniVise home">
          <img src={logo} alt="" />
          <span>UniVise</span>
        </Link>
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="ml-auto flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-200"
        >
          {isDark
            ? <HiSun className="w-5 h-5 text-amber-500" />
            : <HiMoon className="w-5 h-5 text-blue-700" />
          }
        </button>
      </div>
      <IndependenceBanner />
    </header>
  );
}
