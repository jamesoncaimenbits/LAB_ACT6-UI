import { useEffect, useState } from 'react';
import { getTokens, clearTokens } from './api';
import Login from './Login';
import Products from './Products';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!getTokens());

  useEffect(() => {
    const onExpired = () => setLoggedIn(false);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const logout = () => {
    clearTokens();
    setLoggedIn(false);
  };

  return loggedIn ? (
    <Products onLogout={logout} />
  ) : (
    <Login onSuccess={() => setLoggedIn(true)} />
  );
}