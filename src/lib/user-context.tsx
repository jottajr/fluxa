"use client";

import { createContext, useContext, type ReactNode } from "react";

interface UserContextValue {
  userName: string;
  userEmail: string;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({
  userName,
  userEmail,
  children,
}: UserContextValue & { children: ReactNode }) {
  return (
    <UserContext.Provider value={{ userName, userEmail }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser deve ser usado dentro de um UserProvider");
  }
  return context;
}
