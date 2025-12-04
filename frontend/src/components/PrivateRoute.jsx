import { Navigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { session } = UserAuth();

  if (session === undefined) {
    console.log(session)
    return <div>Loading...</div>;
  }

  return <div>{session ? <>{children}</> : <Navigate to="/login" replace />}</div>;
};

export default PrivateRoute; 