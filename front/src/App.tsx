import { useState } from "react";
import Login from "./pages/Login";
import Lista from "./pages/Lista";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <>
      {!isLoggedIn ? <Login onSuccess={handleLoginSuccess} /> : <Lista />}
    </>
  );
}
