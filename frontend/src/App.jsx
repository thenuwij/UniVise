import { UserAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";

function App() {
  const { user } = UserAuth();

  // console.log(user);

  return (
    <>
      <LoginPage />
    </>
  );
}

export default App;