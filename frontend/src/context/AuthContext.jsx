import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState();

  //Register
  const registerNewUser = async ( email, password ) => {
    const {data, error} = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    if(error) {
      console.error("User Error Signing Up")
      return { success: false, error };
    }
    return { success: true, data };
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: {session }}) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  },[]);

  const signOut = () => {
    const {error} = supabase.auth.signOut();
    if (error) {
      console.error("Sign out had an error");
    }
  }

  const signInUser = ( email, password ) => {
    try {
      const {data, error} = supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (error) {
        console.error("Sign in error occured", error);
        return { success:false, error: error.message }
      }

      console.log("sign in success", data);
      return { success: true, data}


    } catch(error) {
      console.error("An error occured", error)
    }
  }

  return (
    <AuthContext.Provider value={{session, registerNewUser, signOut, signInUser}}>
      {children}
    </AuthContext.Provider>
  )
}

export const UserAuth = () => {
  return useContext(AuthContext);
}