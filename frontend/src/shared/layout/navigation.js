export function isNavigationActive(section, pathname) {
  switch (section) {
    case "dashboard":
      return pathname === "/dashboard";
    case "roadmap":
      return (
        pathname === "/roadmap-entryload" ||
        pathname === "/roadmap-loading" ||
        pathname.startsWith("/roadmap/")
      );
    case "careers":
      return pathname === "/careers";
    case "eunice":
      return pathname === "/chat" || pathname.startsWith("/chat/");
    default:
      return false;
  }
}
