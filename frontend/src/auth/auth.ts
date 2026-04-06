import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import type { DecodedToken } from "../types/types";

// Auth is now removed; these are kept as mocks for compatibility
export const setToken = (_token: string) => {};
export const getToken = () => "mock-admin-token";
export const removeToken = () => {};

export const decodeToken = (_token: string): DecodedToken => ({
  id: "admin-id",
  email: "admin@nbsc.edu.ph",
  role: "ADMIN",
  username: "admin",
  name: "Administrator",
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
});

export const useAdminUser = () => {
  const [user, setUser] = useState<DecodedToken | null>(null);
  useEffect(() => {
    setUser(decodeToken("mock"));
  }, []);
  return user;
};

export const signOut = (_navigate?: (path: string) => void) => {
  // No-op
};

export const isAuthenticated = (): boolean => true;