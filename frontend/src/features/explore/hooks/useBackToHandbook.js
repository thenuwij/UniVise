import { useLocation, useNavigate } from "react-router-dom";

export function useBackToHandbook() {
  const navigate = useNavigate();
  const location = useLocation();
  return () => (location.key === "default" ? navigate("/handbook") : navigate(-1));
}
