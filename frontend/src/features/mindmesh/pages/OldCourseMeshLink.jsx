import { Navigate, useLocation } from "react-router-dom";

export default function OldCourseMeshLink() {
  const { search } = useLocation();
  return <Navigate to={`/coursemesh${search}`} replace />;
}
