import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('lf_user_token');
    const data = localStorage.getItem('lf_user_data');
    if (token && data) {
      try {
        const decoded = JSON.parse(atob(token));
        if (Date.now() - decoded.ts < 30 * 24 * 60 * 60 * 1000) {
          setUser({ ...JSON.parse(data), token });
        } else {
          localStorage.removeItem('lf_user_token');
          localStorage.removeItem('lf_user_data');
        }
      } catch {
        localStorage.removeItem('lf_user_token');
        localStorage.removeItem('lf_user_data');
      }
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('lf_user_token', token);
    localStorage.setItem('lf_user_data', JSON.stringify(userData));
    setUser({ ...userData, token });
    setDrawerOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('lf_user_token');
    localStorage.removeItem('lf_user_data');
    setUser(null);
  };

  const openAuthDrawer = () => setDrawerOpen(true);
  const closeAuthDrawer = () => setDrawerOpen(false);

  return (
    <UserContext.Provider value={{ user, login, logout, drawerOpen, openAuthDrawer, closeAuthDrawer }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
