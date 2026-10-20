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
    case "coursemesh":
      return pathname === "/coursemesh";
    case "explore":
      return (
        pathname === "/roadmap" ||
        pathname === "/handbook" ||
        pathname === "/compare" ||
        ["/degrees/", "/course/", "/specialisation/"].some((prefix) =>
          pathname.startsWith(prefix),
        )
      );
    default:
      return false;
  }
}
