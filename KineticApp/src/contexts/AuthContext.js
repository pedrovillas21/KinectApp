import React, { createContext, useState } from 'react';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  // Banco de dados mock de usuários em memória
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // hasOnboarded é por USUÁRIO (persistido no objeto do usuário)
  // Assim quem jáfez onboarding vai direto para a Home no próximo login

  const register = ({ name, email, password }) => {
    if (!name || !email || !password) {
      return { success: false, error: 'Preencha todos os campos.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'A senha precisa ter ao menos 6 caracteres.' };
    }
    const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { success: false, error: 'E-mail já cadastrado.' };
    }

    // hasOnboarded fica salvo junto com o usuário
    const newUser = { name, email, password, hasOnboarded: false };
    setUsers((prev) => [...prev, newUser]);
    return { success: true };
  };

  const signIn = ({ email, password }) => {
    if (!email || !password) {
      return { success: false, error: 'Preencha e-mail e senha.' };
    }

    const found = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    );

    if (!found) {
      return { success: false, error: 'E-mail ou senha incorretos.' };
    }

    setCurrentUser(found);
    setIsLoggedIn(true);
    return { success: true };
  };

  const signOut = () => {
    // Salva o estado de onboarding antes de deslogar
    if (currentUser) {
      setUsers((prev) =>
        prev.map((u) => u.email === currentUser.email ? currentUser : u)
      );
    }
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  const completeOnboarding = () => {
    const updated = { ...currentUser, hasOnboarded: true };
    setCurrentUser(updated);
    // Persiste no banco mock também
    setUsers((prev) =>
      prev.map((u) => u.email === updated.email ? updated : u)
    );
  };

  const resetPassword = (email, newPassword) => {
    if (!email || !newPassword) {
      return { success: false, error: 'Dados inválidos.' };
    }
    if (newPassword.length < 6) {
      return { success: false, error: 'A nova senha precisa ter ao menos 6 caracteres.' };
    }
    const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!exists) {
      return { success: false, error: 'E-mail não encontrado.' };
    }

    // Atualiza a senha no banco mock
    setUsers((prev) =>
      prev.map((u) =>
        u.email.toLowerCase() === email.toLowerCase()
          ? { ...u, password: newPassword }
          : u
      )
    );
    return { success: true };
  };

  // hasOnboarded agora vem do currentUser
  const hasOnboarded = currentUser?.hasOnboarded ?? false;

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, hasOnboarded, currentUser, signIn, signOut, register, completeOnboarding, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};
