import { create } from "zustand";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      const u = localStorage.getItem("valreport_user");
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  })(),
  token: localStorage.getItem("valreport_token"),
  isAuthenticated: !!localStorage.getItem("valreport_token"),

  setAuth: (user, token) => {
    localStorage.setItem("valreport_token", token);
    localStorage.setItem("valreport_user", JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem("valreport_token");
    localStorage.removeItem("valreport_user");
    set({ user: null, token: null, isAuthenticated: false });
  },
}));