import React, { createContext, ReactNode } from 'react';

interface ThemeContextValue {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  isDarkMode: true,
  toggleTheme: () => {},
});

// Dark mode is fixed — toggleTheme is preserved in the API for future use.
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const isDarkMode = true;
  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
