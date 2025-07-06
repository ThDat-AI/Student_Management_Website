// contexts/LayoutContext.jsx
import React, { createContext, useState, useContext } from 'react';

const LayoutContext = createContext();

export const useLayout = () => useContext(LayoutContext);

export const LayoutProvider = ({ children }) => {
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const value = { pageTitle, setPageTitle };
  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};