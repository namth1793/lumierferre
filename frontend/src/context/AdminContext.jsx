import { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('lf_admin_token');
    const user = localStorage.getItem('lf_admin_user');
    if (token && user) setAdmin({ token, ...JSON.parse(user) });
  }, []);

  const login = (token, username) => {
    localStorage.setItem('lf_admin_token', token);
    localStorage.setItem('lf_admin_user', JSON.stringify({ username }));
    setAdmin({ token, username });
  };

  const logout = () => {
    localStorage.removeItem('lf_admin_token');
    localStorage.removeItem('lf_admin_user');
    setAdmin(null);
  };

  const authFetch = (url, opts = {}) => {
    return fetch(url, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin?.token || ''}`,
        ...opts.headers,
      },
    });
  };

  return (
    <AdminContext.Provider value={{ admin, login, logout, authFetch }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
