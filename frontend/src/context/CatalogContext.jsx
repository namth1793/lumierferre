import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Danh mục + bộ sưu tập dùng chung cho navbar, footer, bộ lọc... lấy từ DB để luôn khớp với admin
const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);

  const refetch = useCallback(() => Promise.all([
    fetch('/api/categories').then(r => r.json()).then(d => Array.isArray(d) && setCategories(d)).catch(() => {}),
    fetch('/api/collections').then(r => r.json()).then(d => Array.isArray(d) && setCollections(d)).catch(() => {}),
  ]), []);

  useEffect(() => {
    refetch();
    // Admin sửa ở tab khác → quay lại tab web là thấy ngay
    const onVisible = () => { if (document.visibilityState === 'visible') refetch(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refetch]);

  return (
    <CatalogContext.Provider value={{ categories, collections, refetch }}>
      {children}
    </CatalogContext.Provider>
  );
}

export const useCatalog = () => useContext(CatalogContext);
