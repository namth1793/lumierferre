import { createContext, useContext, useState } from 'react';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  // Đọc phiên đăng nhập ngay lần render đầu, nếu không F5 trang admin sẽ bị đẩy về trang đăng nhập/tổng quan
  const [admin, setAdmin] = useState(() => {
    try {
      const token = localStorage.getItem('lf_admin_token');
      const user = localStorage.getItem('lf_admin_user');
      return token && user ? { token, ...JSON.parse(user) } : null;
    } catch { return null; }
  });

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

  const authFetch = async (url, opts = {}) => {
    const res = await fetch(url, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin?.token || ''}`,
        ...opts.headers,
      },
    });
    // Phiên đăng nhập hết hạn (24h) → đăng xuất để AdminLayout chuyển về trang đăng nhập
    if (res.status === 401) logout();
    return res;
  };

  return (
    <AdminContext.Provider value={{ admin, login, logout, authFetch }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
