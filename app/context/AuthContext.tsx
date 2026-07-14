"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  username: string; // Compat alias for sidebar and components
  token: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user session exists in localStorage and validate the token/casing
    const savedUser = localStorage.getItem("auravisuals_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        if (parsed && typeof parsed === "object" && parsed.id) {
          // If token matches, accept it
          if (parsed.token === "mock-jwt-token-xyz-123") {
            setUser(parsed);
          } else {
            localStorage.removeItem("auravisuals_user");
          }
        } else {
          localStorage.removeItem("auravisuals_user");
        }
      } catch (e) {
        localStorage.removeItem("auravisuals_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (usernameInput: string, passwordInput: string): Promise<boolean> => {
    setError(null);
    setLoading(true);

    try {
      // Map basic 'admin' username to standard email format
      let email = usernameInput.trim();
      if (!email.includes("@")) {
        email = email === "admin" ? "admin@auravisuals.com" : `${email}@auravisuals.com`;
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password: passwordInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid username or password");
      }

      const loggedInUser: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        company: data.user.company,
        username: data.user.name, // Compat mapping
        token: data.user.token,
      };

      localStorage.setItem("auravisuals_user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("auravisuals_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
