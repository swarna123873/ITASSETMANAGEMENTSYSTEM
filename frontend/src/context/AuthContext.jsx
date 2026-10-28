import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('assethub_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/auth/me/', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('assethub_user', JSON.stringify(data.user));
        } else if (!localStorage.getItem('assethub_user')) {
          setCurrentUser(null);
        }
      })
      .catch(() => {
        // Fall back to saved local storage user if offline
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const loginUser = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('assethub_user', JSON.stringify(userData));
  };

  const logoutUser = async () => {
    try {
      await fetch('http://127.0.0.1:8000/api/auth/logout/', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors on logout
    }
    setCurrentUser(null);
    localStorage.removeItem('assethub_user');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin: currentUser?.role === 'ADMIN',
        isStaff: currentUser?.role === 'STAFF',
        isAuthenticated: !!currentUser,
        isLoading,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
