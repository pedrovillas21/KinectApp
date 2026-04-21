import React, { createContext } from 'react';

export const ThemeContext = createContext({
  isDarkMode: true,
  toggleTheme: () => {}
});

/**
 * ThemeProvider — fixado em Dark Mode.
 * O toggleTheme está preservado na API mas não troca o tema
 * até que o recurso seja habilitado pelo usuário.
 */
export const ThemeProvider = ({ children }) => {
  const isDarkMode = true; // Dark mode fixo
  const toggleTheme = () => {}; // Reservado para uso futuro

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
