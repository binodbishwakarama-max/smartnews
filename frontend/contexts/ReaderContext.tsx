'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import ReaderModal from '../components/ReaderModal';

interface ReaderContextType {
  activeArticleId: number | null;
  openReader: (id: number) => void;
  closeReader: () => void;
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [activeArticleId, setActiveArticleId] = useState<number | null>(null);

  const openReader = (id: number) => {
    setActiveArticleId(id);
  };

  const closeReader = () => {
    setActiveArticleId(null);
  };

  return (
    <ReaderContext.Provider value={{ activeArticleId, openReader, closeReader }}>
      {children}
      {activeArticleId !== null && (
        <ReaderModal articleId={activeArticleId} onClose={closeReader} />
      )}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  const context = useContext(ReaderContext);
  if (context === undefined) {
    throw new Error('useReader must be used within a ReaderProvider');
  }
  return context;
}
