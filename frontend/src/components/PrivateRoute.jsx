import React, { useEffect, useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const { session } = UserAuth();

  if (session === undefined) {
    console.log(session)
    return <div>Loading...</div>;
  }

  return <div>{session ? <>{children}</> : <Navigate to="/login" replace />}</div>;
};

export default PrivateRoute;