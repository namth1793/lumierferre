import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SiteSettingsContext = createContext(null);

const DEFAULTS = {
  general: { site_name: 'LUMIE FERRE', logo_url: '', announcement_text: '', footer_address_hn: '', footer_address_hcm: '', footer_phone: '', footer_email: '', footer_hours: '', facebook_url: '', instagram_handle: '', pinterest_handle: '' },
  home: { hero_slides: [], about_image: '', about_label: '', about_title1: '', about_title2: '', about_desc1: '', about_desc2: '', quote_label: '', quote_text: '' },
  about: { hero_image: '', story_label: '', heading_line1: '', heading_line2: '', story1: '', story2: '', story3: '', atelier_image1: '', atelier_image2: '', atelier_title1: '', atelier_title2: '', atelier_desc1: '', atelier_desc2: '', team: [], stats: [] },
  contact: { showrooms: [], bespoke_title: '', bespoke_desc: '' },
};

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  const refetch = useCallback(() => {
    return fetch('/api/settings')
      .then(r => r.json())
      .then(data => setSettings(prev => ({
        general: { ...prev.general, ...(data.general || {}) },
        home: { ...prev.home, ...(data.home || {}) },
        about: { ...prev.about, ...(data.about || {}) },
        contact: { ...prev.contact, ...(data.contact || {}) },
      })))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    refetch();
    // Admin sửa ở tab khác → quay lại tab web là thấy ngay
    const onVisible = () => { if (document.visibilityState === 'visible') refetch(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refetch]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loaded, refetch }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export const useSiteSettings = () => useContext(SiteSettingsContext);
