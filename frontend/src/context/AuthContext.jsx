import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);

  //Register
  const registerNewUser = async (email, password, firstName, lastName, dob, gender) => {
    const {data, error} = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          dob: dob,
          gender: gender
        }
      }
    });

    if(error) {
      console.error("User Error Signing Up")
      return { success: false, error };
      
    }
    return { success: true, data };
  }

  const signInUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });
    if (error) {
      console.error("Sign in error occurred", error);
      return { success: false, error: error.message };
    }
    setSession(data.session);
    console.log("Signed in, session now:", data.session);
    return { success: true, data };
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    console.log("Signed out", session)
    if (error) {
      console.error("Sign out had an error");
    }
  }

  return (
    <AuthContext.Provider value={{ session, registerNewUser, signOut, signInUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const UserAuth = () => {
  return useContext(AuthContext);
}