import { createContext } from "react";
import type { AuthUser } from "./AuthContext";

export type AuthContextValue = { user: AuthUser; setUser: (u: AuthUser) => void; loading: boolean };
export const AuthContext = createContext<AuthContextValue>({ user: null, setUser: () => {}, loading: true });
