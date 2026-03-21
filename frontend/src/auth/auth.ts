import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import type { DecodedToken } from "../types/types";

export const setToken = (token: string) => localStorage.setItem("bl_token", token);
export const getToken = () => localStorage.getItem("bl_token");
export const removeToken = () => localStorage.removeItem("bl_token");

export const decodeToken = (token: string): DecodedToken => jwtDecode(token);

export const useAdminUser = () => {
  const [user, setUser] = useState<DecodedToken | null>(null);
  useEffect(() => {
    const token = getToken();
    if (token) {
      try { setUser(decodeToken(token)); }
      catch { removeToken(); }
    }
  }, []);
  return user;
};

export const signOut = (navigate: (path: string) => void) => {
  removeToken();
  navigate("/login");
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;
  try {
    const decoded = decodeToken(token);
    return decoded.exp * 1000 > Date.now();
  } catch { return false; }
};