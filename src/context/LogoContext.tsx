import React, { createContext, useContext, useState, useEffect } from 'react';

interface LogoContextType {
  customLogoUrl: string | null;
  setCustomLogoUrl: (url: string | null) => void;
  isUploadModalOpen: boolean;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  resetLogo: () => void;
}

const STORAGE_KEY = 'stol_corporate_logo_v1';

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export const LogoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customLogoUrl, setCustomLogoUrlState] = useState<string | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(STORAGE_KEY) || null;
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const setCustomLogoUrl = (url: string | null) => {
    setCustomLogoUrlState(url);
    try {
      if (url) {
        localStorage.setItem(STORAGE_KEY, url);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Could not persist logo in localStorage', e);
    }
  };

  const resetLogo = () => {
    setCustomLogoUrl(null);
  };

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  return (
    <LogoContext.Provider
      value={{
        customLogoUrl,
        setCustomLogoUrl,
        isUploadModalOpen,
        openUploadModal,
        closeUploadModal,
        resetLogo,
      }}
    >
      {children}
    </LogoContext.Provider>
  );
};

export const useLogo = () => {
  const context = useContext(LogoContext);
  if (!context) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  return context;
};
