import { useState } from 'react';
import Login from './pages/Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Aqui você pode passar essa função para o Login.tsx para atualizar o estado
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <>
      {!isLoggedIn ? (
        <Login onSuccess={handleLoginSuccess} />
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-green-500">
          <h1 className="text-white text-3xl font-bold">
            Você está logado!
          </h1>
        </div>
      )}
    </>
  );
}

export default App;
